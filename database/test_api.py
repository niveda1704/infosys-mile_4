from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200


def test_test_db():
    response = client.get("/test-db")
    assert response.status_code == 200
    assert response.json()["message"] == "Database connected successfully"


def test_get_jobs():
    response = client.get("/jobs")
    assert response.status_code == 200

    data = response.json()

    assert "jobs" in data
    assert "total_jobs" in data
    assert data["total_jobs"] > 0


def test_get_job_by_id():
    response = client.get("/jobs/1")

    assert response.status_code == 200

    data = response.json()

    assert data["job_id"] == 1
    assert "job_title" in data


def test_job_search():
    response = client.get(
        "/jobs/filter/search",
        params={"keyword": "Developer"}
    )

    assert response.status_code == 200


def test_swipe_history():
    response = client.get("/swipes/1")

    assert response.status_code == 200


def test_get_users():
    response = client.get("/users")

    assert response.status_code == 200

    data = response.json()

    assert "total_users" in data
    assert "users" in data
    assert data["total_users"] > 0
    assert isinstance(data["users"], list)
def test_get_users():
    response = client.get("/users")

    assert response.status_code == 200

    data = response.json()

    assert "total_users" in data
    assert "users" in data
    assert data["total_users"] > 0
    assert isinstance(data["users"], list)
def test_get_users():
    response = client.get("/users")

    assert response.status_code == 200

    data = response.json()

    assert "total_users" in data
    assert "users" in data
    assert data["total_users"] > 0
    assert isinstance(data["users"], list)
def test_get_users():
    response = client.get("/users")

    assert response.status_code == 200

    data = response.json()

    assert "total_users" in data
    assert "users" in data
    assert data["total_users"] > 0
    assert isinstance(data["users"], list)
def test_get_users():
    response = client.get("/users")

    assert response.status_code == 200

    data = response.json()

    assert "total_users" in data
    assert "users" in data
    assert data["total_users"] > 0
    assert isinstance(data["users"], list)


def test_get_user_by_id():
    response = client.get("/users/1")

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == 1
    assert "name" in data
    assert "email" in data


def test_user_search():
    response = client.get(
        "/users/search",
        params={"name": "Abhishek"}
    )

    assert response.status_code == 200    