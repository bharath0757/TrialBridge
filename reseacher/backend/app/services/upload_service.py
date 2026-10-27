import csv
import io
import re
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from bson import ObjectId

logger = logging.getLogger(__name__)

STANDARD_COLUMN_ALIASES: Dict[str, List[str]] = {
    "participant_code": ["participant_code", "participantid", "participant_id", "patientid", "patient_id", "subjectid", "subject_id", "id", "code"],
    "name": ["name", "patient_name", "full_name", "subject_name", "candidate_name"],
    "age": ["age", "age_in_years", "patient_age", "years_old"],
    "gender": ["gender", "sex", "patient_gender"],
    "condition": ["condition", "diagnosis", "medical_condition", "disease", "dm", "diabetes", "diabetesstatus"],
    "hba1c": ["hba1c", "hb", "hemoglobin", "a1c", "glycated_hemoglobin", "hemoglobin_a1c"],
    "egfr": ["egfr", "egfr_ml_min", "gfr", "renal_function", "renal_clearance", "kidney_filtration"],
    "creatinine": ["creatinine", "serum_creatinine", "cr"],
    "blood_pressure": ["blood_pressure", "bp", "systolic_bp", "systolic"],
    "medications": ["medications", "current_medications", "meds", "prescriptions"],
    "bmi": ["bmi", "body_mass_index"],
    "dose_cohort": ["dose_cohort", "cohort", "dose", "dosage"],
}

def auto_detect_mapping(headers: List[str]) -> Dict[str, str]:
    """
    Intelligently maps uploaded spreadsheet/CSV column headers to canonical TrialBridge attributes.
    """
    mapping: Dict[str, str] = {}
    for h in headers:
        normalized_header = re.sub(r"[^a-zA-Z0-9]", "", h).lower()
        matched = False
        
        # Pass 1: Exact match
        for canonical, aliases in STANDARD_COLUMN_ALIASES.items():
            for alias in aliases:
                norm_alias = re.sub(r"[^a-zA-Z0-9]", "", alias).lower()
                if normalized_header == norm_alias:
                    mapping[h] = canonical
                    matched = True
                    break
            if matched:
                break

        # Pass 2: Substring match prioritizing longest alias
        if not matched:
            candidates = []
            for canonical, aliases in STANDARD_COLUMN_ALIASES.items():
                for alias in aliases:
                    norm_alias = re.sub(r"[^a-zA-Z0-9]", "", alias).lower()
                    if len(norm_alias) >= 3 and norm_alias in normalized_header:
                        candidates.append((len(norm_alias), canonical))
            if candidates:
                candidates.sort(reverse=True, key=lambda x: x[0])
                mapping[h] = candidates[0][1]
                matched = True

        if not matched:
            mapping[h] = h.strip()
    return mapping


def normalize_value(canonical_field: str, raw_val: Any) -> Tuple[Any, Optional[str], bool, str]:
    """
    Normalizes field value into structured clinical format.
    Returns: (normalized_val, unit, is_valid, error_msg)
    """
    if raw_val is None or str(raw_val).strip() == "":
        return None, None, False, "Missing value"

    s_val = str(raw_val).strip()

    if canonical_field == "age":
        # Extract digits
        match = re.search(r"(\d+)", s_val)
        if match:
            age_int = int(match.group(1))
            if 0 < age_int < 125:
                return age_int, "years", True, ""
            return age_int, "years", False, f"Age {age_int} out of valid biological range (1-125)"
        return None, None, False, f"Invalid age string '{s_val}'"

    elif canonical_field == "gender":
        low = s_val.lower()
        if low in ["m", "male", "man"]:
            return "MALE", None, True, ""
        elif low in ["f", "female", "woman"]:
            return "FEMALE", None, True, ""
        elif low in ["o", "other", "non-binary"]:
            return "OTHER", None, True, ""
        return s_val.upper(), None, True, ""

    elif canonical_field in ["hba1c", "egfr", "creatinine", "bmi"]:
        # Extract numeric float
        match = re.search(r"([\d\.]+)", s_val)
        if match:
            try:
                num_val = float(match.group(1))
                unit = "%" if canonical_field == "hba1c" else "mL/min/1.73m²" if canonical_field == "egfr" else "mg/dL" if canonical_field == "creatinine" else "kg/m²"
                return num_val, unit, True, ""
            except ValueError:
                pass
        return None, None, False, f"Invalid numeric value '{s_val}' for {canonical_field}"

    elif canonical_field in ["pregnancy", "pregnant"]:
        low = s_val.lower()
        if low in ["true", "yes", "y", "1", "positive"]:
            return True, None, True, ""
        elif low in ["false", "no", "n", "0", "negative", "not pregnant"]:
            return False, None, True, ""
        return s_val, None, True, ""

    elif canonical_field == "condition":
        return s_val, None, True, ""

    # Default string representation
    return s_val, None, True, ""

def process_candidate_data(
    db,
    study_id: str,
    filename: str,
    records: List[Dict[str, Any]],
    custom_mappings: Optional[Dict[str, str]] = None,
    user_id: str = "coordinator"
) -> Dict[str, Any]:
    """
    Normalizes candidate data, assigns strict study scope, validates clinical attributes,
    records upload batches, and persists candidates into both db.candidates and db.participants.
    """
    try:
        study = db.studies.find_one({"_id": ObjectId(study_id)})
    except Exception:
        study = db.studies.find_one({"_id": study_id})
    if not study:
        study = db.studies.find_one({"id": study_id})
    if not study:
        raise ValueError(f"Study with ID '{study_id}' not found in database.")

    study_title = study.get("title") or study.get("name") or "Clinical Investigation"
    org_id = study.get("organization_id") or "org-001"

    # Detect header keys across all records
    headers: List[str] = []
    for r in records:
        for k in r.keys():
            if k not in headers:
                headers.append(k)

    column_mapping = custom_mappings or auto_detect_mapping(headers)

    # Existing participant codes in this study to prevent duplicates
    existing_codes = set()
    for sp in db.study_participants.find({"study_id": str(study_id)}):
        existing_codes.add(str(sp.get("participant_id")))
    for p in db.participants.find({"studyId": str(study_id)}):
        existing_codes.add(str(p.get("id") or p.get("participant_code")))
    for c in db.candidates.find({"study_id": str(study_id)}):
        existing_codes.add(str(c.get("participant_code") or c.get("id")))

    total_records = 0
    valid_records = 0
    invalid_records = 0
    duplicate_records = 0
    missing_records = 0
    validation_errors: List[Dict[str, Any]] = []

    batch_id_obj = ObjectId()
    batch_id = str(batch_id_obj)

    candidates_to_insert = []
    participants_to_upsert = []

    for row_idx, row in enumerate(records, start=1):
        total_records += 1
        record_attrs: Dict[str, Any] = {}
        normalized_clinical_data: Dict[str, Any] = {}
        original_data: Dict[str, Any] = dict(row)
        has_error = False
        row_errors = []

        for original_col, raw_val in row.items():
            canonical = column_mapping.get(original_col, original_col)
            norm_val, unit, is_valid, err_msg = normalize_value(canonical, raw_val)

            if raw_val and not is_valid:
                has_error = True
                row_errors.append(f"{original_col}: {err_msg}")

            record_attrs[canonical] = {
                "originalValue": raw_val,
                "normalizedValue": norm_val,
                "unit": unit,
                "valid": is_valid
            }
            if norm_val is not None:
                normalized_clinical_data[canonical] = norm_val

        # Participant code resolution
        p_code = None
        if "participant_code" in normalized_clinical_data:
            p_code = str(normalized_clinical_data["participant_code"])
        elif "id" in normalized_clinical_data:
            p_code = str(normalized_clinical_data["id"])
        elif original_data.get("id") or original_data.get("participant_code") or original_data.get("Patient_ID"):
            p_code = str(original_data.get("id") or original_data.get("participant_code") or original_data.get("Patient_ID"))
        else:
            p_code = f"PT-{study_id[-3:]}-{str(row_idx).zfill(3)}"

        # Duplicate check within this study
        if p_code in existing_codes:
            duplicate_records += 1
            validation_errors.append({
                "row": row_idx,
                "participant_code": p_code,
                "type": "DUPLICATE",
                "message": f"Participant code '{p_code}' already exists in study {study_id}"
            })
            continue

        # Required fields check
        age_val = normalized_clinical_data.get("age")
        if age_val is None:
            missing_records += 1
            row_errors.append("Required clinical attribute 'Age' is missing")
            has_error = True

        if has_error:
            invalid_records += 1
            validation_errors.append({
                "row": row_idx,
                "participant_code": p_code,
                "type": "VALIDATION_FAILED",
                "message": "; ".join(row_errors)
            })
            screening_status = "INSUFFICIENT_DATA"
        else:
            valid_records += 1
            screening_status = "UNSCREENED"

        existing_codes.add(p_code)

        cand_id_obj = ObjectId()
        cand_id_str = str(cand_id_obj)
        cand_name = original_data.get("Name") or original_data.get("name") or f"Candidate {p_code}"
        cand_gender = normalized_clinical_data.get("gender") or "UNSPECIFIED"

        candidate_doc = {
            "_id": cand_id_obj,
            "id": cand_id_str,
            "participant_code": p_code,
            "batch_id": batch_id,
            "study_id": str(study_id),
            "studyId": str(study_id),
            "name": cand_name,
            "age": age_val,
            "gender": cand_gender,
            "normalized_data": normalized_clinical_data,
            "raw_data": original_data,
            "screening_status": screening_status,
            "match_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        candidates_to_insert.append(candidate_doc)

        participant_doc = {
            "id": p_code,
            "participant_code": p_code,
            "name": cand_name,
            "organization_id": org_id,
            "study_id": str(study_id),
            "studyId": str(study_id),
            "study_name": study_title,
            "studyName": study_title,
            "age": age_val,
            "gender": cand_gender,
            "status": "ACTIVE",
            "screeningStatus": "candidate" if not has_error else "insufficient_data",
            "consentStatus": "pending",
            "enrollmentStatus": "pending",
            "workflowState": "UPLOADED" if not has_error else "INSUFFICIENT_DATA",
            "clinical_attributes": normalized_clinical_data,
            "clinicalData": {
                "source": filename,
                "raw_values": original_data,
                "normalized_metadata": record_attrs,
                "uploaded_by": user_id,
                "uploaded_at": datetime.utcnow().isoformat()
            },
            "upload_batch_id": batch_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        participants_to_upsert.append(participant_doc)

    # Insert candidates in bulk
    if candidates_to_insert:
        db.candidates.insert_many(candidates_to_insert)

    # Upsert into participants and study_participants
    for p in participants_to_upsert:
        db.participants.update_one(
            {"id": p["id"], "studyId": str(study_id)},
            {"$set": p},
            upsert=True
        )
        db.study_participants.update_one(
            {"participant_id": p["id"], "study_id": str(study_id)},
            {"$set": {
                "participant_id": p["id"],
                "study_id": str(study_id),
                "status": "IDENTIFIED",
                "upload_batch_id": batch_id,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )

    # Insert Batch Record
    batch_doc = {
        "_id": batch_id_obj,
        "id": batch_id,
        "study_id": str(study_id),
        "uploaded_by": str(user_id),
        "filename": filename,
        "total_records": total_records,
        "valid_records": valid_records,
        "invalid_records": invalid_records,
        "duplicate_records": duplicate_records,
        "missing_records": missing_records,
        "column_mapping": column_mapping,
        "validation_errors": validation_errors,
        "status": "COMPLETED",
        "created_at": datetime.utcnow(),
        "uploaded_at": datetime.utcnow()
    }
    db.upload_batches.insert_one(batch_doc)

    return batch_doc


def process_candidate_file(
    db,
    study_id: str,
    filename: str,
    content: bytes,
    custom_mappings: Optional[Dict[str, str]] = None,
    user_id: str = "coordinator"
) -> Dict[str, Any]:
    """
    Parses CSV or JSON file payload and invokes process_candidate_data.
    """
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1", errors="replace")

    records: List[Dict[str, Any]] = []

    if filename.lower().endswith(".json"):
        try:
            import json
            parsed = json.loads(text)
            if isinstance(parsed, list):
                records = parsed
            elif isinstance(parsed, dict):
                records = parsed.get("candidates") or parsed.get("records") or [parsed]
        except Exception as e:
            raise ValueError(f"Invalid JSON file formatting: {str(e)}")
    else:
        # Default CSV parser
        reader = csv.DictReader(io.StringIO(text))
        for r in reader:
            records.append(dict(r))

    return process_candidate_data(
        db=db,
        study_id=study_id,
        filename=filename,
        records=records,
        custom_mappings=custom_mappings,
        user_id=user_id
    )


def process_uploaded_dataset(
    db,
    study_id: str,
    raw_content: str,
    filename: str,
    user_id: str,
    custom_mapping: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Backwards compatibility wrapper for string inputs.
    """
    return process_candidate_file(
        db=db,
        study_id=study_id,
        filename=filename,
        content=raw_content.encode("utf-8"),
        custom_mappings=custom_mapping,
        user_id=user_id
    )

