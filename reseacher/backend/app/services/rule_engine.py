import re
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

def evaluate_single_criterion(
    criterion: Dict[str, Any],
    candidate_attrs: Dict[str, Any],
    raw_metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministically evaluates a single protocol criterion against candidate attributes.
    Returns structured, auditable evidence.
    """
    crit_name = criterion.get("name") or criterion.get("field") or "Protocol Criterion"
    crit_field = (criterion.get("field") or criterion.get("name") or "").lower().replace(" ", "_")
    operator = (criterion.get("operator") or "==").lower().strip()
    target_val = str(criterion.get("value", "")).strip()
    is_inclusion = criterion.get("is_inclusion", True)
    if "category" in criterion:
        is_inclusion = (criterion["category"] == "inclusion")

    # Look up attribute in candidate
    observed_val = None
    source_field = crit_field
    
    # Check direct canonical keys
    for k in [crit_field, crit_field.replace("_", ""), crit_field.replace(" ", "")]:
        if k in candidate_attrs:
            observed_val = candidate_attrs[k]
            source_field = k
            break
            
    # Fuzzy alias check if not found directly
    if observed_val is None:
        if "age" in crit_field:
            observed_val = candidate_attrs.get("age")
        elif "hba1c" in crit_field or "hemoglobin" in crit_field or "hb" in crit_field:
            observed_val = candidate_attrs.get("hba1c")
        elif "egfr" in crit_field or "gfr" in crit_field or "renal" in crit_field:
            observed_val = candidate_attrs.get("egfr")
        elif "condition" in crit_field or "diabetes" in crit_field:
            observed_val = candidate_attrs.get("condition")
        elif "pregnant" in crit_field or "pregnancy" in crit_field:
            observed_val = candidate_attrs.get("pregnancy") or "Not pregnant"

    # 1. Check for Missing Data
    if observed_val is None or str(observed_val).strip() == "":
        return {
            "criterion_id": str(criterion.get("id") or criterion.get("_id") or crit_name),
            "name": crit_name,
            "condition": f"{crit_name} {operator} {target_val}",
            "expected_value": target_val,
            "actual_value": "DATA NOT AVAILABLE",
            "status": "INSUFFICIENT_DATA",
            "is_inclusion": is_inclusion,
            "evidence": f"Patient record does not contain reported value for '{crit_name}'. Follow-up lab needed.",
            "source": raw_metadata.get(source_field, {}).get("source", "Uploaded Clinical Dataset")
        }

    # 2. Evaluate operator logic
    passed = False
    evidence_desc = ""

    try:
        # Numeric comparison
        if operator in [">=", "<=", ">", "<", "between"]:
            obs_num = float(re.findall(r"[\d\.]+", str(observed_val))[0]) if re.findall(r"[\d\.]+", str(observed_val)) else None
            
            if obs_num is None:
                return {
                    "criterion_id": str(criterion.get("id") or criterion.get("_id") or crit_name),
                    "name": crit_name,
                    "condition": f"{crit_name} {operator} {target_val}",
                    "expected_value": target_val,
                    "actual_value": str(observed_val),
                    "status": "INSUFFICIENT_DATA",
                    "is_inclusion": is_inclusion,
                    "evidence": f"Non-numeric value '{observed_val}' could not be evaluated against numeric rule",
                    "source": "Uploaded Record"
                }

            if operator == "between" or "-" in target_val:
                # Handle range e.g. "30-65" or "25 to 60"
                range_nums = [float(n) for n in re.findall(r"[\d\.]+", target_val)]
                if len(range_nums) >= 2:
                    low_val, high_val = min(range_nums[0], range_nums[1]), max(range_nums[0], range_nums[1])
                    passed = (low_val <= obs_num <= high_val)
                    evidence_desc = f"Observed {obs_num} {'falls inside' if passed else 'falls outside'} acceptable window ({low_val}-{high_val})"
                else:
                    passed = (obs_num >= range_nums[0])
                    evidence_desc = f"Observed {obs_num} vs baseline {range_nums[0]}"
            else:
                target_num = float(re.findall(r"[\d\.]+", target_val)[0])
                if operator == ">=":
                    passed = (obs_num >= target_num)
                    evidence_desc = f"Observed {obs_num} is {'>=' if passed else '<'} threshold {target_num}"
                elif operator == "<=":
                    passed = (obs_num <= target_num)
                    evidence_desc = f"Observed {obs_num} is {'<=' if passed else '>'} threshold {target_num}"
                elif operator == ">":
                    passed = (obs_num > target_num)
                    evidence_desc = f"Observed {obs_num} is {'>' if passed else '<='} threshold {target_num}"
                elif operator == "<":
                    passed = (obs_num < target_num)
                    evidence_desc = f"Observed {obs_num} is {'<' if passed else '>='} threshold {target_num}"

        # String / Categorical / Equality comparison
        else:
            obs_str = str(observed_val).strip().lower()
            tgt_str = target_val.strip().lower()

            if operator in ["==", "equals", "equal"]:
                passed = (obs_str == tgt_str or (tgt_str in ["yes", "true"] and obs_str in ["yes", "true", "1"]) or (tgt_str in ["no", "false"] and obs_str in ["no", "false", "0"]))
                evidence_desc = f"Patient attribute '{observed_val}' {'matches' if passed else 'does not match'} protocol expectation '{target_val}'"
            elif operator in ["!=", "not equals", "not equal"]:
                passed = (obs_str != tgt_str)
                evidence_desc = f"Patient attribute '{observed_val}' is {'different from' if passed else 'identical to'} restricted condition '{target_val}'"
            elif operator in ["contains", "in"]:
                passed = (tgt_str in obs_str or obs_str in tgt_str)
                evidence_desc = f"Patient attribute '{observed_val}' {'contains' if passed else 'lacks'} keyword '{target_val}'"
            else:
                passed = (obs_str == tgt_str)
                evidence_desc = f"Evaluated '{observed_val}' against '{target_val}'"

    except Exception as e:
        logger.warning(f"Error evaluating rule {crit_name}: {e}")
        return {
            "criterion_id": str(criterion.get("id") or criterion.get("_id") or crit_name),
            "name": crit_name,
            "condition": f"{crit_name} {operator} {target_val}",
            "expected_value": target_val,
            "actual_value": str(observed_val),
            "status": "REQUIRES_HUMAN_REVIEW",
            "is_inclusion": is_inclusion,
            "evidence": f"Evaluation exception: {str(e)}",
            "source": "Uploaded Record"
        }

    # Final criteria status accounting for inclusion vs exclusion
    if is_inclusion:
        status = "PASS" if passed else "FAIL"
    else:
        # For exclusion criteria, if passed == True, the exclusion condition occurred -> FAIL
        status = "FAIL" if passed else "PASS"
        evidence_desc = f"[Exclusion Rule] {evidence_desc} -> {'Excluded' if status == 'FAIL' else 'Clear'}"

    return {
        "criterion_id": str(criterion.get("id") or criterion.get("_id") or crit_name),
        "name": crit_name,
        "criterion_name": crit_name,
        "condition": f"{crit_name} {operator} {target_val}",
        "expected_value": target_val,
        "actual_value": str(observed_val),
        "status": status,
        "is_inclusion": is_inclusion,
        "evidence": evidence_desc,
        "source": "Uploaded Dataset"
    }

def evaluate_candidate_decision_tree(
    candidate: Dict[str, Any],
    criteria: List[Dict[str, Any]],
    criteria_version: int = 1
) -> Dict[str, Any]:
    """
    Executes an explicit, traceable decision tree for eligibility matching.
    Follows sequence:
      1. Check attribute availability
      2. Evaluate inclusion criteria
      3. Evaluate exclusion criteria
      4. Synthesize decision tree path and explainability proof.
    """
    candidate_id = candidate.get("id") or candidate.get("participant_code") or "P-UNKNOWN"
    attributes = candidate.get("normalized_data") or candidate.get("clinical_attributes") or candidate
    raw_metadata = candidate.get("raw_data") or candidate.get("clinicalData", {}).get("normalized_metadata", {})

    evaluated_criteria = []
    tree_steps = ["START"]
    has_insufficient_data = False
    has_inclusion_failure = False
    has_exclusion_failure = False

    for crit in criteria:
        res = evaluate_single_criterion(crit, attributes, raw_metadata)
        evaluated_criteria.append(res)
        crit_label = res["name"]

        if res["status"] == "INSUFFICIENT_DATA":
            has_insufficient_data = True
            tree_steps.append(f"{crit_label}: MISSING_DATA")
        elif res["status"] == "FAIL":
            if res["is_inclusion"]:
                has_inclusion_failure = True
                tree_steps.append(f"{crit_label} (Inclusion): FAIL")
            else:
                has_exclusion_failure = True
                tree_steps.append(f"{crit_label} (Exclusion): MATCHED_EXCLUSION")
        else:
            tree_steps.append(f"{crit_label}: PASS")

    # Decision tree synthesis
    if has_exclusion_failure:
        overall_recommendation = "POTENTIALLY_INELIGIBLE"
        tree_steps.append("RESULT: POTENTIALLY_INELIGIBLE (Exclusion Triggered)")
        clinical_explanation = "Candidate satisfies one or more exclusion criteria defined in protocol."
    elif has_inclusion_failure:
        overall_recommendation = "POTENTIALLY_INELIGIBLE"
        tree_steps.append("RESULT: POTENTIALLY_INELIGIBLE (Inclusion Failed)")
        clinical_explanation = "Candidate does not meet all required inclusion threshold criteria."
    elif has_insufficient_data:
        overall_recommendation = "INSUFFICIENT_DATA"
        tree_steps.append("RESULT: INSUFFICIENT_DATA (Mandatory Labs Missing)")
        clinical_explanation = "One or more protocol criteria could not be evaluated due to missing lab values."
    else:
        overall_recommendation = "POTENTIALLY_ELIGIBLE"
        tree_steps.append("RESULT: POTENTIALLY_ELIGIBLE (All Protocol Rules Satisfied)")
        clinical_explanation = "All inclusion criteria were met and no exclusion criteria were triggered."

    tree_steps.append("GATE: HUMAN REVIEW REQUIRED (PI AUTHORIZATION MANDATORY)")

    total_rules = len(criteria)
    passed_rules = sum(1 for c in evaluated_criteria if c["status"] == "PASS")
    match_percentage = round((passed_rules / total_rules * 100), 1) if total_rules > 0 else 0

    overall_status = "PASS" if overall_recommendation == "POTENTIALLY_ELIGIBLE" else ("FAIL" if overall_recommendation == "POTENTIALLY_INELIGIBLE" else "INSUFFICIENT_DATA")

    return {
        "participant_id": candidate_id,
        "participant_code": candidate_id,
        "study_id": str(candidate.get("study_id") or candidate.get("studyId")),
        "criteria_version": criteria_version,
        "evaluated_at": datetime.utcnow().isoformat(),
        "overall_recommendation": overall_recommendation,
        "overall_status": overall_status,
        "match_percentage": match_percentage,
        "match_score": match_percentage,
        "decision_tree_path": " -> ".join(tree_steps),
        "path": " -> ".join(tree_steps),
        "clinical_explanation": clinical_explanation,
        "summary": clinical_explanation,
        "criteria_evaluations": evaluated_criteria,
        "evaluated_criteria": evaluated_criteria,
        "human_review_required": True,
        "disclaimer": "Automated screening is decision support only. Final clinical eligibility determination requires authorized human review by the Principal Investigator."
    }

