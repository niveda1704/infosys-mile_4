"""Start every SwipeX backend process with one command:  python scripts/run_all.py

gateway :5000 (the only address the frontend uses)   auth :5001   job :5002   resume :5003   ai :8000
Ctrl+C stops everything. Needs the .env in the project root (copy .env.example) and a running Postgres.
"""
import os
import subprocess
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import ROOT, load_env  # noqa: E402

load_env()
SVC = os.path.join(ROOT, "backend_jayashree", "services")
PROCS = [
    ("auth", [sys.executable, "run.py"], os.path.join(SVC, "auth-service")),
    ("job", [sys.executable, "run.py"], os.path.join(SVC, "job-service")),
    ("resume", [sys.executable, "run.py"], os.path.join(SVC, "resume-service")),
    ("ai", [sys.executable, "-m", "uvicorn", "src.main:app", "--port", "8000"],
     os.path.join(ROOT, "artificial_intelligence_meghana")),
    ("gateway", [sys.executable, "app.py"], os.path.join(ROOT, "backend_jayashree", "gateway")),
]


def pump(name, proc):
    for line in proc.stdout:
        print(f"[{name}] {line.rstrip()}", flush=True)


def main():
    env = dict(os.environ, PYTHONUNBUFFERED="1", FLASK_DEBUG="0")
    running = []
    for name, cmd, cwd in PROCS:
        p = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        threading.Thread(target=pump, args=(name, p), daemon=True).start()
        running.append(p)
        time.sleep(0.6)
    print("\nSwipeX is starting. Frontend -> http://127.0.0.1:5000/api/v1 (gateway)\n", flush=True)
    try:
        while all(p.poll() is None for p in running):
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for p in running:
            if p.poll() is None:
                p.terminate()


if __name__ == "__main__":
    main()
