def test_audit_logs_retrieval(client, doctor_headers):
    response = client.get("/api/audit", headers=doctor_headers)
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) >= 1

    actions = [log["action"] for log in logs]
    assert any("DOCTOR_LOGIN" in a or "SYSTEM_INITIALIZED" in a for a in actions)
