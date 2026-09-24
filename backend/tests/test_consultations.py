def test_full_consultation_lifecycle(client, doctor_headers):
    # 1. Create Consultation
    init_res = client.post(
        "/api/consultations",
        json={
            "patient_id": "P1001",
            "conversation_language": "Malayalam + English",
            "output_language": "English",
            "is_demo": True,
        },
        headers=doctor_headers,
    )
    assert init_res.status_code == 201
    c_data = init_res.json()
    c_id = c_data["id"]
    assert c_data["status"] == "RECORDING"
    assert c_data["patient"]["patient_id"] == "P1001"

    # 2. Trigger demo audio transcript (Malayalam + English)
    demo_audio_res = client.post(
        f"/api/consultations/{c_id}/demo-audio?scenario=malayalam_fever", headers=doctor_headers
    )
    assert demo_audio_res.status_code == 200
    t_data = demo_audio_res.json()
    assert "Doctor, എനിക്ക് three days ആയി fever ആണ്." in t_data["original_transcript"]
    assert (
        "three days" in t_data["normalized_clinical_text"].lower()
        or "3 days" in t_data["normalized_clinical_text"].lower()
    )

    # 3. Generate AI Clinical Drafts
    gen_res = client.post(f"/api/consultations/{c_id}/generate", headers=doctor_headers)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["status"] == "PENDING_REVIEW"
    assert gen_data["clinical_extraction"]["chief_complaint"] is not None
    assert len(gen_data["clinical_extraction"]["symptoms"]) >= 2
    assert gen_data["clinical_note"]["is_ai_draft"] is True
    assert len(gen_data["diagnosis_suggestions"]) >= 1
    assert len(gen_data["investigation_suggestions"]) >= 1
    assert gen_data["prescription"]["status"] == "DRAFT"
    assert len(gen_data["prescription"]["items"]) >= 1
    assert len(gen_data["icd_suggestions"]) >= 1

    # 4. Save Draft Edits
    save_draft_res = client.post(
        f"/api/consultations/{c_id}/draft",
        json={
            "soap": {
                "doctor_notes": "Reviewed and modified by Dr. Gautham. Patient advised steam inhalation."
            }
        },
        headers=doctor_headers,
    )
    assert save_draft_res.status_code == 200
    assert "steam inhalation" in save_draft_res.json()["clinical_note"]["doctor_notes"]

    # 5. Doctor Explicit Approval
    appr_res = client.post(
        f"/api/consultations/{c_id}/approve",
        json={
            "doctor_notes": "All items verified. Prescription and lab investigations authorized."
        },
        headers=doctor_headers,
    )
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    assert "signature_hash" in appr_data
    assert appr_data["doctor_license"] is not None

    # 6. Verify Final Approved Status
    final_res = client.get(f"/api/consultations/{c_id}", headers=doctor_headers)
    assert final_res.status_code == 200
    final_data = final_res.json()
    assert final_data["status"] == "APPROVED"
    assert final_data["approval"] is not None
    assert final_data["clinical_note"]["is_ai_draft"] is False
    assert final_data["prescription"]["status"] == "APPROVED"


def test_consultation_rejection(client, doctor_headers):
    init_res = client.post(
        "/api/consultations",
        json={"patient_id": "P1002", "conversation_language": "English", "is_demo": True},
        headers=doctor_headers,
    )
    c_id = init_res.json()["id"]

    reject_res = client.post(
        f"/api/consultations/{c_id}/reject",
        json={"reason": "Audio recording was corrupted and inaudible."},
        headers=doctor_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
