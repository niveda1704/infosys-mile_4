"""Text -> vector layer for semantic matching, plus the persistent job-vector index.

Two interchangeable backends, chosen at runtime:

* ``sentence-transformers`` (default model all-MiniLM-L6-v2, 384-d): real semantic embeddings.
* ``hashing-concept`` (fallback, 768-d): signed hashed uni/bi-grams + "concept tokens" so that e.g.
  AWS / Azure / GCP / EKS land close together even when they share no words. It needs no model
  download, so the service always starts and answers; it is what runs when the model cannot be
  loaded (offline machine, EMBEDDING_FORCE_FALLBACK=1).

Job vectors are stored in Postgres (``ai_job_embeddings``) keyed by a hash of the job text and the
backend name, so a job is embedded once and re-embedded only when it is edited or the backend changes.
"""
import hashlib
import logging
import math
import os
import re
import threading
import time
import zlib
from collections import OrderedDict

import numpy as np

from src import db, job_store
from src.personalize import FAMILIES

log = logging.getLogger("swipex.ai.embeddings")

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
HASH_DIM = 768

_STOP = set("""a an the and or of to in on for with at by from as is are was were be been being this that these those
it its we you your our their they he she i will shall can could should would may might must have has had do does
did not no yes but if then than so such also etc using use used within across into over under per via about
experience experienced years year work working team teams role roles job jobs company candidate candidates
looking required requirements preferred ability strong good excellent knowledge understanding skills skill
responsibilities responsible build building develop developing development""".split())

# Concept clusters for the fallback backend. FAMILIES gives the role families; these add finer ones.
CONCEPTS = dict(FAMILIES)
CONCEPTS.update({
    "containers": ["docker", "kubernetes", "k8s", "helm", "container", "containers", "containerization",
                   "orchestration", "eks", "aks", "gke", "openshift"],
    "public_cloud": ["aws", "azure", "gcp", "google cloud", "ec2", "s3", "lambda", "eks", "aks", "gke",
                     "cloudformation", "serverless", "iam", "vpc", "cloud"],
    "ci_cd": ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "pipeline", "pipelines",
              "deployment", "release automation"],
    "iac": ["terraform", "ansible", "cloudformation", "pulumi", "infrastructure as code", "iac"],
    "observability": ["prometheus", "grafana", "monitoring", "logging", "observability", "datadog",
                      "elk", "alerting"],
    "databases": ["sql", "postgresql", "postgres", "mysql", "mongodb", "redis", "database", "databases",
                  "dynamodb", "sqlite", "oracle", "cassandra"],
    "web_frontend": ["react", "vue", "angular", "javascript", "typescript", "html", "css", "tailwind",
                     "next.js", "redux", "frontend", "front-end"],
    "python_stack": ["python", "flask", "django", "fastapi", "pandas", "numpy"],
    "jvm": ["java", "spring", "spring boot", "kotlin", "scala", "maven", "gradle"],
    "ml_core": ["machine learning", "deep learning", "neural network", "tensorflow", "pytorch", "keras",
                "scikit-learn", "sklearn", "model training", "xgboost"],
    "genai": ["llm", "rag", "langchain", "generative ai", "prompt engineering", "transformers",
              "hugging face", "embeddings", "vector database"],
    "data_pipeline": ["etl", "airflow", "spark", "kafka", "hadoop", "data pipeline", "data warehouse",
                      "snowflake", "bigquery"],
    "analytics_bi": ["power bi", "tableau", "excel", "dashboard", "dashboards", "data analysis",
                     "data visualization", "reporting", "statistics"],
    "testing_qa": ["testing", "qa", "selenium", "pytest", "jest", "junit", "cypress", "automation testing"],
    "security_core": ["security", "cybersecurity", "owasp", "penetration", "siem", "vulnerability", "infosec"],
    "api_design": ["rest", "rest api", "graphql", "grpc", "api", "apis", "microservices", "web services"],
    "mobile_dev": ["android", "ios", "flutter", "react native", "kotlin", "swift", "mobile"],
})
_CONCEPT_RE = {n: re.compile(r"(?<![a-z0-9])(?:" + "|".join(re.escape(k) for k in kws) + r")(?![a-z0-9])")
               for n, kws in CONCEPTS.items()}
_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9+#./-]*")


def _tokens(text):
    out = []
    for t in _TOKEN_RE.findall(text.lower()):
        t = t.rstrip("./-")
        if len(t) > 1 and t not in _STOP:
            out.append(t)
    return out


def _h(token):
    v = zlib.crc32(token.encode("utf-8"))
    return v % HASH_DIM, 1.0 if (v >> 16) & 1 else -1.0


def _hash_encode_one(text):
    vec = np.zeros(HASH_DIM, dtype=np.float64)
    toks = _tokens(text)
    tf = {}
    for t in toks:
        tf[t] = tf.get(t, 0) + 1
    for t, c in tf.items():
        i, s = _h("u:" + t)
        vec[i] += s * (1 + math.log(c))
    bi = {}
    for a, b in zip(toks, toks[1:]):
        bi[a + " " + b] = bi.get(a + " " + b, 0) + 1
    for t, c in bi.items():
        i, s = _h("b:" + t)
        vec[i] += s * 0.6 * (1 + math.log(c))
    low = text.lower()
    for name, rx in _CONCEPT_RE.items():
        c = len(rx.findall(low))
        if c:
            i, s = _h("c:" + name)
            vec[i] += s * 2.5 * (1 + math.log(c))
            j, s2 = _h("c2:" + name)  # second slot lowers collision damage on the strongest feature
            vec[j] += s2 * 2.5 * (1 + math.log(c))
    n = np.linalg.norm(vec)
    return vec / n if n else vec


class Embedder:
    """encode(texts) -> float32 array (n, dim), rows L2-normalised."""

    def __init__(self):
        self._lock = threading.Lock()
        self._st = None
        self._tried = False
        self.error = None
        self.kind = "hashing-concept"
        self.name = "hashing-concept-v1"
        self.dim = HASH_DIM
        # cosine -> 0..1 calibration anchors (below lo = unrelated, above hi = near-identical topic)
        self.lo, self.hi = 0.04, 0.45

    def _load(self):
        with self._lock:
            if self._tried:
                return
            self._tried = True
            if os.getenv("EMBEDDING_FORCE_FALLBACK", "0") == "1":
                self.error = "EMBEDDING_FORCE_FALLBACK=1"
                return
            try:
                from sentence_transformers import SentenceTransformer  # heavy import, on demand
                self._st = SentenceTransformer(MODEL_NAME)
                self.kind, self.name = "sentence-transformers", "st:" + MODEL_NAME
                self.dim = int(self._st.get_sentence_embedding_dimension())
                self.lo, self.hi = 0.15, 0.65
                log.info("Embedding backend: %s (%d-d)", self.name, self.dim)
            except Exception as exc:  # no package / no network / bad model name
                self.error = f"{type(exc).__name__}: {exc}"[:300]
                log.warning("sentence-transformers unavailable, using hashing fallback: %s", self.error)

    def warmup(self):
        self._load()
        return self.info()

    def info(self):
        return {"backend": self.kind, "name": self.name, "dim": self.dim, "fallback_reason": self.error}

    def encode(self, texts):
        self._load()
        texts = [t if t and t.strip() else " " for t in texts]
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)
        if self._st is not None:
            arr = self._st.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
            return np.asarray(arr, dtype=np.float32)
        return np.asarray([_hash_encode_one(t) for t in texts], dtype=np.float32)

    def calibrate(self, cos):
        """cosine similarity (scalar or array) -> relevance in [0, 1]."""
        return np.clip((np.asarray(cos, dtype=np.float64) - self.lo) / (self.hi - self.lo), 0.0, 1.0)


_embedder = None
_emb_lock = threading.Lock()


def get_embedder():
    global _embedder
    with _emb_lock:
        if _embedder is None:
            _embedder = Embedder()
        return _embedder


# ---------------------------------------------------------------- text builders / small LRU
def job_text(j):
    skills = ", ".join(j["skills"])
    return (f"{j['title']}. {j['title']}. Skills: {skills}. {j.get('qualifications') or ''} "
            f"{(j.get('description') or '')[:1500]}").strip()


class _LRU:
    def __init__(self, cap=512):
        self.cap, self.d, self.lock = cap, OrderedDict(), threading.Lock()

    def get(self, k):
        with self.lock:
            if k in self.d:
                self.d.move_to_end(k)
                return self.d[k]

    def put(self, k, v):
        with self.lock:
            self.d[k] = v
            self.d.move_to_end(k)
            while len(self.d) > self.cap:
                self.d.popitem(last=False)


_text_cache = _LRU()


def encode_text(text):
    """One vector for an arbitrary text, cached per (backend, text)."""
    emb = get_embedder()
    emb._load()
    key = emb.name + ":" + hashlib.md5(text.encode("utf-8", "ignore")).hexdigest()
    v = _text_cache.get(key)
    if v is None:
        v = emb.encode([text])[0]
        _text_cache.put(key, v)
    return v


# ---------------------------------------------------------------- persistent job index
class JobIndex:
    def __init__(self, jobs, matrix, fingerprint, model):
        self.jobs, self.matrix, self.fingerprint, self.model = jobs, matrix, fingerprint, model
        self.ids = [j["id"] for j in jobs]
        self.pos = {j["id"]: i for i, j in enumerate(jobs)}
        self.by_id = {j["id"]: j for j in jobs}
        self.built_at = time.time()


_index = None
_index_lock = threading.Lock()
INDEX_TTL = float(os.getenv("JOB_INDEX_TTL_SECONDS", "15"))


def _stored_vectors(ids, model):
    if not ids:
        return {}
    try:
        rows = db.query("SELECT job_id, content_hash, vector FROM ai_job_embeddings "
                        "WHERE model = %s AND job_id = ANY(%s)", (model, list(ids)))
    except Exception as exc:
        log.warning("could not read ai_job_embeddings: %s", exc)
        return {}
    return {r["job_id"]: (r["content_hash"], np.asarray(r["vector"], dtype=np.float32)) for r in rows}


def build_index():
    """Load active jobs, reuse stored vectors whose text hash still matches, embed the rest."""
    emb = get_embedder()
    emb._load()
    fp = job_store.jobs_fingerprint()
    jobs = job_store.load_jobs()
    texts = [job_text(j) for j in jobs]
    hashes = [hashlib.md5(t.encode("utf-8", "ignore")).hexdigest() for t in texts]
    stored = _stored_vectors([j["id"] for j in jobs], emb.name)
    vecs, todo = [None] * len(jobs), []
    for i, j in enumerate(jobs):
        hit = stored.get(j["id"])
        if hit and hit[0] == hashes[i] and hit[1].shape[0] == emb.dim:
            vecs[i] = hit[1]
        else:
            todo.append(i)
    if todo:
        fresh = emb.encode([texts[i] for i in todo])
        for k, i in enumerate(todo):
            vecs[i] = fresh[k]
        try:
            db.executemany(
                "INSERT INTO ai_job_embeddings (job_id, content_hash, model, dim, vector) VALUES (%s,%s,%s,%s,%s) "
                "ON CONFLICT (job_id) DO UPDATE SET content_hash = EXCLUDED.content_hash, model = EXCLUDED.model, "
                "dim = EXCLUDED.dim, vector = EXCLUDED.vector, updated_at = now()",
                [(jobs[i]["id"], hashes[i], emb.name, int(emb.dim), [float(x) for x in vecs[i]]) for i in todo])
        except Exception as exc:
            log.warning("could not persist job embeddings: %s", exc)
    if jobs:
        try:
            db.execute("DELETE FROM ai_job_embeddings WHERE job_id <> ALL(%s)", ([j["id"] for j in jobs],))
        except Exception:
            pass
    matrix = np.vstack(vecs).astype(np.float32) if vecs else np.zeros((0, emb.dim), dtype=np.float32)
    return JobIndex(jobs, matrix, fp, emb.name), len(todo)


def get_index(force=False):
    """Cached JobIndex; rebuilt when jobs change (fingerprint) or the TTL lapses."""
    global _index
    with _index_lock:
        emb = get_embedder()
        emb._load()  # backend name is only final after the model load attempt
        if not force and _index is not None and _index.model == emb.name:
            if time.time() - _index.built_at < INDEX_TTL:
                return _index
            try:
                if job_store.jobs_fingerprint() == _index.fingerprint:
                    _index.built_at = time.time()
                    return _index
            except Exception:
                return _index
        _index, _ = build_index()
        return _index
