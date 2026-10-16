from flask import Flask, request, Response
import requests
from flasgger import Swagger

app = Flask(__name__)

SERVICES = {
    "auth": "http://127.0.0.1:5001",
    "jobs": "http://127.0.0.1:5002",
    "resumes": "http://127.0.0.1:5003",
    "swipes": "http://127.0.0.1:5004",
}

swagger = Swagger(app, template={
    "swagger": "2.0",
    "info": {
        "title": "SwipeX API",
        "description": "API Gateway documentation for SwipeX Milestone 2",
        "version": "2.0.0"
    },
    "basePath": "/"
})


@app.get("/health")
def health():
    """
    Gateway health check
    ---
    tags:
      - Health
    responses:
      200:
        description: Gateway is healthy
    """
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
    """
    Job Service root endpoint
    ---
    tags:
      - Jobs
    responses:
      200:
        description: Job list
    """
    return proxy("jobs", "/api/v1/jobs/")


@app.route("/api/v1/companies/", methods=["GET"])
def companies_root_proxy():
    """
    Company list
    ---
    tags:
      - Companies
    responses:
      200:
        description: Company list
    """
    return proxy("jobs", "/api/v1/companies/")


@app.route("/api/v1/companies/<path:path>", methods=["GET"])
def companies_proxy(path):
    return proxy("jobs", "/api/v1/companies/" + path)


@app.route("/api/v1/jobs/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def jobs_proxy(path):
    return proxy("jobs", "/api/v1/jobs/" + path)


@app.route("/api/v1/resumes/", methods=["GET", "POST"])
def resumes_root_proxy():
    return proxy("resumes", "/api/v1/resumes/")


@app.route("/api/v1/resumes/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def resumes_proxy(path):
    return proxy("resumes", "/api/v1/resumes/" + path)


@app.route("/api/v1/swipes/", methods=["POST"])
def swipes_root_proxy():
    """
    Record a job swipe
    ---
    tags:
      - Swipes
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - job_id
            - action
          properties:
            job_id:
              type: integer
              example: 1
            action:
              type: string
              enum:
                - APPLY
                - SAVE
                - SKIP
              example: APPLY
    responses:
      201:
        description: Swipe recorded successfully
      400:
        description: Invalid request
      401:
        description: Unauthorized
      403:
        description: Forbidden
    """
    return proxy("swipes", "/api/v1/swipes/")


@app.get("/api/v1/auth/health")
def auth_health():
    return proxy("auth", "/health")


@app.get("/api/v1/jobs/health")
def jobs_health():
    return proxy("jobs", "/health")


@app.get("/api/v1/resumes/health")
def resumes_health():
    return proxy("resumes", "/health")


@app.get("/api/v1/swipes/health")
def swipes_health():
    return proxy("swipes", "/health")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)