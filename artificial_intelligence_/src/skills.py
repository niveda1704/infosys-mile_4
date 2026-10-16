"""Skill extraction: a curated vocabulary (+ aliases) matched with word-boundary regexes.

No spaCy needed. Short / ambiguous names ("C", "R", "Go") are matched case-sensitively so ordinary
words do not create false positives. `extra` lets callers add a dynamic vocabulary (e.g. every skill
that appears in the jobs table) so new job skills are recognised in resumes automatically.
"""
import re

CURATED_SKILLS = [
    # languages
    "Python", "Java", "C", "C++", "C#", "Go", "Rust", "R", "Ruby", "PHP", "Kotlin", "Swift", "Scala",
    "JavaScript", "TypeScript", "SQL", "Bash", "Shell Scripting", "MATLAB", "Dart",
    # web / frontend
    "React", "React Native", "Next.js", "Vue", "Angular", "Redux", "HTML", "CSS", "Tailwind CSS",
    "Bootstrap", "jQuery", "Webpack", "Vite", "Figma", "Material UI",
    # backend
    "Node.js", "Express", "Flask", "Django", "FastAPI", "Spring Boot", "Spring", ".NET", "Laravel",
    "REST API", "GraphQL", "gRPC", "Microservices", "WebSockets", "JWT", "OAuth",
    # data stores
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Elasticsearch", "Cassandra", "DynamoDB",
    "Firebase", "Oracle", "SQL Server", "Snowflake", "BigQuery",
    # cloud / devops
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins",
    "GitHub Actions", "GitLab CI", "CI/CD", "Linux", "Nginx", "Helm", "Prometheus", "Grafana",
    "CloudFormation", "EC2", "S3", "Lambda", "EKS", "IAM", "VPC", "DevOps", "Git", "GitHub",
    "Networking", "Serverless", "Cloud Computing", "Monitoring", "Load Balancing",
    # data / ml
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    "Scikit-learn", "Keras", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "OpenCV",
    "LangChain", "RAG", "LLM", "Hugging Face", "Transformers", "XGBoost", "Spark", "Hadoop", "Kafka",
    "Airflow", "ETL", "Data Analysis", "Data Visualization", "Statistics", "Power BI", "Tableau",
    "Excel", "Jupyter", "MLOps", "Feature Engineering", "Prompt Engineering",
    # mobile / other
    "Android", "iOS", "Flutter", "Unity",
    # security / testing
    "Cybersecurity", "Penetration Testing", "OWASP", "SIEM", "Selenium", "Pytest", "Jest", "JUnit",
    "Unit Testing", "Postman", "Cypress",
    # practice
    "Agile", "Scrum", "Jira", "System Design", "Data Structures", "Algorithms", "OOP",
]

ALIASES = {
    "k8s": "Kubernetes", "js": "JavaScript", "ts": "TypeScript", "nodejs": "Node.js", "node": "Node.js",
    "node js": "Node.js", "reactjs": "React", "react.js": "React", "vuejs": "Vue", "vue.js": "Vue",
    "nextjs": "Next.js", "postgres": "PostgreSQL", "psql": "PostgreSQL", "mongo": "MongoDB",
    "sklearn": "Scikit-learn", "scikit learn": "Scikit-learn", "tf": "TensorFlow", "ml": "Machine Learning",
    "amazon web services": "AWS", "gcp": "Google Cloud", "google cloud platform": "Google Cloud",
    "natural language processing": "NLP", "large language models": "LLM", "large language model": "LLM",
    "restful api": "REST API", "restful apis": "REST API", "rest apis": "REST API", "rest": "REST API",
    "tailwind": "Tailwind CSS", "cicd": "CI/CD", "ci cd": "CI/CD", "expressjs": "Express",
    "springboot": "Spring Boot", "dotnet": ".NET", "golang": "Go", "mssql": "SQL Server",
    "powerbi": "Power BI", "gh actions": "GitHub Actions", "huggingface": "Hugging Face",
}

# Names that are ordinary words or single letters: match them case-sensitively.
_CASE_SENSITIVE = {"C", "R", "Go", "Swift", "Spring", "Express", "Unity", "Excel", "Jest", "Rust", "Scala",
                   "Dart", "Git", "Vue", "Lambda", "Shell Scripting"}
_CANON = {s.lower(): s for s in CURATED_SKILLS}
_cache = {}


def canonical(skill):
    """'k8s' -> 'Kubernetes', 'python' -> 'Python', unknown names are returned stripped as-is."""
    s = str(skill or "").strip()
    low = s.lower()
    return ALIASES.get(low) or _CANON.get(low) or s


def _pattern(term, case_sensitive):
    flags = 0 if case_sensitive else re.I
    return re.compile(r"(?<![A-Za-z0-9+#.])" + re.escape(term) + r"(?![A-Za-z0-9+#]|\.[A-Za-z0-9])", flags)


def _compiled(extra):
    key = tuple(sorted(extra or ()))
    if key in _cache:
        return _cache[key]
    items = []  # (regex, canonical name)
    for s in CURATED_SKILLS:
        items.append((_pattern(s, s in _CASE_SENSITIVE or len(s) <= 2), s))
    for alias, target in ALIASES.items():
        if len(alias) > 2 or alias in ("js", "ts", "tf", "ml"):
            items.append((_pattern(alias, True if len(alias) <= 3 else False), target))
    known = {s.lower() for s in CURATED_SKILLS}
    for s in extra or ():
        s = str(s).strip()
        if len(s) > 2 and s.lower() not in known and s.lower() not in ALIASES:
            items.append((_pattern(s, False), canonical(s)))
    if len(_cache) > 8:
        _cache.clear()
    _cache[key] = items
    return items


def extract_skills(text, extra=None):
    """Skills found in free text, canonical names, de-duplicated, alphabetical."""
    if not text or not isinstance(text, str):
        return []
    found = {name for rx, name in _compiled(extra) if rx.search(text)}
    return sorted(found, key=str.lower)
