def test_doctor_login_success(client):
    response = client.post(
        "/api/auth/login", json={"email": "doctor@demo.com", "password": "doctor123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "doctor@demo.com"
    assert data["user"]["role"] == "DOCTOR"


def test_admin_login_success(client):
    response = client.post(
        "/api/auth/login", json={"email": "admin@demo.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "HOSPITAL_ADMIN"


def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login", json={"email": "doctor@demo.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_me(client, doctor_headers):
    response = client.get("/api/auth/me", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "doctor@demo.com"
    assert data["doctor_profile"]["specialization"] == "General & Internal Medicine"
