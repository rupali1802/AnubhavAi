from app.ai.extractor import extract_skills, generate_verification_scenario

def test_extract_skills_from_questions():
    q1 = "What skills are needed for a python software developer?"
    res1 = extract_skills(q1, "en")
    assert len(res1["skills"]) > 0
    assert any("Software" in s["name"] or "Programming" in s["name"] for s in res1["skills"])

    q2 = "How do I start a bakery and cake shop?"
    res2 = extract_skills(q2, "en")
    assert len(res2["skills"]) > 0
    assert any("Baking" in s["name"] for s in res2["skills"])

    q3 = "What skills are required for solar panel maintenance?"
    res3 = extract_skills(q3, "en")
    assert len(res3["skills"]) > 0

    q4 = "I do tailoring and stitching blouses for 4 years"
    res4 = extract_skills(q4, "en")
    assert len(res4["skills"]) > 0
    assert any("Tailoring" in s["name"] for s in res4["skills"])


def test_verification_scenario_skill_relevance():
    # Test Baking scenario relevance
    sc_baking = generate_verification_scenario("Baking & Cake Decoration", "en")
    text_baking = (sc_baking["scenario"] + " " + sc_baking["question"]).lower()
    assert any(w in text_baking for w in ["cake", "icing", "oven", "fondant", "baking", "batter", "macaron"])
    assert "damaged" not in text_baking or "refund" not in text_baking

    # Test Electrical scenario relevance
    sc_elec = generate_verification_scenario("Electrical Wiring & Appliance Repair", "en")
    text_elec = (sc_elec["scenario"] + " " + sc_elec["question"]).lower()
    assert any(w in text_elec for w in ["circuit", "breaker", "fan", "capacitor", "voltage", "wire", "multimeter"])

    # Test Software Development scenario relevance
    sc_dev = generate_verification_scenario("Software Development & Programming", "en")
    text_dev = (sc_dev["scenario"] + " " + sc_dev["question"]).lower()
    assert any(w in text_dev for w in ["api", "query", "database", "memory", "leak", "vitals", "javascript", "code", "latency"])


def test_verification_scenario_randomization():
    # Calling scenario generation multiple times should yield diverse scenarios from pools/fallback
    scenarios = set()
    for _ in range(20):
        res = generate_verification_scenario("Baking & Cake Decoration", "en")
        scenarios.add(res["scenario"])
    
    # Should have picked multiple distinct scenarios across 20 iterations
    assert len(scenarios) > 1

