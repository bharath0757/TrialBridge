from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.core.permissions import require_role
from app.models.simulation import SimulationCreate, SimulationResponse, SimulationResultInDB
from datetime import datetime

import random

router = APIRouter()

@router.post("/", response_model=SimulationResponse)
def run_sim(
    sim_in: SimulationCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "RESEARCH_COORDINATOR"))
):
    s_data = sim_in.model_dump()
    s_data["created_by"] = current_user["id"]
    s_data["created_at"] = datetime.utcnow()
    s_data["status"] = "COMPLETED"
    
    res = db.simulations.insert_one(s_data)
    sim_id = str(res.inserted_id)
    
    # Generate mock result
    res_data = {
        "simulation_id": sim_id,
        "results": {
            "predicted_enrollment": random.randint(50, 200),
            "estimated_timeline_days": random.randint(90, 365),
            "dropout_rate_estimate": round(random.uniform(0.05, 0.20), 2)
        }
    }
    db.simulation_results.insert_one(res_data)
    
    s_data["_id"] = sim_id
    return s_data

@router.get("/", response_model=List[SimulationResponse])
def list_sims(
    db = Depends(get_db),
    current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "RESEARCH_COORDINATOR"))
):
    sims = list(db.simulations.find({"created_by": current_user["id"]}))
    for s in sims: s["_id"] = str(s["_id"])
    return sims

@router.get("/{id}/results")
def get_sim_results(
    id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "RESEARCH_COORDINATOR"))
):
    res = db.simulation_results.find_one({"simulation_id": id})
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    res["_id"] = str(res["_id"])
    return res

class DoseResponseRequest(BaseModel):
    compound: str = "C4H11N5"
    smiles: Optional[str] = None
    dosage_mg: int = 1000
    treatment_weeks: int = 24
    baseline_egfr: float = 58.0
    baseline_uacr: float = 180.0
    baseline_bp: float = 145.0

@router.get("/compounds")
def get_compounds(
    current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "RESEARCH_COORDINATOR"))
):
    return [
        {
            "id": "c4h11n5",
            "name": "C₄H₁₁N₅ (Metformin)",
            "formula": "C₄H₁₁N₅",
            "smiles": "CN(C)C(=N)NC(=N)N",
            "condition": "Type 2 Diabetes",
            "affected_organ": "Kidneys",
            "mechanism": "OCT2 / MATE1 Tubular Excretion & Glomerular Preservation",
            "primary_3d_system": "visceral"
        },
        {
            "id": "c20h25cln2o5",
            "name": "C₂₀H₂₅ClN₂O₅ (Amlodipine)",
            "formula": "C₂₀H₂₅ClN₂O₅",
            "smiles": "CCOC(=O)C1=C(COCCN)NC(C)=C(C(=O)OC)C1c1ccccc1Cl",
            "condition": "Blood Pressure / Hypertension",
            "affected_organ": "Blood Vessels, Brain, Heart, Kidneys",
            "mechanism": "L-type Calcium Channel Antagonism & Arteriolar Vasodilation",
            "primary_3d_system": "vascular"
        },
        {
            "id": "aspirin",
            "name": "C₉H₈O₄ (Aspirin)",
            "formula": "C₉H₈O₄",
            "smiles": "CC(=O)Oc1ccccc1C(=O)O",
            "condition": "Cardiovascular Prevention & Anti-inflammatory",
            "affected_organ": "Stomach, Platelets",
            "mechanism": "Irreversible COX-1 Acetylation & Platelet Anti-aggregation",
            "primary_3d_system": "visceral"
        },
        {
            "id": "paracetamol",
            "name": "C₈H₉NO₂ (Paracetamol)",
            "formula": "C₈H₉NO₂",
            "smiles": "CC(=O)Nc1ccc(O)cc1",
            "condition": "Analgesic & Antipyretic",
            "affected_organ": "Liver",
            "mechanism": "Central Prostaglandin Synthesis & Hepatic Glucuronidation",
            "primary_3d_system": "visceral"
        },
        {
            "id": "ibuprofen",
            "name": "C₁₃H₁₈O₂ (Ibuprofen)",
            "formula": "C₁₃H₁₈O₂",
            "smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
            "condition": "Anti-inflammatory & Analgesic",
            "affected_organ": "Stomach, Kidneys",
            "mechanism": "Non-Selective COX-1 / COX-2 Reversible Antagonism",
            "primary_3d_system": "visceral"
        }
    ]

@router.post("/dose-response")
def run_dose_response(
    req: DoseResponseRequest,
    current_user: dict = Depends(require_role("PRINCIPAL_INVESTIGATOR", "RESEARCH_COORDINATOR"))
):
    from app.services.ai_safeguards_service import simulate_pharmacodynamic_response
    result = simulate_pharmacodynamic_response(
        compound=req.compound,
        smiles=req.smiles,
        dosage_mg=req.dosage_mg,
        treatment_weeks=req.treatment_weeks,
        baseline_egfr=req.baseline_egfr,
        baseline_uacr=req.baseline_uacr,
        baseline_bp=req.baseline_bp
    )
    return result

