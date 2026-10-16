# SwipeX — System Architecture

## 1. Overview

SwipeX is a modular job matching platform connecting Job Seekers and Recruiters through a swipe-based experience.

The backend follows a service-oriented architecture with REST APIs, JWT authentication, role-based access control, and separate services for authentication, jobs, and resume/recommendation processing.

## 2. High-Level Architecture

```text
                    ┌───────────────┐
                    │   Frontend    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Gateway    │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │ Auth Service│   │ Job Service │   │Resume Service│
   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                    ┌───────────────┐
                    │   Database    │
                    └───────────────┘