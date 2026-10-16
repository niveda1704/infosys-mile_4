from flask import Flask, request, Response
import requests

app = Flask(__name__)

SERVICES = {
    "auth": "http://127.0.0.1:5001",
    "jobs": "http://127.0.0.1:5002",
    "resumes": "http://127.0.0.1:5003",
}

@app.get("/health")
def health():
    return {"service": "gateway", "success": True}

def proxy(service, path):
    response = requests.request(
        method=request.method,
        url=SERVICES[service] + path,
        headers={k: v for k, v in request.headers if k.lower() != "host"},
        data=request.get_data(),
        params=request.args,
    )
    return Response(
        response.content,
        status=response.status_code,
        content_type=response.headers.get("Content-Type")
    )

@app.route("/api/v1/auth/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def auth_proxy(path):
    return proxy("auth", "/api/v1/auth/" + path)

@app.route("/api/v1/jobs/", methods=["GET", "POST"])
def jobs_root_proxy():
    return proxy("jobs", "/api/v1/jobs/")
    
@app.route("/api/v1/jobs/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def jobs_proxy(path):
    return proxy("jobs", "/api/v1/jobs/" + path)

@app.route("/api/v1/resumes/", methods=["GET", "POST"])
def resumes_root_proxy():
    return proxy("resumes", "/api/v1/resumes/")
    
@app.route("/api/v1/resumes/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def resumes_proxy(path):
    return proxy("resumes", "/api/v1/resumes/" + path)

@app.get("/api/v1/auth/health")
def auth_health():
    return proxy("auth", "/health")

@app.get("/api/v1/jobs/health")
def jobs_health():
    return proxy("jobs", "/health")

@app.get("/api/v1/resumes/health")
def resumes_health():
    return proxy("resumes", "/health")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
