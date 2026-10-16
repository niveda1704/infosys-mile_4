"""SwipeX API gateway - the ONLY address the frontend talks to (default http://127.0.0.1:5000/api/v1).

    /api/v1/auth/*           -> auth-service
    /api/v1/jobs/*           -> job-service  (jobs, swipes, saved, applications, recruiter applicants)
    /api/v1/companies/*      -> job-service
    /api/v1/notifications/*  -> job-service
    /api/v1/analytics/*      -> job-service
    /api/v1/resumes/*        -> resume-service (which calls the AI service itself)
    /api/v1/ai/*             -> ai-service   (JWT checked here; user_id injected from the token)
    /health, /api/v1/health  -> aggregated health of every service

Every method (GET/POST/PUT/PATCH/DELETE) and multipart uploads pass through untouched.
"""
import os
import threading
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import jwt
import requests
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

for _p in Path(__file__).resolve().parents:
    if (_p / ".env").is_file():
        load_dotenv(_p / ".env", override=False)
        break

SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:5001").rstrip("/"),
    "job": os.getenv("JOB_SERVICE_URL", "http://127.0.0.1:5002").rstrip("/"),
    "resume": os.getenv("RESUME_SERVICE_URL", "http://127.0.0.1:5003").rstrip("/"),
    "ai": os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8000").rstrip("/"),
}
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "")
ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
).split(",") if o.strip()]

# /api/v1/<prefix>/... -> (service, upstream prefix)
ROUTES = {
    "auth": ("auth", "/api/v1/auth"),
    "jobs": ("job", "/api/v1/jobs"),
    "companies": ("job", "/api/v1/companies"),
    "notifications": ("job", "/api/v1/notifications"),
    "analytics": ("job", "/api/v1/analytics"),
    "resumes": ("resume", "/api/v1/resumes"),
}
# Public path -> AI path. Only these are exposed; /match/candidates and /index/* stay internal.
AI_ALLOWED = ("recommendations", "deck", "engine", "resume", "insights")
METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
HOP = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers",
       "transfer-encoding", "upgrade", "content-length", "content-encoding", "host"}

app = Flask(__name__)
app.url_map.strict_slashes = False
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
CORS(app, origins=ORIGINS, methods=METHODS, allow_headers=["Authorization", "Content-Type"],
     expose_headers=["Content-Disposition"], max_age=600)


# ---------------------------------------------------------------- rate limiting + security headers
RATE_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "1") == "1"
RATE_AUTH = int(os.getenv("RATE_LIMIT_AUTH_PER_MIN", "20"))        # login / register / password reset
RATE_AI = int(os.getenv("RATE_LIMIT_AI_PER_MIN", "120"))
RATE_GENERAL = int(os.getenv("RATE_LIMIT_GENERAL_PER_MIN", "300"))
TRUST_PROXY = os.getenv("TRUST_PROXY", "0") == "1"
_hits = defaultdict(deque)
_hits_lock = threading.Lock()
_AUTH_SENSITIVE = ("login", "register", "forgot-password", "reset-password", "refresh")


def _client_ip():
    if TRUST_PROXY and request.headers.get("X-Forwarded-For"):
        return request.headers["X-Forwarded-For"].split(",")[0].strip()
    return request.remote_addr or "unknown"


def _bucket():
    path = request.path
    if path.startswith("/api/v1/auth/") and path.rsplit("/", 1)[-1] in _AUTH_SENSITIVE:
        return "auth", RATE_AUTH
    if path.startswith("/api/v1/ai/") or path.startswith("/api/v1/recommendations"):
        return "ai", RATE_AI
    return "general", RATE_GENERAL


@app.before_request
def rate_limit():
    if not RATE_ENABLED or request.method == "OPTIONS" or request.path in ("/health", "/api/v1/health"):
        return None
    name, limit = _bucket()
    key, now = (_client_ip(), name), time.monotonic()
    with _hits_lock:
        window = _hits[key]
        while window and now - window[0] > 60:
            window.popleft()
        if len(window) >= limit:
            retry = max(1, int(60 - (now - window[0])))
            resp = jsonify({"success": False, "message": "Too many requests. Please slow down."})
            resp.status_code = 429
            resp.headers["Retry-After"] = str(retry)
            return resp
        window.append(now)
        if len(_hits) > 20000:  # bound memory: drop idle keys
            for k in [k for k, w in _hits.items() if not w or now - w[-1] > 60]:
                _hits.pop(k, None)
    return None


@app.after_request
def security_headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    resp.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
    resp.headers.setdefault("Cache-Control", "no-store")
    if request.is_secure or request.headers.get("X-Forwarded-Proto") == "https":
        resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return resp


def _err(msg, status):
    return jsonify({"success": False, "message": msg}), status


def forward(service, upstream_path, params=None, extra_headers=None, timeout=60):
    headers = {k: v for k, v in request.headers if k.lower() not in HOP}
    headers["X-Forwarded-Host"] = request.host
    headers["X-Forwarded-Proto"] = request.scheme
    if extra_headers:
        headers.update(extra_headers)
    try:
        r = requests.request(
            request.method, SERVICES[service] + upstream_path, headers=headers,
            params=params if params is not None else request.args, data=request.get_data(),
            timeout=timeout, allow_redirects=False)
    except requests.exceptions.Timeout:
        return _err(f"{service} service timed out", 504)
    except requests.exceptions.ConnectionError:
        return _err(f"{service} service is not reachable", 502)
    out = Response(r.content, status=r.status_code)
    for k, v in r.headers.items():
        if k.lower() in ("content-type", "location", "content-disposition", "cache-control"):
            out.headers[k] = v
    return out


def _token_user():
    """Verify the bearer token (same secret as the services). -> (user_id, role) or (None, error response)."""
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None, _err("Authorization header with a Bearer token is required", 401)
    try:
        claims = jwt.decode(auth[7:].strip(), JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None, _err("Token has expired", 401)
    except jwt.InvalidTokenError:
        return None, _err("Invalid token", 401)
    if claims.get("type", "access") != "access" or not str(claims.get("sub", "")).isdigit():
        return None, _err("Invalid token", 401)
    return (claims["sub"], claims.get("role")), None


@app.route("/api/v1/ai/<path:path>", methods=METHODS)
def ai_proxy(path):
    if request.method == "OPTIONS":
        return "", 204
    if path.split("/")[0] not in AI_ALLOWED:
        return _err("Unknown AI endpoint", 404)
    ident, err = _token_user()
    if err:
        return err
    params = request.args.to_dict(flat=True)
    params["user_id"] = ident[0]  # never trust a client-supplied user_id
    hdr = {"X-Internal-Key": INTERNAL_KEY} if INTERNAL_KEY else None
    return forward("ai", "/api/v1/" + path, params=params, extra_headers=hdr, timeout=90)


@app.route("/api/v1/recommendations", methods=["GET", "OPTIONS"])
def legacy_recommendations():
    """Kept for older frontend builds: same as /api/v1/ai/recommendations."""
    if request.method == "OPTIONS":
        return "", 204
    ident, err = _token_user()
    if err:
        return err
    params = request.args.to_dict(flat=True)
    params["user_id"] = ident[0]
    hdr = {"X-Internal-Key": INTERNAL_KEY} if INTERNAL_KEY else None
    return forward("ai", "/api/v1/recommendations", params=params, extra_headers=hdr, timeout=90)


@app.route("/api/v1/swipes", methods=["POST", "OPTIONS"])
def legacy_swipes():
    """Old {job_id, action: APPLY|SKIP|SAVE} shape -> job-service swipe / save."""
    if request.method == "OPTIONS":
        return "", 204
    ident, err = _token_user()
    if err:
        return err
    body = request.get_json(silent=True) or {}
    job_id, action = body.get("job_id"), str(body.get("action", "")).upper()
    if not str(job_id).isdigit() or action not in ("APPLY", "SKIP", "SAVE", "RIGHT", "LEFT"):
        return _err("job_id (integer) and action (APPLY, SKIP or SAVE) are required", 400)
    auth = {"Authorization": request.headers["Authorization"]}
    try:
        if action == "SAVE":
            r = requests.post(f"{SERVICES['job']}/api/v1/jobs/{job_id}/save", headers=auth, timeout=30)
        else:
            direction = "RIGHT" if action in ("APPLY", "RIGHT") else "LEFT"
            r = requests.post(f"{SERVICES['job']}/api/v1/jobs/{job_id}/swipe", headers=auth,
                              json={"action": direction}, timeout=30)
    except requests.RequestException:
        return _err("job service is not reachable", 502)
    return Response(r.content, status=r.status_code, content_type=r.headers.get("Content-Type"))


@app.route("/api/v1/<prefix>", defaults={"rest": ""}, methods=METHODS)
@app.route("/api/v1/<prefix>/<path:rest>", methods=METHODS)
def generic_proxy(prefix, rest):
    if request.method == "OPTIONS":
        return "", 204
    target = ROUTES.get(prefix)
    if not target:
        return _err("Not found", 404)
    service, base = target
    path = base + ("/" + rest if rest else "/")
    return forward(service, path, timeout=120 if prefix == "resumes" else 60)


def _probe(item):
    name, url = item
    try:
        r = requests.get(url + "/health", timeout=3)
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        return name, {"status": "ok" if r.status_code == 200 else "error", **{
            k: v for k, v in body.items() if k in ("database", "embedding")}}
    except Exception:
        return name, {"status": "down"}


@app.get("/health")
@app.get("/api/v1/health")
def health():
    with ThreadPoolExecutor(max_workers=4) as ex:
        services = dict(ex.map(_probe, SERVICES.items()))
    ok = all(s["status"] == "ok" for s in services.values())
    return jsonify({"success": True, "service": "gateway", "status": "ok" if ok else "degraded",
                    "services": services}), 200


@app.get("/api/v1/routes")
def route_table():
    return jsonify({"prefixes": {f"/api/v1/{k}": SERVICES[v[0]] for k, v in ROUTES.items()},
                    "ai": [f"/api/v1/ai/{p}" for p in AI_ALLOWED]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("GATEWAY_PORT", "5000")), debug=False)
