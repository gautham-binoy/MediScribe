import re
from typing import Any, Literal
from pydantic import BaseModel


class SafetyAlert(BaseModel):
    severity: Literal["CRITICAL", "WARNING", "INFO", "SAFE"]
    medication: str
    conflict_source: str
    title: str
    clinical_explanation: str
    recommendation: str


class SafetyCheckerService:
    """
    Comprehensive Clinical Safety Engine for:
    1. Drug-Allergy cross-reactivity checks
    2. Drug-Disease / Condition contraindications
    3. Drug-Drug interactions (among prescribed items and with current chronic medications)
    4. Duplicate therapeutic class overdose warnings
    """

    # Allergy Cross-Reactivity Database
    ALLERGY_DRUG_FAMILIES = {
        "penicillin": {
            "keywords": ["penicillin", "amoxicillin", "ampicillin", "augmentin", "piperacillin", "cloxacillin", "amox"],
            "cross_reactivity": [
                ("amoxicillin", "CRITICAL", "Direct Penicillin Class Drug", "Amoxicillin is a beta-lactam penicillin and can cause anaphylaxis, urticaria, or severe cutaneous reactions in penicillin-allergic patients.", "Switch to Macrolide (e.g., Azithromycin), Doxycycline, or Respiratory Fluoroquinolone."),
                ("ampicillin", "CRITICAL", "Direct Penicillin Class Drug", "Ampicillin is a direct aminopenicillin with 100% cross-reactivity with penicillin allergy.", "Discontinue immediately. Substitute with non-beta-lactam alternative."),
                ("augmentin", "CRITICAL", "Direct Penicillin Derivative (Amoxicillin/Clavulanate)", "Augmentin contains amoxicillin. Contraindicated in penicillin allergy.", "Substitute with Cefuroxime/Cefdinir (if cephalosporin-tolerant) or Azithromycin."),
                ("penicillin", "CRITICAL", "Direct Penicillin", "Direct penicillin administration contraindicated.", "Use macrolide or fluoroquinolone alternative."),
                ("cefpodoxime", "WARNING", "Cephalosporin Cross-Reactivity (1-3% risk)", "Third-generation cephalosporins carry a low (1-3%) risk of cross-reactivity in penicillin-allergic patients.", "Assess severity of past allergy (mild rash vs. anaphylaxis) before administering."),
                ("ceftriaxone", "WARNING", "Cephalosporin Cross-Reactivity", "Low risk of cross-allergy. Use with caution if prior reaction was non-anaphylactic.", "Observe patient for 30 minutes following first dose."),
            ],
        },
        "sulfa": {
            "keywords": ["sulfa", "sulfonamide", "septra", "bactrim", "sulfamethoxazole"],
            "cross_reactivity": [
                ("bactrim", "CRITICAL", "Direct Sulfonamide", "Contains sulfamethoxazole. High risk of Stevens-Johnson Syndrome or severe rash in sulfa-allergic patients.", "Use alternative like Ciprofloxacin, Nitrofurantoin, or Amoxicillin."),
                ("septra", "CRITICAL", "Direct Sulfonamide", "Direct sulfonamide drug.", "Discontinue and use non-sulfa agent."),
                ("cotrimoxazole", "CRITICAL", "Direct Sulfonamide", "Contains sulfamethoxazole.", "Avoid completely."),
                ("sulfamethoxazole", "CRITICAL", "Direct Sulfonamide", "Direct sulfonamide.", "Avoid completely."),
            ],
        },
        "nsaid": {
            "keywords": ["nsaid", "aspirin", "ibuprofen", "brufen", "diclofenac"],
            "cross_reactivity": [
                ("ibuprofen", "CRITICAL", "Direct NSAID", "Patient has documented NSAID/Aspirin hypersensitivity. Can trigger severe bronchospasm or angioedema.", "Use Paracetamol (Acetaminophen) for analgesia/antipyresis."),
                ("diclofenac", "CRITICAL", "Direct NSAID", "Potent COX inhibitor contraindicated in NSAID allergy.", "Use Paracetamol or weak opioids if indicated."),
                ("aspirin", "CRITICAL", "Direct Salicylate / NSAID", "Direct trigger for AERD (Aspirin-Exacerbated Respiratory Disease).", "Avoid completely."),
                ("naproxen", "CRITICAL", "Direct NSAID", "Direct cross-reactivity with NSAID hypersensitivity.", "Switch to Paracetamol."),
                ("combiflam", "CRITICAL", "Contains Ibuprofen", "Combiflam is a combination of Ibuprofen + Paracetamol. Contains offending NSAID.", "Switch to plain Paracetamol."),
            ],
        },
    }

    # Condition Contraindications Database
    CONDITION_CONTRAINDICATIONS = [
        {
            "condition_keywords": ["asthma", "wheezing", "bronchospasm", "copd"],
            "drug_keywords": ["propranolol", "atenolol", "metoprolol", "bisoprolol", "labetalol", "carvedilol"],
            "severity": "CRITICAL",
            "title": "Beta-Blocker Bronchospasm Contraindication",
            "explanation": "Beta-blockers can block bronchial beta-2 receptors, precipitating severe life-threatening bronchospasm in asthmatic patients.",
            "recommendation": "Use cardioselective beta-blocker with extreme caution, or prefer Calcium Channel Blockers (Amlodipine) or ARBs (Telmisartan) for hypertension.",
        },
        {
            "condition_keywords": ["asthma", "bronchial asthma"],
            "drug_keywords": ["aspirin", "ibuprofen", "diclofenac", "naproxen", "ketorolac"],
            "severity": "WARNING",
            "title": "Aspirin-Exacerbated Respiratory Disease (AERD) Risk",
            "explanation": "Up to 10-20% of patients with adult-onset asthma exhibit NSAID hypersensitivity causing acute asthma attacks.",
            "recommendation": "Use Paracetamol (up to 1g) for pain or fever; avoid high-dose NSAIDs.",
        },
        {
            "condition_keywords": ["gastritis", "peptic ulcer", "gerd", "ulcer", "pud", "acid peptic disease"],
            "drug_keywords": ["ibuprofen", "diclofenac", "naproxen", "aspirin", "ketorolac", "indomethacin", "combiflam"],
            "severity": "WARNING",
            "title": "NSAID Gastrointestinal Mucosal Injury Risk",
            "explanation": "Non-steroidal anti-inflammatory drugs inhibit protective gastric mucosal prostaglandins, worsening gastritis and increasing risk of gastric ulceration or bleeding.",
            "recommendation": "Co-prescribe a Proton Pump Inhibitor (e.g., Pantoprazole 40mg OD) or substitute with Paracetamol.",
        },
        {
            "condition_keywords": ["hypertension", "high bp", "htn"],
            "drug_keywords": ["pseudoephedrine", "phenylephrine", "ephedrine"],
            "severity": "WARNING",
            "title": "Decongestant Blood Pressure Elevation",
            "explanation": "Systemic sympathomimetic decongestants cause vasoconstriction and can trigger significant acute blood pressure spikes.",
            "recommendation": "Use saline nasal sprays or topical oxymetazoline (short duration <= 3 days) instead of oral pseudoephedrine.",
        },
        {
            "condition_keywords": ["diabetes", "type 2 diabetes", "t2dm"],
            "drug_keywords": ["prednisolone", "dexamethasone", "hydrocortisone", "methylprednisolone", "betamethasone"],
            "severity": "WARNING",
            "title": "Steroid-Induced Hyperglycemia",
            "explanation": "Systemic corticosteroids significantly increase insulin resistance and hepatic gluconeogenesis, causing marked glycemic spikes.",
            "recommendation": "Monitor blood glucose closely; temporary insulin or oral hypoglycemic dose adjustment may be required.",
        },
    ]

    # Drug-Drug Interaction Database
    DRUG_DRUG_INTERACTIONS = [
        {
            "drug1_keywords": ["warfarin", "apixaban", "rivaroxaban", "dabigatran", "clopidogrel"],
            "drug2_keywords": ["ibuprofen", "diclofenac", "naproxen", "aspirin", "ketorolac"],
            "severity": "CRITICAL",
            "title": "Severe Gastrointestinal & Systemic Bleeding Risk",
            "explanation": "Concurrent use of anticoagulants/antiplatelets with NSAIDs synergistically impairs platelet aggregation and causes gastric erosion, multiplying major bleeding risk up to 5-fold.",
            "recommendation": "Avoid NSAIDs. Use Paracetamol for analgesia. If anti-inflammatory therapy is mandatory, co-prescribe PPI and monitor INR/hemoglobin.",
        },
        {
            "drug1_keywords": ["enalapril", "ramipril", "lisinopril", "losartan", "telmisartan", "valsartan"],
            "drug2_keywords": ["spironolactone", "eplerenone", "potassium"],
            "severity": "WARNING",
            "title": "Severe Hyperkalemia Risk",
            "explanation": "Combining ACE Inhibitors / ARBs with aldosterone antagonists impairs renal potassium excretion, potentially causing life-threatening cardiac arrhythmias from hyperkalemia.",
            "recommendation": "Check serum potassium and creatinine within 1-2 weeks of initiating combination.",
        },
        {
            "drug1_keywords": ["atorvastatin", "simvastatin", "rosuvastatin"],
            "drug2_keywords": ["clarithromycin", "erythromycin", "azithromycin"],
            "severity": "WARNING",
            "title": "Macrolide-Statin Myopathy & Rhabdomyolysis Risk",
            "explanation": "Macrolides (especially Clarithromycin) inhibit CYP3A4, dramatically increasing statin blood levels and risk of severe muscle breakdown (rhabdomyolysis).",
            "recommendation": "Temporarily suspend statin therapy during the 5-day course of macrolide antibiotic.",
        },
        {
            "drug1_keywords": ["ciprofloxacin", "ofloxacin"],
            "drug2_keywords": ["theophylline", "theobromine"],
            "severity": "WARNING",
            "title": "Theophylline Toxicity via CYP1A2 Inhibition",
            "explanation": "Ciprofloxacin inhibits hepatic clearance of theophylline, causing nausea, palpitations, and potentially seizures.",
            "recommendation": "Reduce theophylline dose by 50% or choose an alternative antibiotic (e.g. Cefuroxime).",
        },
        {
            "drug1_keywords": ["tramadol"],
            "drug2_keywords": ["sertraline", "fluoxetine", "escitalopram", "paroxetine", "duloxetine", "venlafaxine"],
            "severity": "WARNING",
            "title": "Serotonin Syndrome & Seizure Risk",
            "explanation": "Tramadol possesses weak serotonin reuptake inhibition; combination with SSRIs/SNRIs can trigger agitation, tremor, hyperreflexia, or lower seizure threshold.",
            "recommendation": "Use non-serotonergic analgesics (Paracetamol, NSAID) or closely monitor neurological signs.",
        },
    ]

    @classmethod
    def analyze_safety(
        cls,
        patient_allergies: str | None,
        patient_conditions: str | None,
        patient_medications: str | None,
        prescribed_items: list[dict[str, Any]],
    ) -> list[SafetyAlert]:
        """
        Analyze prescribed items against patient's allergies, existing conditions,
        and current medications. Returns prioritized list of clinical alerts.
        """
        alerts: list[SafetyAlert] = []
        allergies_str = (patient_allergies or "").lower()
        conditions_str = (patient_conditions or "").lower()
        curr_meds_str = (patient_medications or "").lower()

        # Collect list of prescribed drug names
        rx_names = [item.get("medication_name", "").strip().lower() for item in prescribed_items if item.get("medication_name")]

        # 1. Check Drug-Allergy Interactions
        for family_key, family_data in cls.ALLERGY_DRUG_FAMILIES.items():
            # Check if patient has this allergy documented
            has_allergy = any(kw in allergies_str for kw in family_data["keywords"])
            if has_allergy:
                for rx in rx_names:
                    for cross_drug, severity, title, explanation, rec in family_data["cross_reactivity"]:
                        if cross_drug in rx:
                            alerts.append(
                                SafetyAlert(
                                    severity=severity,
                                    medication=rx.title(),
                                    conflict_source=f"Documented Allergy: {patient_allergies}",
                                    title=f"Allergy Alert: {title}",
                                    clinical_explanation=explanation,
                                    recommendation=rec,
                                )
                            )

        # 2. Check Condition Contraindications
        for rule in cls.CONDITION_CONTRAINDICATIONS:
            cond_match = any(ck in conditions_str for ck in rule["condition_keywords"])
            if cond_match:
                for rx in rx_names:
                    if any(dk in rx for dk in rule["drug_keywords"]):
                        matched_cond = next(ck for ck in rule["condition_keywords"] if ck in conditions_str)
                        alerts.append(
                            SafetyAlert(
                                severity=rule["severity"],
                                medication=rx.title(),
                                conflict_source=f"Existing Condition: {matched_cond.title()}",
                                title=rule["title"],
                                clinical_explanation=rule["explanation"],
                                recommendation=rule["recommendation"],
                            )
                        )

        # 3. Check Drug-Drug Interactions (between prescribed items & chronic meds)
        all_drugs_to_check = [(rx, "New Prescription") for rx in rx_names]
        if curr_meds_str and curr_meds_str != "none":
            for cm in re.split(r"[,;]+", curr_meds_str):
                cm_clean = cm.strip()
                if cm_clean:
                    all_drugs_to_check.append((cm_clean, "Current Medication"))

        for rule in cls.DRUG_DRUG_INTERACTIONS:
            # Check if one drug from drug1 and one from drug2 are both present
            for d1, src1 in all_drugs_to_check:
                if any(k1 in d1 for k1 in rule["drug1_keywords"]):
                    for d2, src2 in all_drugs_to_check:
                        if d1 != d2 and any(k2 in d2 for k2 in rule["drug2_keywords"]):
                            # Found interaction pair
                            already_added = any(
                                a.title == rule["title"] and (a.medication in (d1.title(), d2.title()))
                                for a in alerts
                            )
                            if not already_added:
                                alerts.append(
                                    SafetyAlert(
                                        severity=rule["severity"],
                                        medication=f"{d1.title()} + {d2.title()}",
                                        conflict_source=f"Drug-Drug Combination ({src1} + {src2})",
                                        title=rule["title"],
                                        clinical_explanation=rule["explanation"],
                                        recommendation=rule["recommendation"],
                                    )
                                )

        # 4. Check for duplicate therapeutic agents (e.g., prescribing Paracetamol and Combiflam)
        paracetamol_count = sum(1 for rx in rx_names if any(p in rx for p in ["paracetamol", "acetaminophen", "combiflam", "calpol", "crocin", "dolo"]))
        if paracetamol_count > 1:
            alerts.append(
                SafetyAlert(
                    severity="WARNING",
                    medication="Multiple Acetaminophen / Paracetamol Products",
                    conflict_source="Therapeutic Duplication",
                    title="Duplicate Paracetamol Prescribed (Hepatotoxicity Warning)",
                    clinical_explanation="Two or more prescribed products contain Paracetamol/Acetaminophen. Total daily dose may inadvertently exceed 4000mg maximum safe threshold.",
                    recommendation="Ensure patient receives only one source of Paracetamol and total daily dose does not exceed 4g.",
                )
            )

        # If zero alerts, return one clean SAFE badge
        if not alerts and prescribed_items:
            alerts.append(
                SafetyAlert(
                    severity="SAFE",
                    medication="All Prescribed Items",
                    conflict_source="Clinical Safety Verification",
                    title="No High-Risk Conflicts Detected",
                    clinical_explanation="Prescribed medications were cross-checked against the patient's documented allergies, chronic conditions, and medication profile. No critical contraindications found.",
                    recommendation="Standard clinical monitoring and patient counseling advised.",
                )
            )

        # Sort: CRITICAL first, then WARNING, then INFO, then SAFE
        severity_rank = {"CRITICAL": 0, "WARNING": 1, "INFO": 2, "SAFE": 3}
        alerts.sort(key=lambda a: severity_rank.get(a.severity, 4))
        return alerts

    # Alias for API compatibility
    check_prescription_safety = analyze_safety

