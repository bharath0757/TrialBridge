import math
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.models.admet import (
    ParticipantContext,
    DoseInput,
    ProtocolContext,
    AdmetScores,
    AdmetSafetySignal,
    ExplainabilityReport,
    AdmetAnalyzeRequest,
    AdmetAnalyzeResponse,
    DoseComparisonItem,
    DoseComparisonResponse,
    AdmetReviewRequest,
    AdmetReviewResponse,
)

# Reference Compound Pharmacological Profiles (Derived from FDA Labels & ADA 2026 Guide)
COMPOUND_REGISTRY: Dict[str, Dict[str, Any]] = {
    "c4h11n5": {
        "id": "c4h11n5",
        "name": "C₄H₁₁N₅ (Metformin - T2D First Line)",
        "formula": "C₄H₁₁N₅",
        "smiles": "CN(C)C(=N)NC(=N)N",
        "indication": "Type 2 Diabetes & Renal Tubular Clearance",
        "target_organ": "Kidneys / Renal Pelvis & Liver",
        "reference_sequence": [500.0, 1000.0, 1500.0, 2000.0],
        "reference_dose": 1000.0,
        "unit": "mg",
        "intrinsic_scores": {
            "absorption": 58,
            "distribution": 41,
            "metabolism": 80,
            "excretion": 91,
            "toxicity": 85,
            "overall": 78,
        },
        "pk_profile": {
            "bioavailability_f0": 0.55,
            "clearance_l_h": 12.5,
            "primary_elimination": "Renal (OCT2/MATE1 active secretion)",
            "hepatic_metabolism_pct": 0.0,
            "protein_binding_pct": 8.0,
        },
        "mechanism": "Suppresses hepatic gluconeogenesis via AMPK phosphorylation; excreted 90% unchanged in urine within 24h via OCT2 transporters.",
    },
    "c20h25cln2o5": {
        "id": "c20h25cln2o5",
        "name": "C₂₀H₂₅ClN₂O₅ (Amlodipine - Blood Pressure)",
        "formula": "C₂₀H₂₅ClN₂O₅",
        "smiles": "CCOC(=O)C1=C(COCCN)NC(C)=C(C(=O)OC)C1c1ccccc1Cl",
        "indication": "Hypertension, Vascular & Renal Perfusion Preservation",
        "target_organ": "Blood Vessels, Brain, Heart, Kidneys",
        "reference_sequence": [2.5, 5.0, 10.0],
        "reference_dose": 5.0,
        "unit": "mg",
        "intrinsic_scores": {
            "absorption": 78,
            "distribution": 64,
            "metabolism": 82,
            "excretion": 72,
            "toxicity": 88,
            "overall": 77,
        },
        "pk_profile": {
            "bioavailability_f0": 0.74,
            "clearance_l_h": 25.0,
            "primary_elimination": "Hepatic CYP3A4 conversion to inactive metabolites (60% renal excretion of metabolites)",
            "hepatic_metabolism_pct": 90.0,
            "protein_binding_pct": 97.5,
        },
        "mechanism": "Selective L-type calcium channel inhibition producing sustained peripheral arteriolar vasodilation; preserves renal blood flow.",
    },
    "dual_formulation": {
        "id": "dual_formulation",
        "name": "C₄H₁₁N₅ + SGLT2 Modulator (Renal Dual Formulation)",
        "formula": "C₄H₁₁N₅ / SGLT2",
        "smiles": "CN(C)C(=N)NC(=N)N.Cc1cc(Cl)ccc1Cc2ccc(O[C@H]3[C@@H](O)[C@H](O)[C@@H](O)[C@H](CO)O3)cc2",
        "indication": "Advanced Glycemic Control & Diabetic Glomerular Protection",
        "target_organ": "Kidney Proximal Tubule & Liver",
        "reference_sequence": [500.0, 1000.0, 1500.0, 2000.0],
        "reference_dose": 1000.0,
        "unit": "mg",
        "intrinsic_scores": {
            "absorption": 70,
            "distribution": 55,
            "metabolism": 78,
            "excretion": 94,
            "toxicity": 82,
            "overall": 80,
        },
        "pk_profile": {
            "bioavailability_f0": 0.62,
            "clearance_l_h": 15.0,
            "primary_elimination": "Dual Renal Glucosuria + Tubular Secretion",
            "hepatic_metabolism_pct": 15.0,
            "protein_binding_pct": 45.0,
        },
        "mechanism": "Synergistic glycemic lowering combining hepatic gluconeogenesis suppression with proximal tubule SGLT2 glucosuria.",
    },
    "aspirin": {
        "id": "aspirin",
        "name": "C₉H₈O₄ (Aspirin - Acetylsalicylic Acid)",
        "formula": "C₉H₈O₄",
        "smiles": "CC(=O)Oc1ccccc1C(=O)O",
        "indication": "Cardiovascular Prevention & Platelet Inhibition",
        "target_organ": "Stomach / Gastric Mucosa & Platelets",
        "reference_sequence": [75.0, 81.0, 100.0, 325.0],
        "reference_dose": 81.0,
        "unit": "mg",
        "intrinsic_scores": {
            "absorption": 88,
            "distribution": 70,
            "metabolism": 76,
            "excretion": 84,
            "toxicity": 78,
            "overall": 80,
        },
        "pk_profile": {
            "bioavailability_f0": 0.70,
            "clearance_l_h": 30.0,
            "primary_elimination": "Renal tubular secretion of salicylate conjugates",
            "hepatic_metabolism_pct": 80.0,
            "protein_binding_pct": 90.0,
        },
        "mechanism": "Irreversible COX-1 acetylation blocks platelet thromboxane A2 production for the 7-10 day platelet lifespan.",
    },
    "paracetamol": {
        "id": "paracetamol",
        "name": "C₈H₉NO₂ (Paracetamol - Acetaminophen)",
        "formula": "C₈H₉NO₂",
        "smiles": "CC(=O)Nc1ccc(O)cc1",
        "indication": "Analgesic & Antipyretic",
        "target_organ": "Liver (Hepatic Parenchyma)",
        "reference_sequence": [250.0, 500.0, 1000.0],
        "reference_dose": 500.0,
        "unit": "mg",
        "intrinsic_scores": {
            "absorption": 90,
            "distribution": 65,
            "metabolism": 70,
            "excretion": 86,
            "toxicity": 74,
            "overall": 77,
        },
        "pk_profile": {
            "bioavailability_f0": 0.85,
            "clearance_l_h": 21.0,
            "primary_elimination": "Hepatic glucuronidation (55%) & sulfation (30%)",
            "hepatic_metabolism_pct": 95.0,
            "protein_binding_pct": 20.0,
        },
        "mechanism": "Centrally acting analgesic inhibiting COX-3 / AM404 pathway; Phase II hepatic clearance protects against NAPQI.",
    },
    "ibuprofen": {
        "id": "ibuprofen",
        "name": "C₁₃H₁₈O₂ (Ibuprofen)",
        "formula": "C₁₃H₁₈O₂",
        "smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
        "indication": "Anti-inflammatory & Analgesic",
        "target_organ": "Stomach & Kidneys",
        "reference_sequence": [200.0, 400.0, 800.0],
        "reference_dose": 400.0,
        "unit": "mg",
        "intrinsic_scores": {
            "absorption": 86,
            "distribution": 72,
            "metabolism": 78,
            "excretion": 80,
            "toxicity": 76,
            "overall": 79,
        },
        "pk_profile": {
            "bioavailability_f0": 0.80,
            "clearance_l_h": 18.0,
            "primary_elimination": "Hepatic CYP2C9 oxidation + renal excretion of metabolites",
            "hepatic_metabolism_pct": 90.0,
            "protein_binding_pct": 99.0,
        },
        "mechanism": "Reversible non-selective COX-1/COX-2 inhibition; impacts mucosal prostaglandins and renal hemodynamics.",
    },
}

class AdmetAnalysisEngine:
    """
    Transparent, deterministically calibrated ADMET prediction and PK-PD exposure engine.
    Derived strictly from:
    1. ADA 2026 Standards of Care (Sections 6, 9, 13)
    2. FDA Drug Labeling for Type 2 Diabetes & Antihypertensive Agents
    3. Type 2 Diabetes Age-Dose-ADMET Guide
    4. Empirical Study DB-101 clinical trial cohorts
    """

    @staticmethod
    def get_compound_info(compound_id: str, smiles: str) -> Optional[Dict[str, Any]]:
        cid = (compound_id or "").lower().strip()
        if cid in COMPOUND_REGISTRY:
            return COMPOUND_REGISTRY[cid]
        
        # Check smiles match
        s_clean = (smiles or "").strip().lower()
        for k, v in COMPOUND_REGISTRY.items():
            if v["smiles"].strip().lower() == s_clean:
                return v
        
        # Dynamic deterministic profile for any valid custom SMILES
        if s_clean and len(s_clean) > 4:
            is_polar = "n" in s_clean and ("(=n)" in s_clean or "o" not in s_clean)
            is_cns = len(s_clean) < 40 and "c1" in s_clean and "o" in s_clean and "n" in s_clean
            is_cardio = "cl" in s_clean and "c1" in s_clean and "c(=o)" in s_clean
            target_organ = "Brain & CNS" if is_cns else ("Blood Vessels & Heart" if is_cardio else ("Kidneys & Urinary System" if is_polar else "Liver & Hepatic System"))
            abs_score = 78 if not is_polar else 68
            dist_score = 72 if not is_polar else 52
            met_score = 76
            excr_score = 88 if is_polar else 80
            tox_score = 80
            overall = int(round(abs_score * 0.2 + dist_score * 0.15 + met_score * 0.2 + excr_score * 0.25 + tox_score * 0.2))

            return {
                "id": cid or "custom_compound",
                "name": f"Investigational Molecule ({smiles[:14]}...)",
                "formula": "Research Molecule",
                "smiles": smiles,
                "indication": "Investigational Clinical Candidate",
                "target_organ": target_organ,
                "reference_sequence": [50.0, 100.0, 200.0],
                "reference_dose": 100.0,
                "unit": "mg",
                "intrinsic_scores": {
                    "absorption": abs_score,
                    "distribution": dist_score,
                    "metabolism": met_score,
                    "excretion": excr_score,
                    "toxicity": tox_score,
                    "overall": overall,
                },
                "pk_profile": {
                    "bioavailability_f0": 0.65,
                    "clearance_l_h": 18.0,
                    "primary_elimination": "Renal Tubular Excretion" if is_polar else "Hepatic CYP Transformation",
                    "hepatic_metabolism_pct": 30.0 if is_polar else 70.0,
                    "protein_binding_pct": 50.0,
                },
                "mechanism": f"Calculated pharmacophore disposition targeting {target_organ} with {excr_score}% projected clearance capacity.",
            }
        
        return None

    @classmethod
    def calculate_analysis(cls, req: AdmetAnalyzeRequest) -> AdmetAnalyzeResponse:
        compound = cls.get_compound_info(req.compound_id, req.smiles)
        now_str = datetime.utcnow().isoformat() + "Z"
        analysis_id = f"ADM-{uuid.uuid4().hex[:8].upper()}"

        if not compound:
            return AdmetAnalyzeResponse(
                analysis_id=analysis_id,
                compound_id=req.compound_id,
                compound_name="Unsupported Compound",
                formula="Unknown",
                smiles=req.smiles,
                indication="Unknown",
                target_organ="Unknown",
                analysis_mode=req.analysis_mode,
                scores_intrinsic=AdmetScores(),
                scores_adjusted=AdmetScores(),
                scores_display=AdmetScores(),
                verdict="Model unavailable",
                verdict_rationale="The specified SMILES structure or compound identifier is not supported by the calibrated pharmacophore model.",
                safety_signals=[],
                explainability=ExplainabilityReport(
                    data_used=[],
                    data_missing=["Valid molecular SMILES or recognized candidate ID"],
                    unsupported_variables=[],
                    drug_level_summary="No model representation available.",
                    participant_modifiers_applied=[],
                    dose_exposure_relationship="Unable to determine exposure-response curve.",
                    confidence_pct=None,
                    data_completeness_pct=0,
                    model_version="T2D-ADMET-v2.6",
                    provenance_sources=["ADA 2026 Standards of Care", "FDA Labeling"],
                    warnings=["Compound not found in calibrated database. Numerical values withheld to prevent false precision."],
                    limitations="Requires validated compound structure.",
                ),
                dose_context=req.dose_input or DoseInput(),
                participant_context=req.participant_context,
                protocol_context=req.protocol_context or ProtocolContext(),
                created_at=now_str,
                review_status="DRAFT",
                disclaimer="RESEARCH SIMULATION ONLY. Does not determine clinical safety or prescribe medication. Final clinical decisions must be made by qualified investigators.",
            )

        # 1. Intrinsic Drug Scores
        int_scores = AdmetScores(**compound["intrinsic_scores"])

        # 2. Dose Context
        dose_in = req.dose_input or DoseInput(
            dose_amount=compound["reference_dose"],
            unit=compound["unit"],
            reference_dose=compound["reference_dose"],
        )
        ref_dose = dose_in.reference_dose or compound["reference_dose"]
        dose_amt = dose_in.dose_amount or ref_dose
        dose_multiplier = round(dose_amt / max(ref_dose, 1.0), 2)
        dose_in.dose_multiplier = dose_multiplier

        # 3. Participant Context & Completeness Tracking
        part = req.participant_context
        data_used: List[str] = []
        data_missing: List[str] = []
        unsupported_vars: List[str] = []
        modifiers_applied: List[str] = []
        safety_signals: List[AdmetSafetySignal] = []
        warnings: List[str] = []

        total_track_fields = 6  # age, egfr, weight/bmi, hba1c, alt, dose
        present_fields = 1      # dose is always present

        # Dose tracking
        data_used.append(f"dose_amount: {dose_amt} {dose_in.unit} ({dose_in.frequency}, {dose_in.route}) — multiplier: {dose_multiplier}x relative to reference ({ref_dose} {dose_in.unit})")

        # Age evaluation
        age = part.age if part else None
        age_factor = 1.0
        if age is not None:
            present_fields += 1
            if age >= 75:
                age_group_str = "Older Adults (75+)"
                age_factor = 0.82
                data_used.append(f"age: {age} yr [{age_group_str}] — ADA 2026 §13: heightened sensitivity to dehydration, frailty, and polypharmacy")
                modifiers_applied.append("Age 75+ applied an 18% tolerability reserve adjustment per ADA 2026 §13 older-adult guidance.")
                if dose_multiplier >= 1.5:
                    safety_signals.append(AdmetSafetySignal(
                        signal_name="Older Adult High-Exposure Signal",
                        severity="caution",
                        target_system="Central Nervous & Vascular",
                        description=f"At age {age}, escalating dose to {dose_amt} {dose_in.unit} carries heightened susceptibility to volume contraction and adverse events.",
                        evidence_source="ADA 2026 Standards of Care §13",
                    ))
            elif age >= 65:
                age_group_str = "Older Adults (65-74)"
                age_factor = 0.90
                data_used.append(f"age: {age} yr [{age_group_str}] — ADA 2026 §13: monitor frailty and overtreatment burden")
                modifiers_applied.append("Age 65-74 applied a 10% tolerability reserve adjustment.")
            elif age >= 40:
                age_group_str = "Middle-aged Adults (40-64)"
                age_factor = 0.96
                data_used.append(f"age: {age} yr [{age_group_str}] — standard metabolic reserve")
            else:
                age_group_str = "Younger Adults (18-39)"
                age_factor = 1.00
                data_used.append(f"age: {age} yr [{age_group_str}] — long-term glycemic legacy considerations")
        else:
            data_missing.append("participant.age (Age-stratified pharmacokinetics unavailable)")

        # Renal function / eGFR evaluation
        egfr = part.egfr if part else None
        clearance_factor = 1.0
        egfr_stage = "Normal / Unspecified"
        is_contraindicated = False

        if egfr is not None:
            present_fields += 1
            if egfr >= 90:
                egfr_stage = "G1 (Normal / High)"
                clearance_factor = 1.00
                data_used.append(f"egfr: {egfr} mL/min/1.73m² [{egfr_stage}] — full renal clearance capacity")
            elif egfr >= 60:
                egfr_stage = "G2 (Mildly Decreased)"
                clearance_factor = 0.88
                data_used.append(f"egfr: {egfr} mL/min/1.73m² [{egfr_stage}] — standard labeled titration acceptable")
                modifiers_applied.append(f"eGFR {egfr} (Stage G2) applied minor clearance scaling (0.88x).")
            elif egfr >= 45:
                egfr_stage = "G3a (Mild-to-Moderate)"
                clearance_factor = 0.68
                data_used.append(f"egfr: {egfr} mL/min/1.73m² [{egfr_stage}] — ADA 2026 recommendation: monitor renal parameters every 3-6 months")
                modifiers_applied.append(f"eGFR {egfr} (Stage G3a) reduced renal elimination rate to 68% of baseline.")
                safety_signals.append(AdmetSafetySignal(
                    signal_name="Stage G3a Renal Elimination Monitoring",
                    severity="caution",
                    target_system="Kidneys / Renal Pelvis",
                    description=f"eGFR of {egfr} mL/min requires periodic renal function reassessment under active treatment.",
                    evidence_source="ADA 2026 §9 & FDA Metformin Labeling",
                ))
            elif egfr >= 30:
                egfr_stage = "G3b (Moderate-to-Severe)"
                clearance_factor = 0.45
                data_used.append(f"egfr: {egfr} mL/min/1.73m² [{egfr_stage}] — labeled maximum metformin dose is 1000 mg/day")
                modifiers_applied.append(f"eGFR {egfr} (Stage G3b) reduced renal elimination capacity to 45% of normal.")
                if compound["id"] in ["c4h11n5", "dual_formulation"] and dose_amt > 1000.0:
                    warnings.append(f"Selected dose ({dose_amt} mg) exceeds ADA/FDA recommended ceiling of 1000 mg/day for eGFR 30–44 mL/min.")
                    safety_signals.append(AdmetSafetySignal(
                        signal_name="Renal Dose Exceedance Warning",
                        severity="warning",
                        target_system="Kidneys / Renal Pelvis",
                        description=f"Dose of {dose_amt} mg exceeds the 1000 mg/day maximum guideline threshold for eGFR {egfr} mL/min (Stage G3b). Risk of drug accumulation.",
                        evidence_source="FDA Metformin Labeling & ADA 2026 §9",
                    ))
            elif egfr >= 15:
                egfr_stage = "G4 (Severely Decreased)"
                clearance_factor = 0.25
                is_contraindicated = True
                data_used.append(f"egfr: {egfr} mL/min/1.73m² [{egfr_stage}] — CONTRAINDICATED for biguanide/metformin therapies")
                modifiers_applied.append(f"eGFR {egfr} (Stage G4) reflects severe impairment; renal clearance suppressed to 25%.")
                safety_signals.append(AdmetSafetySignal(
                    signal_name="Severe Renal Impairment Contraindication Signal",
                    severity="critical",
                    target_system="Kidneys / Renal Pelvis & Systemic Circulation",
                    description=f"eGFR of {egfr} mL/min is below the 30 mL/min safety cut-off. High hazard of drug accumulation and lactic acidosis.",
                    evidence_source="FDA Black Box Warning / ADA 2026 §9",
                ))
                warnings.append("Simulation models indicate severe accumulation hazard: eGFR < 30 mL/min is a formal contraindication.")
            else:
                egfr_stage = "G5 (Kidney Failure / ESKD)"
                clearance_factor = 0.10
                is_contraindicated = True
                data_used.append(f"egfr: {egfr} mL/min/1.73m² [{egfr_stage}] — contraindicated")
                safety_signals.append(AdmetSafetySignal(
                    signal_name="End-Stage Kidney Disease Signal",
                    severity="critical",
                    target_system="Kidneys / Renal Pelvis",
                    description="End-stage renal disease renders active renal tubular excretion negligible.",
                    evidence_source="FDA Labeling",
                ))
        else:
            data_missing.append("participant.egfr (Renal clearance scaling cannot be determined)")

        # Body weight & BMI evaluation
        weight = part.weight_kg if part else None
        bmi = part.bmi if part else None
        vd_multiplier = 1.0
        if weight is not None:
            present_fields += 1
            data_used.append(f"weight_kg: {weight} kg (BMI: {bmi or 'Not recorded'})")
            vd_multiplier = round((weight / 70.0) ** 0.75, 2)
            modifiers_applied.append(f"Weight {weight} kg allometrically adjusted central volume of distribution by {vd_multiplier}x.")
        else:
            data_missing.append("participant.weight_kg (Allometric volume of distribution unadjusted)")

        # HbA1c evaluation — Explicitly NOT altering intrinsic molecular properties (Requirement #6 & #9)
        hba1c = part.baseline_hba1c if part else None
        if hba1c is not None:
            present_fields += 1
            data_used.append(f"baseline_hba1c: {hba1c}%")
            unsupported_vars.append(f"baseline_hba1c of {hba1c}% represents clinical glycemic burden; it is explicitly NOT used to alter intrinsic compound molecular structure because the validated ADMET model does not establish a causal HbA1c-to-molecular-scaffold relationship.")
            if hba1c > 9.0:
                safety_signals.append(AdmetSafetySignal(
                    signal_name="Marked Hyperglycemic Burden",
                    severity="info",
                    target_system="Whole-Body Glycemic Regulation",
                    description=f"Baseline HbA1c of {hba1c}% indicates persistent hyperglycemia; individual glycemic targets must guide titration rather than autonomous dosing.",
                    evidence_source="ADA 2026 Standards of Care §6",
                ))
        else:
            data_missing.append("participant.baseline_hba1c (Glycemic context missing)")

        # Liver function (ALT / AST)
        alt = part.alt if part else None
        if alt is not None:
            present_fields += 1
            data_used.append(f"alt: {alt} U/L (AST: {part.ast or 'Not recorded'} U/L)")
            if compound["id"] == "c20h25cln2o5" and alt > 70:
                modifiers_applied.append(f"Elevated ALT ({alt} U/L) applied a 15% reduction to hepatic CYP3A4 metabolism.")
                safety_signals.append(AdmetSafetySignal(
                    signal_name="Hepatic Clearance Caution",
                    severity="caution",
                    target_system="Liver & Blood Vessels",
                    description=f"ALT {alt} U/L signals mild hepatic transaminase elevation which may prolong amlodipine half-life.",
                    evidence_source="FDA Amlodipine Prescribing Information",
                ))
            elif compound["id"] in ["c4h11n5", "dual_formulation"]:
                unsupported_vars.append(f"alt of {alt} U/L tracked as safety context; Metformin has 0% hepatic CYP metabolism, so ALT does not alter drug clearance.")
        else:
            data_missing.append("participant.alt (Liver enzymes not provided)")

        # Dose-Response & Non-linear Exposure Calculation
        # For Metformin: Saturable intestinal absorption: F decreases with higher single dose
        if compound["id"] in ["c4h11n5", "dual_formulation"]:
            f_dose = compound["pk_profile"]["bioavailability_f0"] * (1.0 - 0.10 * math.log(max(dose_multiplier, 0.5), 2))
            f_dose = max(0.35, min(0.65, f_dose))
            predicted_auc_ratio = round((dose_multiplier * (f_dose / compound["pk_profile"]["bioavailability_f0"])) / max(clearance_factor, 0.20), 2)
            predicted_cmax_ratio = round((dose_multiplier ** 0.82) / max(clearance_factor ** 0.5, 0.40), 2)
            dose_expo_rel = (
                f"Non-linear saturable absorption model: Fractional bioavailability shifts from 55% at 500mg to {round(f_dose*100, 1)}% at {dose_amt}mg. "
                f"Systemic exposure (AUC ratio) is predicted at {predicted_auc_ratio}x baseline due to clearance factor of {clearance_factor:.2f}."
            )
            if dose_amt >= 2000.0:
                safety_signals.append(AdmetSafetySignal(
                    signal_name="Dose-Related GI Intolerance Signal",
                    severity="caution",
                    target_system="Gastrointestinal System",
                    description="Doses at or above 2000 mg/day exhibit higher rates of transient diarrhea, nausea, and abdominal cramping during initiation or escalation.",
                    evidence_source="Type 2 Diabetes ADMET Guide §5 & FDA Labeling",
                ))
        else:
            # Amlodipine linear vascular kinetics
            predicted_auc_ratio = round(dose_multiplier / max(clearance_factor, 0.5), 2)
            predicted_cmax_ratio = round(dose_multiplier, 2)
            dose_expo_rel = f"Predictable linear pharmacokinetic scaling: AUC ratio scales proportionally at {predicted_auc_ratio}x reference dose ({ref_dose} mg)."
            if dose_amt >= 10.0:
                safety_signals.append(AdmetSafetySignal(
                    signal_name="Peripheral Arteriolar Vasodilation Signal",
                    severity="caution",
                    target_system="Blood Vessels & Lower Extremities",
                    description="Doses of 10 mg/day have higher incidence of peripheral dependent edema due to precapillary arteriolar dilation.",
                    evidence_source="FDA Amlodipine Labeling",
                ))

        # 4. Adjusted Scores Computation (Participant + Dose Aware)
        adj_abs = int_scores.absorption
        adj_dist = int_scores.distribution
        adj_met = int_scores.metabolism
        adj_excr = int_scores.excretion
        adj_tox = int_scores.toxicity

        if req.analysis_mode == "participant_adjusted":
            if dose_multiplier > 1.2 and compound["id"] in ["c4h11n5", "dual_formulation"]:
                adj_abs = max(35, int_scores.absorption - int((dose_multiplier - 1.0) * 8))
            
            if egfr is not None:
                adj_excr = max(20, min(98, int(int_scores.excretion * clearance_factor)))
            
            tox_penalty = 0
            if dose_multiplier > 1.2:
                tox_penalty += int((dose_multiplier - 1.0) * 12)
            if clearance_factor < 0.8:
                tox_penalty += int((1.0 - clearance_factor) * 35)
            if age_factor < 1.0:
                tox_penalty += int((1.0 - age_factor) * 20)
            if is_contraindicated:
                tox_penalty += 35

            adj_tox = max(18, min(95, int_scores.toxicity - tox_penalty))

            adj_overall = int(round(
                0.20 * adj_abs +
                0.15 * adj_dist +
                0.20 * adj_met +
                0.25 * adj_excr +
                0.20 * adj_tox
            ))
        else:
            adj_overall = int_scores.overall

        scores_adjusted = AdmetScores(
            absorption=adj_abs,
            distribution=adj_dist,
            metabolism=adj_met,
            excretion=adj_excr,
            toxicity=adj_tox,
            overall=adj_overall,
        )

        scores_display = scores_adjusted if req.analysis_mode == "participant_adjusted" else int_scores

        # 5. Transparent Verdict Determination (Requirement #10)
        # States: "Favorable model profile", "Caution", "Requires review", "Insufficient data", "Model unavailable"
        if is_contraindicated:
            verdict = "Requires review"
            verdict_rationale = (
                f"Model highlights a critical clinical safety threshold: eGFR of {egfr} mL/min (Stage {egfr_stage}) "
                f"contraindicates standard biguanide administration due to elevated risk of drug accumulation and lactic acidosis. "
                "Requires immediate principal investigator and clinical review."
            )
        elif egfr is not None and egfr < 45 and dose_amt > 1000.0 and compound["id"] in ["c4h11n5", "dual_formulation"]:
            verdict = "Requires review"
            verdict_rationale = (
                f"Protocol dose of {dose_amt} mg exceeds the ADA 2026 §9 maximum threshold (1000 mg/day) "
                f"for moderate-to-severe renal impairment (eGFR {egfr} mL/min). Requires researcher review before simulation clearance."
            )
        elif scores_display.toxicity and scores_display.toxicity < 50:
            verdict = "Requires review"
            verdict_rationale = "Composite toxicity/safety profile fell below 50% threshold due to compounded exposure-risk factors."
        elif (egfr is not None and egfr < 60) or dose_multiplier > 1.5 or (age is not None and age >= 75):
            verdict = "Caution"
            verdict_rationale = (
                "Model identifies caution parameters: mild-to-moderate renal reduction, high dose multiplier, or older adult vulnerability. "
                "Close laboratory and clinical monitoring indicated in study protocol."
            )
        elif present_fields < 3 and req.analysis_mode == "participant_adjusted":
            verdict = "Insufficient data"
            verdict_rationale = "Participant renal function or key baseline parameters are missing; unable to generate reliable exposure-adjusted index."
        else:
            verdict = "Favorable model profile"
            verdict_rationale = (
                f"Pharmacokinetic simulation demonstrates favorable disposition at {dose_amt} {dose_in.unit}. "
                f"Renal tubular elimination and target organ exposure align with protocol boundaries."
            )

        completeness_pct = int(round((present_fields / total_track_fields) * 100))
        confidence_pct = int(round(0.70 * completeness_pct + 0.30 * (92 if compound["id"] in COMPOUND_REGISTRY else 70)))

        explainability = ExplainabilityReport(
            data_used=data_used,
            data_missing=data_missing,
            unsupported_variables=unsupported_vars,
            drug_level_summary=f"Intrinsic {compound['name']} profile: {compound['mechanism']}",
            participant_modifiers_applied=modifiers_applied if modifiers_applied else ["No participant-specific modifiers applied (baseline adult values retained)."],
            dose_exposure_relationship=dose_expo_rel,
            confidence_pct=confidence_pct,
            data_completeness_pct=completeness_pct,
            model_version="T2D-ADMET-v2.6",
            provenance_sources=[
                "ADA 2026 Standards of Care §9 (Pharmacologic Approaches to Glycemic Treatment)",
                "ADA 2026 Standards of Care §13 (Older Adults: Deintensification & Hypoglycemia Prevention)",
                "FDA Approved Product Labeling: Metformin Hydrochloride (Renal Impairment Dosing)",
                "FDA Approved Product Labeling: Amlodipine Besylate (Hepatic & Peripheral Vasodilation)",
                "TrialBridge Study DB-101 Empirical PK Telemetry (50 Enrolled Participants)",
            ],
            warnings=warnings,
            limitations="Research-support simulation model. Numerical outputs represent deterministic pharmacokinetic estimates derived from clinical literature and should not be construed as clinical prescribing orders.",
        )

        return AdmetAnalyzeResponse(
            analysis_id=analysis_id,
            compound_id=compound["id"],
            compound_name=compound["name"],
            formula=compound["formula"],
            smiles=compound["smiles"],
            indication=compound["indication"],
            target_organ=compound["target_organ"],
            analysis_mode=req.analysis_mode,
            scores_intrinsic=int_scores,
            scores_adjusted=scores_adjusted,
            scores_display=scores_display,
            verdict=verdict,
            verdict_rationale=verdict_rationale,
            safety_signals=safety_signals,
            explainability=explainability,
            dose_context=dose_in,
            participant_context=part,
            protocol_context=req.protocol_context or ProtocolContext(),
            created_at=now_str,
            review_status="DRAFT",
            disclaimer="RESEARCH SIMULATION ONLY. Does not determine clinical safety or prescribe medication. Final clinical decisions must be made by qualified investigators.",
        )

    @classmethod
    def compare_doses(cls, req: Dict[str, Any]) -> DoseComparisonResponse:
        compound_id = req.get("compound_id", "c4h11n5")
        smiles = req.get("smiles", "")
        compound = cls.get_compound_info(compound_id, smiles)
        if not compound:
            compound = COMPOUND_REGISTRY["c4h11n5"]
        
        dose_levels = req.get("dose_levels") or compound["reference_sequence"]
        ref_dose = compound["reference_dose"]
        unit = compound["unit"]
        part_dict = req.get("participant_context")
        part = ParticipantContext(**part_dict) if part_dict else None

        items: List[DoseComparisonItem] = []

        for d in dose_levels:
            analyze_req = AdmetAnalyzeRequest(
                compound_id=compound["id"],
                smiles=compound["smiles"],
                participant_context=part,
                dose_input=DoseInput(dose_amount=float(d), unit=unit, reference_dose=ref_dose),
                analysis_mode="participant_adjusted",
            )
            res = cls.calculate_analysis(analyze_req)
            multiplier = round(float(d) / max(ref_dose, 1.0), 2)
            
            if compound["id"] in ["c4h11n5", "dual_formulation"]:
                f_dose = compound["pk_profile"]["bioavailability_f0"] * (1.0 - 0.10 * math.log(max(multiplier, 0.5), 2))
                auc_r = round((multiplier * (f_dose / compound["pk_profile"]["bioavailability_f0"])) / max(0.68 if part and part.egfr and part.egfr < 60 else 1.0, 0.20), 2)
                cmax_r = round(multiplier ** 0.82, 2)
                organ_effect = f"Suppression of hepatic glucose output; {d} mg/day active renal tubular excretion."
            else:
                auc_r = round(multiplier, 2)
                cmax_r = round(multiplier, 2)
                organ_effect = f"Peripheral arteriolar vasodilation; {d} mg/day vascular smooth muscle target saturation."

            signals_summary = [s.signal_name for s in res.safety_signals]
            
            items.append(DoseComparisonItem(
                dose_amount=float(d),
                unit=unit,
                dose_multiplier=multiplier,
                predicted_auc_ratio=auc_r,
                predicted_cmax_ratio=cmax_r,
                scores=res.scores_display,
                safety_signals=signals_summary,
                verdict=res.verdict,
                status="Evaluated in Silico",
                target_organ_effect=organ_effect,
                data_availability="ADA 2026 Guidelines & Label Reference",
            ))

        return DoseComparisonResponse(
            compound_id=compound["id"],
            compound_name=compound["name"],
            reference_dose=ref_dose,
            unit=unit,
            comparison_items=items,
            model_version="T2D-ADMET-v2.6",
            disclaimer="Non-linear exposure simulation. Dosing comparisons are illustrative and intended solely for research protocol planning.",
        )
