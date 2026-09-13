import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "AnubhavAI API"
    assert "version" in data


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_device_user():
    response = client.post(
        "/api/users/device",
        json={"device_id": "test-device-999", "name": "Test User", "district": "Chennai", "state": "Tamil Nadu", "language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["device_id"] == "test-device-999"


def test_extract_skills_from_text():
    response = client.post(
        "/api/skills/extract",
        json={
            "user_id": 1,
            "text": "I have been managing a small tea shop for three years. I handle daily inventory, serve customers, calculate daily profits, and manage sales.",
            "language": "en"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data
    assert len(data["skills"]) > 0


def test_get_verification_scenario():
    response = client.post(
        "/api/skills/1/verify",
        json={"user_id": 1, "skill_id": 1, "language": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "scenario" in data
    assert "question" in data


def test_evaluate_verification_answer():
    # First generate scenario to ensure verification record exists
    scenario_res = client.post(
        "/api/skills/1/verify",
        json={"user_id": 1, "skill_id": 1, "language": "en"}
    )
    verif_id = scenario_res.json()["id"]

    response = client.post(
        "/api/verification/evaluate",
        json={
            "verification_id": verif_id,
            "user_response": "I ensure fresh ingredients, inspect storage temperatures, follow hygiene rules, and train staff on quality standards.",
            "language": "en"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "score" in data


def test_get_opportunities():
    response = client.get("/api/opportunities/recommendations?user_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) > 0


def test_admin_login():
    response = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "anubhav2024"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_extract_baking_skills():
    response = client.post(
        "/api/skills/extract",
        json={
            "user_id": 1,
            "text": "I have been baking birthday cakes, pastries, cookies, and managing commercial ovens for four years.",
            "language": "en"
        }
    )
    assert response.status_code == 200
    skills = [s["name"] for s in response.json()["skills"]]
    assert any("Baking" in s for s in skills)


def test_extract_tailoring_skills():
    response = client.post(
        "/api/skills/extract",
        json={
            "user_id": 1,
            "text": "मैं 6 साल से साड़ियां, ब्लाउज की सिलाई और जरदोजी कढ़ाई का काम करती हूँ। कपड़े की कटाई और फिटिंग भी संभालती हूँ।",
            "language": "hi"
        }
    )
    assert response.status_code == 200
    skills = [s["name"] for s in response.json()["skills"]]
    assert any("Tailoring" in s or "Fabric" in s for s in skills)


def test_extract_cooking_catering_skills():
    response = client.post(
        "/api/skills/extract",
        json={
            "user_id": 1,
            "text": "நான் 5 வருடங்களாக திருமண சமையல் மற்றும் டிபன் சர்வீஸ் செய்து வருகிறேன்.",
            "language": "ta"
        }
    )
    assert response.status_code == 200
    skills = [s["name"] for s in response.json()["skills"]]
    assert any("Culinary" in s or "Food" in s for s in skills)


def test_extract_makeup_beautician_skills():
    response = client.post(
        "/api/skills/extract",
        json={
            "user_id": 1,
            "text": "I run a beauty parlour and specialize in bridal makeup, facial treatments, hair styling, and mehendi design for 3 years.",
            "language": "en"
        }
    )
    assert response.status_code == 200
    skills = [s["name"] for s in response.json()["skills"]]
    assert any("Makeup" in s or "Skin Care" in s for s in skills)


def test_extract_electrical_and_plumbing_skills():
    response = client.post(
        "/api/skills/extract",
        json={
            "user_id": 1,
            "text": "I do domestic electrical house wiring, motor repair, as well as plumber pipe fitting and tap leak repairs.",
            "language": "en"
        }
    )
    assert response.status_code == 200
    skills = [s["name"] for s in response.json()["skills"]]
    assert any("Electrical" in s for s in skills)
    assert any("Plumbing" in s or "Sanitary" in s for s in skills)

