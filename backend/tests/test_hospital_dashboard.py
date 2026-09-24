def test_hospital_dashboard_metrics(client, admin_headers):
    response = client.get("/api/hospital/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()

    # Verify metrics structure
    metrics = data["metrics"]
    assert "total_patients" in metrics
    assert "today_consultations" in metrics
    assert "pending_approvals" in metrics
    assert "approved_records" in metrics
    assert "ai_assisted" in metrics

    # Verify trends and distribution
    assert len(data["consultation_trends"]) == 7
    assert len(data["status_distribution"]) >= 3
    assert len(data["recent_patients"]) >= 1

    # Verify patient table
    first_p = data["recent_patients"][0]
    assert "name" in first_p
    assert "patient_id" in first_p
