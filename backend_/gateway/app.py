from flask import Flask, request, Response
import requests
from flasgger import Swagger

app = Flask(__name__)

SERVICES = {
    "auth": "http://127.0.0.1:5001",
    "jobs": "http://127.0.0.1:5002",
    "resumes": "http://127.0.0.1:5003",
    "swipes": "http://127.0.0.1:5004",
    "recommendations": "https://ai-swipex.iampushkar.in",
}

swagger = Swagger(app, template={
    "swagger": "2.0",
    "info": {
        "title": "SwipeX API",
        "description": "API Gateway documentation for SwipeX Milestone 2",
        "version": "2.0.0"
    },
    "basePath": "/",

    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Enter: Bearer <JWT token>"
        }
    },

    "paths": {
        "/api/v1/jobs/": {
            "get": {
                "tags": ["Jobs"],
                "summary": "Get all jobs",
                "responses": {
                    "200": {
                        "description": "List of jobs"
                    }
                }
            },
            "post": {
                "tags": ["Jobs"],
                "summary": "Create a job",
                "description": "Recruiters only.",
                "security": [{"BearerAuth": []}],
                "responses": {
                    "201": {
                        "description": "Job created successfully"
                    },
                    "401": {
                        "description": "Unauthorized"
                    },
                    "403": {
                        "description": "Forbidden"
                    }
                }
            }
        },

        "/api/v1/jobs/search": {
            "get": {
                "tags": ["Jobs"],
                "summary": "Search and filter jobs",
                "parameters": [
                    {
                        "name": "keyword",
                        "in": "query",
                        "type": "string"
                    },
                    {
                        "name": "location",
                        "in": "query",
                        "type": "string"
                    },
                    {
                        "name": "job_type",
                        "in": "query",
                        "type": "string"
                    },
                    {
                        "name": "salary_min",
                        "in": "query",
                        "type": "number",
                        "format": "float"
                    },
                    {
                        "name": "salary_max",
                        "in": "query",
                        "type": "number",
                        "format": "float"
                    },
                    {
                        "name": "experience_level",
                        "in": "query",
                        "type": "string"
                    },
                    {
                        "name": "skills",
                        "in": "query",
                        "type": "string"
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "type": "integer"
                    },
                    {
                        "name": "per_page",
                        "in": "query",
                        "type": "integer"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Filtered job results"
                    }
                }
            }
        },

        "/api/v1/jobs/{job_id}": {
            "get": {
                "tags": ["Jobs"],
                "summary": "Get job details",
                "parameters": [
                    {
                        "name": "job_id",
                        "in": "path",
                        "required": True,
                        "type": "integer"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Job details"
                    },
                    "404": {
                        "description": "Job not found"
                    }
                }
            },

            "put": {
                "tags": ["Jobs"],
                "summary": "Update a job",
                "description": "Recruiter who owns the job only.",
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {
                        "name": "job_id",
                        "in": "path",
                        "required": True,
                        "type": "integer"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Job updated successfully"
                    },
                    "401": {
                        "description": "Unauthorized"
                    },
                    "403": {
                        "description": "Forbidden"
                    },
                    "404": {
                        "description": "Job not found"
                    }
                }
            },

            "delete": {
                "tags": ["Jobs"],
                "summary": "Delete a job",
                "description": "Recruiter who owns the job only.",
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {
                        "name": "job_id",
                        "in": "path",
                        "required": True,
                        "type": "integer"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Job deleted successfully"
                    },
                    "401": {
                        "description": "Unauthorized"
                    },
                    "403": {
                        "description": "Forbidden"
                    },
                    "404": {
                        "description": "Job not found"
                    }
                }
            }
        },

        "/api/v1/companies/": {
            "get": {
                "tags": ["Companies"],
                "summary": "Get all companies",
                "responses": {
                    "200": {
                        "description": "Company list"
                    }
                }
            }
        },

        "/api/v1/companies/{company_id}": {
            "get": {
                "tags": ["Companies"],
                "summary": "Get company details",
                "parameters": [
                    {
                        "name": "company_id",
                        "in": "path",
                        "required": True,
                        "type": "integer"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Company details"
                    },
                    "404": {
                        "description": "Company not found"
                    }
                }
            }
        },
	
	"/api/v1/resumes/ai-suggestions": {
    "post": {
        "tags": ["Resume / ATS"],
        "summary": "Get AI resume optimization suggestions",
        "description": "Job Seekers only. AI suggestions integration is pending.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "in": "body",
                "name": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "required": ["resume_id", "job_id"],
                    "properties": {
                        "resume_id": {
                            "type": "integer",
                            "example": 13
                        },
                        "job_id": {
                            "type": "integer",
                            "example": 1
                        }
                    }
                }
            }
        ],
        "responses": {
            "200": {
                "description": "AI suggestions generated successfully"
            },
            "400": {
                "description": "Invalid request"
            },
            "401": {
                "description": "Unauthorized"
            },
            "404": {
                "description": "Resume not found"
            },
            "503": {
                "description": "AI suggestions service not connected"
            }
        }
    }
},
	
	"/api/v1/resumes/ats/score": {
    "post": {
        "tags": ["Resume / ATS"],
        "summary": "Calculate ATS score for a resume against a job",
        "description": "Job Seekers only. ATS engine integration is pending.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "in": "body",
                "name": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "required": ["resume_id", "job_id"],
                    "properties": {
                        "resume_id": {
                            "type": "integer",
                            "example": 13
                        },
                        "job_id": {
                            "type": "integer",
                            "example": 1
                        }
                    }
                }
            }
        ],
        "responses": {
            "200": {
                "description": "ATS score calculated successfully"
            },
            "400": {
                "description": "Invalid request"
            },
            "401": {
                "description": "Unauthorized"
            },
            "404": {
                "description": "Resume not found"
            },
            "503": {
                "description": "ATS scoring service not connected"
            }
        }
    }
},
	"/api/v1/recommendations": {
    "get": {
        "tags": ["Recommendations"],
        "summary": "Get AI-powered job recommendations",
        "description": "Returns semantically matched job recommendations using the resume associated with the candidate.",
        "parameters": [
            {
                "name": "user_id",
                "in": "query",
                "required": True,
                "type": "string",
                "example": "U001"
            },
            {
                "name": "resume_id",
                "in": "query",
                "required": True,
                "type": "string",
                "format": "uuid",
                "example": "550e8400-e29b-41d4-a716-446655440000"
            }
        ],
        "responses": {
            "200": {
                "description": "AI-powered job recommendations"
            },
            "400": {
                "description": "Invalid request"
            },
            "404": {
                "description": "Resume or candidate not found"
            },
            "500": {
                "description": "Recommendation service error"
            }
        }
    }
},

        "/api/v1/swipes/": {
            "post": {
                "tags": ["Swipes"],
                "summary": "Record a job swipe",
                "description": "Job Seekers only.",
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {
                        "in": "body",
                        "name": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "required": ["job_id", "action"],
                            "properties": {
                                "job_id": {
                                    "type": "integer",
                                    "example": 1
                                },
                                "action": {
                                    "type": "string",
                                    "enum": ["APPLY", "SAVE", "SKIP"],
                                    "example": "APPLY"
                                }
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Swipe recorded successfully"
                    },
                    "400": {
                        "description": "Invalid request"
                    },
                    "401": {
                        "description": "Unauthorized"
                    },
                    "403": {
                        "description": "Forbidden"
                    }
                }
            }
        }
    }
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

@app.route("/api/v1/recommendations", methods=["GET"])
def recommendations_proxy():
    return proxy("recommendations", "/api/v1/recommendations")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)