def test_get_patients_list(client, doctor_headers):
    response = client.get("/api/patients", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    ids = [p["patient_id"] for p in data]
    assert "P1001" in ids
    assert "P1002" in ids


def test_search_patient_by_id(client, doctor_headers):
    response = client.get("/api/patients?search=P1001", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Rahul Nair"


def test_get_patient_details(client, doctor_headers):
    response = client.get("/api/patients/P1001", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == "P1001"
    assert data["age"] == 28
    assert data["blood_group"] == "O+"


def test_get_patient_history(client, doctor_headers):
    response = client.get("/api/patients/P1003/history", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["patient"]["patient_id"] == "P1003"
    assert len(data["consultations"]) >= 1
    assert data["consultations"][0]["is_approved"] is True


def test_create_and_update_patient(client, doctor_headers):
    create_payload = {
        "patient_id": "P9999",
        "name": "Kavitha Menon",
        "dob": "1995-03-15",
        "age": 31,
        "gender": "Female",
        "phone": "+91 99999 88888",
        "email": "kavitha.m@example.com",
        "blood_group": "A+",
        "allergies": "No known drug allergies",
        "existing_conditions": "None",
        "current_medications": "None",
    }
    create_res = client.post("/api/patients", json=create_payload, headers=doctor_headers)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["patient_id"] == "P9999"

    # Update
    update_res = client.put(
        "/api/patients/P9999",
        json={"phone": "+91 99999 77777", "allergies": "Mild pollen allergy"},
        headers=doctor_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+91 99999 77777"
    assert update_res.json()["allergies"] == "Mild pollen allergy"
