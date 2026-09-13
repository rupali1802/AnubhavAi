"""
Unit tests for Real SHAP Explainability Service and Verification Pipeline.
"""

import pytest
from app.ai.shap_service import SkillConfidenceMLModel, calculate_real_shap
from app.ai.extractor import evaluate_verification_response, _classify_answer_state


def test_shap_additive_property():
    """Verify that Base Value + sum(SHAP values) == Final Score."""
    skill_name = "Mechanical Repair & Diagnostics"
    dimensions = {
        "Problem Diagnosis": 90.0,
        "Technical Understanding": 85.0,
        "Troubleshooting Approach": 88.0,
        "Safety Awareness": 92.0
    }
    score = 88.5

    result = calculate_real_shap(
        skill_name=skill_name,
        experience_confidence=95.0,
        years_experience=4.0,
        dimensions=dimensions,
        evaluated_score=score
    )

    assert "base_value" in result
    assert "final_score" in result
    assert "contributions" in result
    
    base_val = result["base_value"]
    shap_sum = sum(c["shap_value"] for c in result["contributions"])
    total_reconstructed = round(base_val + shap_sum, 1)

    assert abs(total_reconstructed - score) <= 0.1, f"Expected {score}, got {total_reconstructed}"


def test_no_evidence_bypasses_shap():
    """Verify NO_EVIDENCE state skips SHAP generation and returns no score."""
    no_ev_phrases = [
        "I don't know",
        "pata nahi",
        "theriyathu",
        "i am not sure",
    ]

    for text in no_ev_phrases:
        state = _classify_answer_state(text)
        assert state == "no_evidence", f"Failed for text: {text}"

        res = evaluate_verification_response("Plumbing Repair", "Scenario text", text, "en")
        assert res["status"] == "no_evidence"
        assert res["score"] == 0
        assert res["shap_data"] is None
        assert res["shap_explanation"] is None


def test_valid_answer_generates_real_shap():
    """Verify valid answer calculates real SHAP contributions."""
    valid_text = "I will first check the main circuit breaker with a multimeter, then inspect neutral wiring and replace bad capacitor."
    res = evaluate_verification_response("Electrical Wiring", "Scenario text", valid_text, "en")
    
    assert res["status"] in ["demonstrated", "partially_demonstrated"]
    assert res["score"] > 0
    assert res["shap_data"] is not None
    assert "contributions" in res["shap_data"]
    assert len(res["shap_data"]["contributions"]) > 0
    assert res["shap_explanation"] is not None
