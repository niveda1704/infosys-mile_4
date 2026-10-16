# SwipeX — API Contracts

## Milestone 1

This document defines the API contracts for the SwipeX Milestone 1 services. These contracts are based on the SwipeX Software Requirements Specification (SRS), Section 7.

The contracts are intended to provide a stable interface between the five interns' modules and support parallel development.

---

## 1. Authentication & User Service

**Owner:** Intern 1 — Team Lead / Backend & Identity Management

### 1.1 Register

**Endpoint**

`POST /api/v1/auth/register`

**Request**

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "role": "Job Seeker"
}
```

**Success Response — 201**

```json
{
  "user_id": 1
}
```

### 1.2 Login

**Endpoint**

`POST /api/v1/auth/login`

**Request**

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Success Response — 200**

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "role": "Job Seeker"
}
```

### 1.3 Google OAuth2 Login

**Endpoint**

`GET /api/v1/auth/oauth/google`

**Purpose**

Initiates Google OAuth2 authentication.

**Success Response — 200**

```json
{
  "access_token": "ACCESS_TOKEN",
  "role": "Job Seeker"
}
```

### 1.4 Refresh Access Token

**Endpoint**

`POST /api/v1/auth/refresh`

**Request**

```json
{
  "refresh_token": "REFRESH_TOKEN"
}
```

**Success Response — 200**

```json
{
  "access_token": "NEW_ACCESS_TOKEN"
}
```

### 1.5 Get Current User

**Endpoint**

`GET /api/v1/auth/me`

**Authentication**

Bearer JWT required.

**Header**

```text
Authorization: Bearer <access_token>
```

**Success Response — 200**

```json
{
  "user_id": 1,
  "name": "User Name",
  "role": "Job Seeker"
}
```

---

# 2. Job & Swipe Service

**Owner:** Intern 2 — Job & Data Intelligence

## 2.1 List Jobs

**Endpoint**

`GET /api/v1/jobs`

**Query Parameters**

```text
type=
location=
remote=
salary_min=
salary_max=
skills=
```

**Success Response — 200**

```json
[
  {
    "job_id": 1,
    "title": "Software Engineer",
    "company": "Example Company",
    "type": "Full-time",
    "location": "Bengaluru",
    "salary_range": "6-10 LPA",
    "skills": [
      "Python",
      "FastAPI"
    ],
    "posted_at": "2026-08-27"
  }
]
```

## 2.2 Get Job Details

**Endpoint**

`GET /api/v1/jobs/{job_id}`

**Success Response — 200**

Returns the requested job details.

## 2.3 Record Swipe

**Endpoint**

`POST /api/v1/swipes`

**Request**

```json
{
  "job_id": 1,
  "direction": "right"
}
```

`direction` supports:

* `right` — apply/save
* `left` — skip

**Success Response — 201**

```json
{
  "swipe_id": 1
}
```

## 2.4 Swipe History

**Endpoint**

`GET /api/v1/swipes/history`

**Success Response — 200**

```json
[
  {
    "job_id": 1,
    "direction": "right",
    "swiped_at": "2026-08-27T10:30:00"
  }
]
```

---

# 3. Resume & Career Intelligence Service

**Owner:** Intern 3 — AI/ML Career Intelligence

Milestone 1 uses a heuristic/rule-based implementation. Real NLP/ML model development is planned for Milestone 2.

## 3.1 Resume Upload

**Endpoint**

`POST /api/v1/resume/upload`

**Request**

Multipart file upload.

**Success Response — 201**

```json
{
  "resume_id": 1,
  "parsed_skills": [
    "Python",
    "SQL",
    "FastAPI"
  ]
}
```

## 3.2 ATS Score

**Endpoint**

`GET /api/v1/resume/{resume_id}/ats-score?job_id={id}`

**Success Response — 200**

```json
{
  "match_score": 75,
  "missing_keywords": [
    "Docker",
    "Redis"
  ],
  "generated_by": "heuristic-v0"
}
```

## 3.3 Job Recommendations

**Endpoint**

`GET /api/v1/recommendations?user_id={id}`

**Success Response — 200**

```json
[
  {
    "job_id": 1,
    "match_percentage": 82,
    "generated_by": "heuristic-v0"
  }
]
```

---

# 4. Authentication & Authorization

The Authentication Service is responsible for:

* User registration
* User login
* JWT access tokens
* Refresh tokens
* Google OAuth2
* Current-user information
* Role-based access control (RBAC)

### Supported Roles

1. Job Seeker
2. Recruiter
3. Admin

Protected endpoints must validate the JWT and enforce the appropriate role permissions.

---

# 5. API Gateway

**Owner:** Intern 1 — Team Lead / Backend & Identity Management

The API Gateway acts as the common entry point for frontend requests and routes requests to the appropriate backend service.

### Milestone 1 Routing

```text
/api/v1/auth/*             → Authentication Service

/api/v1/jobs/*             → Job & Swipe Service

/api/v1/swipes/*           → Job & Swipe Service

/api/v1/resume/*           → Resume & Career Intelligence Service

/api/v1/recommendations/*  → Resume & Career Intelligence Service
```

The Gateway will also support authentication/authorization integration where required.

---

# 6. Integration Consumers

| API / Service       | Consumer                        |
| ------------------- | ------------------------------- |
| Authentication APIs | Intern 4 — Frontend             |
| Authentication APIs | Intern 5 — Testing              |
| Job APIs            | Intern 4 — Frontend             |
| Job/Swipe APIs      | Intern 3 — Recommendation input |
| Resume/ATS APIs     | Intern 4 — Frontend             |
| Resume/ATS APIs     | Intern 5 — Testing              |
| Gateway routes      | Interns 2 & 3 services          |

---

# 7. Contract Rule

All interns should build their services against these agreed API contracts.

Any proposed contract change should be discussed with the team before implementation so that dependent services are not broken.

The API contracts should be finalized/frozen by Day 2 of Milestone 1.
