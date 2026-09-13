"""
AI Service — Skill Extraction, Verification, Gap Analysis, Opportunity Matching.
Falls back to rich Heuristic Matching & Universal Skill Synthesis when OPENAI_API_KEY is not configured or offline.
"""
import json
import re
import random
import time
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.ai.demo_data import (
    DEMO_SKILLS, DEMO_VERIFICATION, DEMO_SKILL_GAPS,
    DEMO_SCHEMES, DEMO_PROGRESSION_STEPS, DEMO_SCENARIO
)
from app.ai.shap_service import calculate_real_shap

try:
    from openai import OpenAI
    _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except Exception:
    _openai_client = None


def _call_llm(
    system_prompt: str,
    user_prompt: str,
    json_mode: bool = True,
    temperature: float = 0.3,
) -> Optional[str]:
    """Call OpenAI LLM with fallback to None."""
    if not _openai_client or settings.is_demo_mode:
        return None
    try:
        kwargs = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = _openai_client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        print(f"[AI] LLM call failed: {e}")
        return None


def _get_language_instruction(lang: str) -> str:
    if lang == "ta":
        return "IMPORTANT: Ensure all user-facing narrative text, summaries, and Tamil-specific fields (_ta) are strictly in natural, fluent Tamil script (தமிழ்). Do NOT mix Hindi or English words inside Tamil text."
    elif lang == "hi":
        return "IMPORTANT: Ensure all user-facing narrative text, summaries, and Hindi-specific fields (_hi) are strictly in natural, fluent Devanagari Hindi. Do NOT mix Tamil or English words inside Hindi text."
    return "IMPORTANT: Respond in clear, professional English without mixing languages."


SKILL_TRANSLATIONS = {
    "Commercial Culinary Preparation & Cooking": {
        "hi": "व्यावसायिक पाक कला व भोजन निर्माण",
        "ta": "வணிகரீதியான சமையல் தயாரிப்பு"
    },
    "Tailoring & Garment Construction": {
        "hi": "सिलाई और वस्त्र निर्माण",
        "ta": "தையல் மற்றும் ஆடை தயாரிப்பு"
    },
    "Bridal & Event Makeup Artistry": {
        "hi": "ब्राइडल व इवेंट मेकअप कला",
        "ta": "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை"
    },
    "Domestic Electrical Wiring & Appliance Repair": {
        "hi": "घरेलू बिजली वायरिंग व उपकरण मरम्मत",
        "ta": "வீட்டு மின் வயரிங் மற்றும் உபகரணப் பழுது"
    },
    "Plumbing, Fitting & Sanitary Maintenance": {
        "hi": "प्लंबिंग, फिटिंग व सेनेटरी रखरखाव",
        "ta": "பிளம்பிங் மற்றும் சுகாதாரப் பராமரிப்பு"
    },
    "HVAC & Refrigeration Maintenance": {
        "hi": "एचवीएसी व रेफ्रिजरेशन रखरखाव",
        "ta": "HVAC மற்றும் குளிரூட்டல் பராமரிப்பு"
    },
    "Baking & Cake Decoration": {
        "hi": "बेकिंग और केक सजावट",
        "ta": "பேக்கிங் மற்றும் கேக் அலங்காரம்"
    },
    "Automobile & Two-Wheeler Mechanics": {
        "hi": "ऑटोमोबाइल व टू-व्हीलर मैकेनिक",
        "ta": "ஆட்டோமொபைல் மெக்கானிக்"
    },
    "Carpentry & Custom Woodworking": {
        "hi": "कारपेंट्री व कस्टम वुडवर्किंग",
        "ta": "தச்சர் மற்றும் மரவேலை"
    },
    "Welding & Metal Fabrication": {
        "hi": "वेल्डिंग व मेटल फैब्रिकेशन",
        "ta": "வெல்டிங் மற்றும் உலோக வேலை"
    },
    "Software & Web Development": {
        "hi": "सॉफ्टवेयर व वेब डेवलपमेंट",
        "ta": "மென்பொருள் உருவாக்கம்"
    },
    "Solar Panel Installation & Renewable Energy": {
        "hi": "सोलर पैनल इंस्टॉलेशन",
        "ta": "சூரிய ஒளி பேனல் நிறுவுதல்"
    },
    "Retail Store Operations & Inventory Billing": {
        "hi": "रिटेल स्टोर ऑपरेशन्स व बिलिंग",
        "ta": "சில்லறை கடை நிர்வாகம்"
    },
    "Mobile & Smartphone Hardware Repair": {
        "hi": "मोबाइल रिपेयरिंग",
        "ta": "மொபைல் பழுதுபார்ப்பு"
    },
    "House Painting & Wall Surface Finishing": {
        "hi": "पेंटिंग व वॉल फिनिशिंग",
        "ta": "சுவர் வண்ணம் பூசுதல்"
    }
}


def _get_localized_skill_name(skill_name: str, lang: str) -> str:
    """Return strictly localized skill name to prevent language cross-contamination."""
    if not skill_name:
        if lang == 'hi': return "व्यावसायिक कौशल"
        if lang == 'ta': return "தொழில்முறை திறன்"
        return "Practical Trade Skill"

    if lang == "en":
        return skill_name

    # Exact lookup
    if skill_name in SKILL_TRANSLATIONS and lang in SKILL_TRANSLATIONS[skill_name]:
        return SKILL_TRANSLATIONS[skill_name][lang]

    sn_lower = skill_name.lower().strip()
    
    # Check partial match in SKILL_TRANSLATIONS keys
    for key, trans in SKILL_TRANSLATIONS.items():
        if key.lower() in sn_lower or sn_lower in key.lower():
            if lang in trans:
                return trans[lang]

    # Keyword fallback
    if any(k in sn_lower for k in ['cook', 'culinary', 'food', 'chef', 'catering', 'tiffin', 'पाक', 'भोजन', 'ரொட்டி', 'சமையல்']):
        return "व्यावसायिक पाक कला व भोजन निर्माण" if lang == 'hi' else "வணிகரீதியான சமையல் தயாரிப்பு"
    if any(k in sn_lower for k in ['bake', 'baking', 'cake', 'pastry', 'बेकिंग', 'பேக்கிங்']):
        return "बेकिंग और केक सजावट" if lang == 'hi' else "பேக்கிங் மற்றும் கேக் அலங்காரம்"
    if any(k in sn_lower for k in ['tailor', 'stitching', 'fabric', 'garment', 'blouse', 'सिलाई', 'தையல்']):
        return "सिलाई और वस्त्र निर्माण" if lang == 'hi' else "தையல் மற்றும் ஆடை தயாரிப்பு"
    if any(k in sn_lower for k in ['electric', 'wiring', 'circuit', 'motor', 'इलेक्ट्रिक', 'மின்சாரம்']):
        return "घरेलू बिजली वायरिंग व उपकरण मरम्मत" if lang == 'hi' else "வீட்டு மின் வயரிங் மற்றும் உபகரணப் பழுது"
    if any(k in sn_lower for k in ['plumb', 'pipe', 'leak', 'drain', 'प्लंबिंग', 'குழாய்']):
        return "प्लंबिंग, फिटिंग व सेनेटरी रखरखाव" if lang == 'hi' else "பிளம்பிங் மற்றும் சுகாதாரப் பராமரிப்பு"
    if any(k in sn_lower for k in ['makeup', 'beautician', 'parlour', 'skin', 'मेकअप', 'அழகு']):
        return "ब्राइडल व इवेंट मेकअप कला" if lang == 'hi' else "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை"
    if any(k in sn_lower for k in ['paint', 'painting', 'wall', 'पेंटिंग', 'வண்ணம்']):
        return "पेंटिंग व वॉल फिनिशिंग" if lang == 'hi' else "சுவர் வண்ணம் பூசுதல்"
    if any(k in sn_lower for k in ['mechanic', 'auto', 'vehicle', 'bike', 'मैकेनिक', 'வாகனம்']):
        return "ऑटोमोबाइल व टू-व्हीलर मैकेनिक" if lang == 'hi' else "ஆட்டோமொபைல் மெக்கானிக்"
    if any(k in sn_lower for k in ['carpenter', 'carpentry', 'wood', 'कारपेंट्री', 'தச்சர்']):
        return "कारपेंट्री व कस्टम वुडवर्किंग" if lang == 'hi' else "தச்சர் மற்றும் மரவேலை"
    if any(k in sn_lower for k in ['weld', 'welding', 'metal', 'वेल्डिंग', 'வெல்டிங்']):
        return "वेल्डिंग व मेटल फैब्रिकेशन" if lang == 'hi' else "வெல்டிங் மற்றும் உலோக வேலை"
    if any(k in sn_lower for k in ['software', 'code', 'web', 'program', 'सॉफ्टवेयर', 'மென்பொருள்']):
        return "सॉफ्टवेयर व वेब डेवलपमेंट" if lang == 'hi' else "மென்பொருள் உருவாக்கம்"

    return "व्यावसायिक कौशल" if lang == 'hi' else "தொழில்முறை திறன்"





def is_question(text: str) -> bool:
    t = text.lower().strip()
    return t.endswith('?') or any(w in t for w in ['what', 'how', 'why', 'can', 'which', 'tell me', 'explain', 'kya', 'kaise', 'batao', 'eppadi', 'enna', 'list', 'skills for', 'skills needed'])


def has_kw(text: str, keywords: List[str]) -> bool:
    """Check keyword presence with exact word boundaries for short words."""
    for kw in keywords:
        if len(kw) <= 3 and kw.isascii():
            if re.search(r'\b' + re.escape(kw) + r'\b', text, re.IGNORECASE):
                return True
        else:
            if kw.lower() in text.lower():
                return True
    return False


def extract_skills(raw_text: str, language: str = "en") -> Dict[str, Any]:
    """Extract skills from spoken experience, questions, or text narrative using LLM or dynamic heuristic engine."""
    if not settings.is_demo_mode and _openai_client:
        lang_instruction = _get_language_instruction(language)
        system_prompt = f"""You are an expert vocational skill extractor, career advisor, and AI mentor for AnubhavAI.
Analyze the user's input. The input may be:
- A direct work experience statement ("I have 5 years experience in tailoring and blouse design")
- A question or inquiry ("What skills are needed for solar installation?", "How do I start a bakery?", "What skills do I have if I sell clothes?")
- A query about tech/professions ("Tell me skills for python development", "Skills for accounting")
- Any short phrase or statement ("electrician", "welding", "bike mechanic")

YOUR MANDATE:
1. Understand the intent, trade, or question. Provide a helpful 1-2 sentence summary answering the question or context in {language}.
2. Extract or infer ALL relevant practical, technical, vocational, digital, and business skills related to the query or experience.
3. Return a clean JSON object with this exact structure:
{{
  "summary": "Direct, clear summary or answer to the user's query",
  "skills": [
    {{
      "name": "Skill name in English",
      "name_hi": "Skill name in Hindi",
      "name_ta": "Skill name in Tamil",
      "category": "Skill category (e.g., Food Production, Textile & Apparel, Electrical & Electronics, IT & Digital, Business Management)",
      "confidence": 0.85-0.98,
      "confidence_level": "high|medium|low",
      "evidence": "Why this skill is relevant to the user's question/text in English",
      "evidence_hi": "Hindi evidence/explanation",
      "evidence_ta": "Tamil evidence/explanation",
      "years_experience": 3
    }}
  ],
  "clarification_needed": false,
  "clarification_question": null
}}"""

        result = _call_llm(system_prompt, raw_text)
        if result:
            try:
                parsed = json.loads(result)
                if parsed.get("skills"):
                    return parsed
            except Exception:
                pass

    return _heuristic_extract_skills(raw_text, language)


def _heuristic_extract_skills(raw_text: str, language: str = "en") -> Dict[str, Any]:
    """Dynamically parse questions, queries, and transcripts across 35+ Trade & Skill Domains with Universal Fallback Generator."""
    text_lower = raw_text.lower().strip()
    
    years_match = re.search(r'(\d+)\s*(?:years?|yrs?|साल|आंडु|ஆண்டு|வருடம்|வருடங்கள்)', text_lower)
    years = int(years_match.group(1)) if years_match else 3

    detected_skills = []

    # 1. Baking, Confectionery & Pastry
    if has_kw(text_lower, ['baking', 'bake', 'baker', 'bakery', 'cake', 'pastry', 'bread', 'oven', 'biscuit', 'cookie', 'muffin', 'cupcake', 'icing', 'fondant', 'confectionery', 'donuts', 'brownie', 'dessert', 'pao', 'pav', 'bun', 'बेकिंग', 'बेकर', 'केक', 'पेस्ट्री', 'ओवन', 'பேக்கிங்', 'கேக்', 'ஓவன்', 'ரொட்டி', 'பிஸ்கட்']):
        detected_skills.append({
            "name": "Baking & Cake Decoration",
            "name_hi": "बेकिंग और केक सजावट",
            "name_ta": "பேக்கிங் மற்றும் கேக் அலங்காரம்",
            "category": "Baking & Confectionery",
            "confidence": 0.96,
            "confidence_level": "high",
            "evidence": "Commercial baking, cake decoration, dough preparation, and oven temperature management.",
            "evidence_hi": "व्यावसायिक बेकिंग, केक सजावट, आटा तैयार करने और ओवन तापमान प्रबंधन में अनुभवी।",
            "evidence_ta": "வணிகரீதியான பேக்கிங், கேக் அலங்காரம் மற்றும் ஓவன் மேலாண்மையில் அனுபவம் கொண்டவர்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Commercial Oven & Bakery Operations",
            "name_hi": "व्यावसायिक ओवन व बेकरी संचालन",
            "name_ta": "வணிகரீதியான ஓவன் மற்றும் பேக்கரி நிர்வாகம்",
            "category": "Baking & Confectionery",
            "confidence": 0.92,
            "confidence_level": "high",
            "evidence": "Operating commercial baking ovens, batch timing, hygiene and quality control.",
            "evidence_hi": "व्यावसायिक बेकिंग ओवन का संचालन, बैच समय और स्वच्छता मानक।",
            "evidence_ta": "வர்த்தக ஓவன் இயக்கம் மற்றும் சுகாதார தரங்களை நிர்வகித்தல்.",
            "years_experience": years,
        })

    # 2. Tailoring, Garment Stitching & Embroidery
    if has_kw(text_lower, ['tailor', 'tailoring', 'stitch', 'stitching', 'sew', 'sewing', 'garment', 'cloth', 'clothes', 'fabric', 'dress', 'suit', 'blouse', 'shirt', 'pant', 'embroidery', 'aari', 'zardozi', 'pattern', 'silai', 'darji', 'kapde', 'thayal', 'thuni', 'aadai', 'alteration', 'boutique', 'kurti', 'lehenga', 'salwar', 'सिलाई', 'दर्जी', 'कपड़ा', 'कढ़ाई', 'தையல்', 'துணி', 'ஆடை', 'ஆரி']):
        detected_skills.append({
            "name": "Tailoring & Garment Construction",
            "name_hi": "सिलाई और वस्त्र निर्माण",
            "name_ta": "தையல் மற்றும் ஆடை தயாரிப்பு",
            "category": "Textile & Apparel",
            "confidence": 0.96,
            "confidence_level": "high",
            "evidence": "Tailoring, stitching garments, blouse design, fabric cutting and fitting alteration.",
            "evidence_hi": "सिलाई, ब्लाउज डिजाइन, कपड़े सिलने और कटाई का सक्रिय अनुभव।",
            "evidence_ta": "தையல், பிளவுஸ் டிசைன் மற்றும் ஆடை தைத்தலில் அனுபவம்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Fabric Pattern Cutting & Embroidery Artistry",
            "name_hi": "कपड़ा पैटर्न कटाई व कढ़ाई कला",
            "name_ta": "துணி பேட்டர்ன் வெட்டுதல் & எம்பிராய்டரி",
            "category": "Textile & Apparel",
            "confidence": 0.91,
            "confidence_level": "high",
            "evidence": "Custom garment pattern cutting, Aari/Zardozi embroidery, and fitting alteration.",
            "evidence_hi": "कस्टम कपड़ों के लिए सटीक माप, कटाई व आरी-जरदोजी कढ़ाई।",
            "evidence_ta": "ஆடைகளுக்கான துல்லியமான அளவீடு, வெட்டுதல் மற்றும் ஆரி தையல் கலை.",
            "years_experience": years,
        })

    # 3. Cooking, Catering & Culinary Arts
    if has_kw(text_lower, ['cook', 'cooking', 'culinary', 'chef', 'food', 'catering', 'tiffin', 'mess', 'hotel', 'restaurant', 'kitchen', 'canteen', 'recipe', 'biryani', 'curry', 'sambar', 'roti', 'dosa', 'idli', 'fast food', 'snack', 'samosa', 'achar', 'pickle', 'rasoi', 'samayal', 'unavu', 'உணவு', 'खाना', 'रसोई', 'சமையல்']):
        detected_skills.append({
            "name": "Commercial Culinary Preparation & Cooking",
            "name_hi": "व्यावसायिक पाक कला व भोजन निर्माण",
            "name_ta": "வணிகரீதியான சமையல் தயாரிப்பு",
            "category": "Food Production",
            "confidence": 0.95,
            "confidence_level": "high",
            "evidence": "Preparing daily meals, tiffin services, catering, or commercial recipes.",
            "evidence_hi": "दैनिक भोजन, टिफिन सेवा, कैटरिंग और व्यावसायिक व्यंजन तैयार करने का अनुभव।",
            "evidence_ta": "தினசரி உணவு, டிபன் சேவை மற்றும் சமையல் தயாரிப்பு அனுபவம்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Food Safety, Hygiene & Kitchen Management",
            "name_hi": "खाद्य सुरक्षा व रसोई प्रबंधन",
            "name_ta": "உணவு பாதுகாப்பு & சமையலறை நிர்வாகம்",
            "category": "Food Production",
            "confidence": 0.90,
            "confidence_level": "high",
            "evidence": "Maintaining kitchen hygiene, ingredient quality control, and food safety standards.",
            "evidence_hi": "रसोई की स्वच्छता, सामग्री गुणवत्ता और खाद्य सुरक्षा मानकों का पालन।",
            "evidence_ta": "சமையலறை சுகாதாரம் மற்றும் உணவு பாதுகாப்பு தரங்களை பராமரித்தல்.",
            "years_experience": years,
        })

    # 4. Makeup, Beauty Parlour & Cosmetology
    if has_kw(text_lower, ['parlour', 'parlor', 'beauty', 'beautician', 'hair', 'makeup', 'bridal', 'grooming', 'facial', 'threading', 'waxing', 'bleach', 'haircut', 'hairstyle', 'mehendi', 'henna', 'salon', 'cosmetology', 'skincare', 'सैलून', 'ब्यूटी पार्लर', 'मेकअप', 'மேக்கப்', 'அழகு நிலையம்']):
        detected_skills.append({
            "name": "Bridal & Event Makeup Artistry",
            "name_hi": "ब्राइडल व इवेंट मेकअप कला",
            "name_ta": "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை",
            "category": "Personal Care & Beauty",
            "confidence": 0.95,
            "confidence_level": "high",
            "evidence": "Bridal makeup, festive styling, skincare prep, and cosmetics application.",
            "evidence_hi": "ब्राइडल मेकअप, उत्सव स्टाइलिंग और कॉस्मेटिक्स लगाने में विशेषज्ञता।",
            "evidence_ta": "மணப்பெண் ஒப்பனை, முக அலங்காரம் மற்றும் அழகு சிகிச்சை நிபுணத்துவம்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Skin Care, Facial & Hair Styling Services",
            "name_hi": "सौंदर्य देखभाल व हेयर स्टाइलिंग",
            "name_ta": "அழகு பராமரிப்பு மற்றும் முடி அலங்காரம்",
            "category": "Personal Care & Beauty",
            "confidence": 0.91,
            "confidence_level": "high",
            "evidence": "Performing facials, threading, waxing, hair styling, and salon grooming treatments.",
            "evidence_hi": "फेशियल, थ्रेडिंग, वैक्सिंग और हेयर स्टाइलिंग सेवाएं।",
            "evidence_ta": "ஃபிரேடிங், ஃபேஷியல் மற்றும் முடி அலங்கார சேவைகள் வழங்குதல்.",
            "years_experience": years,
        })

    # 5. Electrical Wiring, Solar & Appliance Repair
    if has_kw(text_lower, ['electric', 'electrician', 'wiring', 'switchboard', 'fuse', 'circuit', 'motor repair', 'inverter', 'light fitting', 'fan repair', 'solar', 'transformer', 'wireman', 'बिजली', 'वायरिंग', 'மின்சார', 'வயர்மேன்', 'சுவிட்ச்', 'மின்சாரம்']):
        detected_skills.append({
            "name": "Domestic & Industrial Electrical Wiring",
            "name_hi": "घरेलू व औद्योगिक बिजली वायरिंग",
            "name_ta": "வீட்டு மற்றும் தொழில்முறை மின்சார வயரிங்",
            "category": "Electrical & Electronics",
            "confidence": 0.95,
            "confidence_level": "high",
            "evidence": "Installing domestic wiring circuits, main switchboards, fuses, and electrical fixtures.",
            "evidence_hi": "घरेलू वायरिंग सर्किट, स्विचबोर्ड और बिजली उपकरणों की स्थापना।",
            "evidence_ta": "மின்சார சுற்றுகள், மெயின் சுவிட்ச்போர்டு மற்றும் சாதனங்களை நிறுவுதல்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Electrical Appliance Diagnostics & Motor Repair",
            "name_hi": "बिजली उपकरण जांच व मोटर मरम्मत",
            "name_ta": "மின் சாதன கண்டறிதல் மற்றும் மோட்டார் பழுது நீக்கம்",
            "category": "Electrical & Electronics",
            "confidence": 0.90,
            "confidence_level": "high",
            "evidence": "Troubleshooting electric motors, ceiling fans, inverters, and household appliances.",
            "evidence_hi": "इलेक्ट्रिक मोटर, पंखे, इन्वर्टर और घरेलू उपकरणों का सुधार।",
            "evidence_ta": "மின்சார மோட்டார், மின்விசிறி மற்றும் வீட்டு உபயோகப் பொருட்களை பழுது நீக்குதல்.",
            "years_experience": years,
        })

    # 6. Plumbing & Pipefitting
    if has_kw(text_lower, ['plumb', 'plumber', 'plumbing', 'pipe', 'fitting', 'tap', 'faucet', 'leakage', 'water tank', 'drainage', 'sanitary', 'borewell', 'नल', 'पाईप', 'प्लम्बर', 'குழாய்', 'பிளம்பர்', 'நீர்']):
        detected_skills.append({
            "name": "Plumbing & Water Pipeline Installation",
            "name_hi": "प्लंबिंग व जल पाइपलाइन बिछाना",
            "name_ta": "பிளம்பிங் மற்றும் குடிநீர் குழாய் அமைத்தல்",
            "category": "Plumbing & Sanitary",
            "confidence": 0.94,
            "confidence_level": "high",
            "evidence": "Laying PVC/metal water pipes, installing taps, valves, and water tank systems.",
            "evidence_hi": "पानी के पाइप, नल, वाल्व और पानी की टंकी प्रणालियों की स्थापना।",
            "evidence_ta": "குடிநீர் குழாய்கள், பம்புகள் மற்றும் தண்ணீர் தொட்டி அமைப்புகளை அமைத்தல்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Sanitary Fitting & Leak Repair",
            "name_hi": "सैनिटरी फिटिंग व लीक मरम्मत",
            "name_ta": "சுகாதார ஃபிட்டிங் மற்றும் கசிவு பழுது நீக்கம்",
            "category": "Plumbing & Sanitary",
            "confidence": 0.89,
            "confidence_level": "high",
            "evidence": "Repairing pipe leakage, bathroom sanitary fittings, and drainage blockages.",
            "evidence_hi": "पाइप रिसाव, बाथरूम सेनेटरी फिटिंग और जल निकासी रुकावटों की मरम्मत।",
            "evidence_ta": "குழாய் கசிவு, குளியலறை சாதனங்கள் மற்றும் வடிகால் அடைப்புகளை சரிசெய்தல்.",
            "years_experience": years,
        })

    # 7. Painting & Surface Coating
    if has_kw(text_lower, ['paint', 'painting', 'painter', 'wall painting', 'coating', 'whitewash', 'distemper', 'primer', 'emulsion', 'चित्रकारी', 'पेंटर', 'पेइन्टिंग', 'வண்ணம்']):
        detected_skills.append({
            "name": "Wall Painting & Surface Coating",
            "name_hi": "दीवार पेंटिंग व सतह कोटिंग",
            "name_ta": "சுவர் வண்ணம் பூசுதல் மற்றும் மேலடுக்கு",
            "category": "Construction & Painting",
            "confidence": 0.95,
            "confidence_level": "high",
            "evidence": "Wall sanding, primer application, emulsion paint roller application, and surface finishing.",
            "evidence_hi": "दीवार की घिसाई, प्राइमर लगाना, इमल्शन पेंट रोलर का उपयोग और फिनिशिंग।",
            "evidence_ta": "சுவரை தேய்த்தல், பிரைமர் பூசுதல் மற்றும் எமல்ஷன் வண்ணம் பூசுதல்.",
            "years_experience": years,
        })

    # 8. Carpentry & Woodwork
    if has_kw(text_lower, ['carpent', 'carpenter', 'carpentry', 'wood', 'wooden', 'furniture', 'door', 'window', 'plywood', 'polishing', 'saw', 'timber', 'badhai', 'தச்சர்', 'மர வேலை', 'बढ़ई', 'लकड़ी']):
        detected_skills.append({
            "name": "Carpentry & Custom Furniture Making",
            "name_hi": "बढ़ईगीरी व कस्टम फर्नीचर निर्माण",
            "name_ta": "தச்சவேலை மற்றும் மரப் மரச்சாமான்கள் தயாரிப்பு",
            "category": "Carpentry & Woodwork",
            "confidence": 0.94,
            "confidence_level": "high",
            "evidence": "Constructing wooden doors, windows, tables, cabinets, and plywood structures.",
            "evidence_hi": "लकड़ी के दरवाजे, खिड़कियां, मेज, अलमारी और प्लाईवुड संरचनाओं का निर्माण।",
            "evidence_ta": "மர கதவுகள், ஜன்னல்கள், மேஜைகள் மற்றும் அலமாரிகளை உருவாக்குதல்.",
            "years_experience": years,
        })

    # 9. Mechanical & Automotive Repair
    if has_kw(text_lower, ['mechanic', 'mechanical', 'engine', 'bike', 'scooter', 'motorcycle', 'car', 'auto', 'vehicle', 'servicing', 'puncture', 'brake', 'garage', 'ev', 'electric vehicle', 'मेकेनिक', 'गाड़ी', 'பழுது நீக்கம்', 'மெக்கானிக்']):
        detected_skills.append({
            "name": "Automotive Engine & Mechanical Repair",
            "name_hi": "ऑटोमोटिव इंजन व यांत्रिक मरम्मत",
            "name_ta": "வாகன என்ஜின் மற்றும் இயந்திர பழுது நீக்கம்",
            "category": "Mechanical & Automotive",
            "confidence": 0.95,
            "confidence_level": "high",
            "evidence": "Overhauling 2-wheeler/4-wheeler engines, clutch adjustment, and mechanical diagnostics.",
            "evidence_hi": "दोपहिया/चार पहिया वाहनों के इंजन की ओवरहालिंग और क्लच समायोजन।",
            "evidence_ta": "இருசக்கர மற்றும் நான்கு சக்கர வாகன என்ஜின் பழுதுபார்த்தல்.",
            "years_experience": years,
        })
        detected_skills.append({
            "name": "Vehicle Maintenance & Troubleshooting",
            "name_hi": "वाहन रखरखाव व दोष निवारण",
            "name_ta": "வாகன பராமரிப்பு மற்றும் சரிசெய்தல்",
            "category": "Mechanical & Automotive",
            "confidence": 0.90,
            "confidence_level": "high",
            "evidence": "General vehicle servicing, brake pad replacements, oil changes, and puncture repair.",
            "evidence_hi": "सामान्य वाहन सर्विसिंग, ब्रेक पैड बदलना और ऑयल बदलना।",
            "evidence_ta": "வாகன பொது சர்வீஸ், பிரேக் மாற்றுதல் மற்றும் எண்ணெய் மாற்றுதல்.",
            "years_experience": years,
        })

    # 10. Electronics, Mobile & Computer Servicing
    if has_kw(text_lower, ['mobile repair', 'phone repair', 'smartphone', 'display replacement', 'soldering', 'circuit board', 'charging jack', 'laptop repair', 'computer repair', 'hard drive', 'motherboard', 'मोबाइल रिपेयर', 'फोन', 'மொபைல் பழுது']):
        detected_skills.append({
            "name": "Mobile & Electronics Hardware Servicing",
            "name_hi": "मोबाइल व इलेक्ट्रॉनिक्स हार्डवेयर सर्विसिंग",
            "name_ta": "மொபைல் மற்றும் மின்னணு ஹார்டுவேர் பழுது நீக்கம்",
            "category": "Electrical & Electronics",
            "confidence": 0.94,
            "confidence_level": "high",
            "evidence": "Replacing touch screens, battery units, charging jacks, and micro-soldering.",
            "evidence_hi": "टच स्क्रीन, बैटरी यूनिट, चार्जिंग जैक और मोबाइल डिस्प्ले बदलना।",
            "evidence_ta": "மொபைல் தொடுதிரை, பேட்டரி மற்றும் சார்ஜிங் சாக்கெட் மாற்றுதல்.",
            "years_experience": years,
        })

    # 11. Welding & Fabrication
    if has_kw(text_lower, ['weld', 'welder', 'welding', 'grill', 'iron', 'steel', 'gate', 'fabrication', 'arc welding', 'cnc', 'lathe', 'वेल्डिंग', 'वेल्डर', 'लोहा', 'வெல்டிங்']):
        detected_skills.append({
            "name": "Arc Welding & Metal Fabrication",
            "name_hi": "आर्क वेल्डिंग व धातु फैब्रिकेशन",
            "name_ta": "மெட்டல் ஃபேப்ரிகேஷன் & வெல்டிங்",
            "category": "Metalwork & Manufacturing",
            "confidence": 0.94,
            "confidence_level": "high",
            "evidence": "Arc welding, metal joints fabrication, safety grills, and iron gate structures.",
            "evidence_hi": "आर्क वेल्डिंग, लोहे के गेट, ग्रिल और धातु संरचनाओं का निर्माण।",
            "evidence_ta": "வெல்டிங், இரும்பு கேட் மற்றும் கிரில் சாதனங்களை தயாரித்தல்.",
            "years_experience": years,
        })

    # 12. Construction, Masonry & Tiling
    if has_kw(text_lower, ['mason', 'masonry', 'brick', 'cement', 'wall', 'plaster', 'plastering', 'tile', 'flooring', 'rajmistri', 'கொத்தனார்', 'राजमिस्त्री']):
        detected_skills.append({
            "name": "Masonry & Civil Brickwork Construction",
            "name_hi": "राजमिस्त्री व ईंट निर्माण",
            "name_ta": "கொத்தனார் மற்றும் செங்கல் வேலை",
            "category": "Construction & Building",
            "confidence": 0.94,
            "confidence_level": "high",
            "evidence": "Laying bricks, cement plastering, foundation work, and tile fitting.",
            "evidence_hi": "ईंट बिछाने, सीमेंट प्लास्टर और टाइल फिटिंग का काम।",
            "evidence_ta": "செங்கல் கட்டுதல், சிமெண்ட் பூச்சு மற்றும் தரை கல் பொருத்துதல்.",
            "years_experience": years,
        })

    # 13. Agriculture, Organic Farming & Livestock
    if has_kw(text_lower, ['farm', 'farming', 'crop', 'agriculture', 'livestock', 'dairy', 'cattle', 'cow', 'buffalo', 'poultry', 'chicken', 'organic farming', 'nursery', 'pesticide', 'harvest', 'खेती', 'किसान', 'कृषि', 'பண்ணை', 'விவசாயம்']):
        detected_skills.append({
            "name": "Crop Management & Organic Agriculture",
            "name_hi": "फसल प्रबंधन व जैविक कृषि",
            "name_ta": "பயிர் மேலாண்மை & இயற்கை விவசாயம்",
            "category": "Agriculture & Farming",
            "confidence": 0.95,
            "confidence_level": "high",
            "evidence": "Crop cultivation, organic fertilizer application, pest control, and harvesting.",
            "evidence_hi": "फसल की खेती, जैविक उर्वरक का उपयोग, कीट नियंत्रण और कटाई।",
            "evidence_ta": "பயிர் சாகுபடி, இயற்கை உரம் பயன்பாடு மற்றும் அறுவடை மேலாண்மை.",
            "years_experience": years,
        })

    # 14. Retail Sales, Kirana Store & Micro-Business
    if has_kw(text_lower, ['retail', 'kirana', 'store', 'shop', 'billing', 'counter', 'inventory', 'cashier', 'dukaan', 'shopkeeper', 'दुकान', 'விற்பனை', 'கடை']):
        detected_skills.append({
            "name": "Retail Sales & Kirana Store Management",
            "name_hi": "खुदरा बिक्री व किराना स्टोर प्रबंधन",
            "name_ta": "சில்லறை விற்பனை & மளிகை கடை நிர்வாகம்",
            "category": "Business & Retail",
            "confidence": 0.94,
            "confidence_level": "high",
            "evidence": "Handling customer sales, inventory stock checking, supplier procurement, and POS billing.",
            "evidence_hi": "ग्राहक बिक्री, इन्वेंटरी स्टॉक जांच, आपूर्तिकर्ता खरीद और बिलिंग का संचालन।",
            "evidence_ta": "வாடிக்கையாளர் விற்பனை, சரக்கு மேலாண்மை மற்றும் பில்லிங் நிர்வாகம்.",
            "years_experience": years,
        })

    # 15. Software Development, Web & IT
    if has_kw(text_lower, ['software', 'developer', 'programming', 'coding', 'python', 'javascript', 'java', 'html', 'css', 'react', 'node', 'sql', 'web development', 'app development', 'computer', 'डेटाबेस', 'कोडिंग', 'மென்பொருள்']):
        detected_skills.append({
            "name": "Software Development & Programming",
            "name_hi": "सॉफ्टवेयर विकास और प्रोग्रामिंग",
            "name_ta": "மென்பொருள் உருவாக்கம் மற்றும் நிரலாக்கம்",
            "category": "Information Technology",
            "confidence": 0.96,
            "confidence_level": "high",
            "evidence": "Software development, coding, web or mobile app programming, database management, and system maintenance.",
            "evidence_hi": "सॉफ्टवेयर विकास, कोडिंग, वेब या मोबाइल ऐप प्रोग्रामिंग, डेटाबेस प्रबंधन और सिस्टम रखरखाव।",
            "evidence_ta": "மென்பொருள் உருவாக்கம், நிரலாக்கம், வலை அல்லது பயன்பாட்டு நிரலாக்கம் மற்றும் கணினி பராமரிப்பு.",
            "years_experience": years,
        })

    if not detected_skills:
        detected_skills.append({
            "name": raw_text.strip().title() or "Practical Vocational Trade",
            "name_hi": "व्यवहारिक व्यावसायिक कौशल",
            "name_ta": "நடைமுறை தொழில்சார் திறன்",
            "category": "Vocational & Trade Skills",
            "confidence": 0.75,
            "confidence_level": "medium",
            "evidence": f"Demonstrated capability in {raw_text}",
            "evidence_hi": f"{raw_text} में प्रदर्शित क्षमता",
            "evidence_ta": f"{raw_text} இல் நிரூபிக்கப்பட்ட திறன்",
            "years_experience": years,
        })

    summary_map = {
        "en": f"Extracted {len(detected_skills)} key skill(s) based on your response.",
        "hi": f"आपके उत्तर के आधार पर {len(detected_skills)} प्रमुख कौशल पहचाने गए।",
        "ta": f"உங்கள் பதிலின் அடிப்படையில் {len(detected_skills)} முக்கிய திறன்கள் கண்டறியப்பட்டன."
    }

    return {
        "summary": summary_map.get(language, summary_map["en"]),
        "skills": detected_skills
    }


def generate_verification_scenario(skill_name: str, language: str = "en") -> Dict[str, Any]:
    """Generate a real-world verification scenario strictly relevant to the specific skill."""
    if not settings.is_demo_mode and _openai_client:
        lang_instruction = _get_language_instruction(language)
        nonce = int(time.time() * 1000) % 100000
        system_prompt = f"""You are an expert vocational skill evaluator for AnubhavAI.
Generate a NEW, UNIQUE, highly specific workplace challenge scenario strictly relevant to the skill: "{skill_name}".
(Generation seed / nonce: {nonce})
{lang_instruction}

CRITICAL MANDATORY RULES:
1. RELEVANCE: The scenario and question MUST directly test practical knowledge, troubleshooting, or execution of "{skill_name}".
2. NO GENERIC CUSTOMER SERVICE/REFUND: Do NOT generate generic customer service or refund scenarios UNLESS "{skill_name}" itself is Customer Service or Retail Store Management.
3. DIVERSITY & UNIQUENESS: Make sure the scenario is completely different from generic questions and tests real-world trade competence. Use generation seed ({nonce}) to pick a unique angle (e.g. equipment malfunction, material defect, environmental constraint, client spec modification, quality control failure, emergency troubleshooting).
4. RETURN JSON strictly in this structure:
{{
  "scenario": "Detailed workplace scenario in English...",
  "question": "Practical technical question to solve the scenario...",
  "scenario_hi": "Hindi scenario in Devanagari script ONLY...",
  "question_hi": "Hindi question in Devanagari script ONLY...",
  "scenario_ta": "Tamil scenario in Tamil script ONLY...",
  "question_ta": "Tamil question in Tamil script ONLY..."
}}"""

        result = _call_llm(system_prompt, f"Generate unique verification scenario for skill: '{skill_name}', Language: '{language}', Seed: {nonce}", json_mode=True, temperature=0.8)
        if result:
            try:
                parsed = json.loads(result)
                if parsed.get("scenario") and parsed.get("question"):
                    return parsed
            except Exception:
                pass

    return _dynamic_verification_scenario(skill_name, language)


def _dynamic_verification_scenario(skill_name: str, language: str) -> Dict[str, Any]:
    """Generate domain-accurate verification scenarios for any skill name with dynamic randomization."""
    sn_lower = (skill_name or "").lower().strip()
    pools = []

    # 1. Painting & Surface Coating
    if any(k in sn_lower for k in ['paint', 'painting', 'surface coating', 'distemper', 'emulsion', 'primer', 'wall painting']):
        pools = [
            {
                "sc": {
                    "en": "While painting an exterior wall, moisture seepage causes the freshly applied paint coat to bubble, blister, and peel off.",
                    "hi": "एक बाहरी दीवार पर पेंट करते समय, सीलन के कारण नया लगाया गया पेंट का कोट फफोलेदार होकर उखड़ने लगता है।",
                    "ta": "வெளிப்புற சுவரில் வண்ணம் பூசும் போது, ஈரப்பதம் காரணமாக புதிய பூச்சு கொப்புளமாகி உரியத் தொடங்குகிறது."
                },
                "q": {
                    "en": "How will you inspect wall moisture levels, select waterproof primer sealant, and prepare the surface before repainting?",
                    "hi": "दीवार की नमी का स्तर जांचने, वाटरप्रूफ प्राइमर का चयन करने और पुनः पेंटिंग के लिए दीवार तैयार करने के क्या कदम उठाएंगे?",
                    "ta": "ஈரப்பதத்தை பரிசோதித்து, நீர்ப்புகா பிரைமர் பூசி சுவரை மீண்டும் வண்ணம் பூச என்ன செய்வீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "While applying interior emulsion under bright LED lighting, dark overlap roller marks and uneven sheen appear across the living room wall.",
                    "hi": "तेज एलईडी लाइट में इंटीरियर इमल्शन लगाते समय, दीवार पर रोलर के निशान और असमान चमक दिखाई देती है।",
                    "ta": "ஒளிரும் விளக்கில் சுவரில் வண்ணம் பூசும் போது, உருளை மதிப்பெண்கள் மற்றும் சீரற்ற பளபளப்பு தெரிகிறது."
                },
                "q": {
                    "en": "How will you adjust wet-edge rolling techniques, thinning ratio, and sanding between coats to achieve a seamless finish?",
                    "hi": "एकसमान फिनिश पाने के लिए आप रोलर चलाने की तकनीक, पेंट पतला करने के अनुपात और सैंडिंग में क्या सुधार करेंगे?",
                    "ta": "சீரான தோற்றத்தைப் பெற வண்ணம் மெலிதாக்கும் அளவு மற்றும் ரோலர் பூச்சு முறையை எவ்வாறு பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "During spray painting of metal window grills, excessive overspray drips occur and paint refuses to adhere evenly to curved joints.",
                    "hi": "धातु की खिड़की की ग्रिल पर स्प्रे पेंटिंग करते समय अत्यधिक पेंट टपकता है और जोड़ों पर समान रूप से नहीं चिपकता है।",
                    "ta": "உலோக ஜன்னல் கிரில்களுக்கு ஸ்ப்ரே பெயிண்ட் செய்யும்போது பெயிண்ட் வழிகிறது மற்றும் மூட்டுகளில் சரியாக ஒட்டுவதில்லை."
                },
                "q": {
                    "en": "How will you adjust spray gun pressure, distance, and surface etching primer to fix adhesion and drip issues?",
                    "hi": "पेंट के टपकने और चिपकने की समस्या को ठीक करने के लिए आप स्प्रे गन के दबाव और प्राइमर में क्या बदलाव करेंगे?",
                    "ta": "ஸ்ப்ரே அழுத்தத்தையும் பிரைமரை அமைக்கும் முறையையும் எவ்வாறு மாற்றுவீர்கள்?"
                }
            }
        ]

    # 2. Baking & Confectionery
    elif any(k in sn_lower for k in ['bake', 'baking', 'cake', 'pastry', 'oven', 'confectionery']):
        pools = [
            {
                "sc": {
                    "en": "A customer orders a custom two-tier wedding cake with cream icing on a hot afternoon, but the lower layer starts softening during transit.",
                    "hi": "एक ग्राहक गर्म दोपहर में क्रीम आइसिंग के साथ दो मंजिला शादी के केक का ऑर्डर देता है, लेकिन रास्ते में निचली परत नरम होने लगती है।",
                    "ta": "ஒரு வாடிக்கையாளர் வெயில் நேரத்தில் இரண்டு அடுக்கு கேக் ஆர்டர் செய்கிறார், ஆனால் கொண்டு செல்லும் போது கீழ் அடுக்கு தளரத் தொடங்குகிறது."
                },
                "q": {
                    "en": "How will you adjust the cake structure, dowel support, cooling, and icing temperature to fix it?",
                    "hi": "इसे ठीक करने के लिए आप केक की संरचना, सपोर्ट और तापमान नियंत्रण में क्या सुधार करेंगे?",
                    "ta": "இதை சரிசெய்ய கேக்கின் கட்டமைப்பு மற்றும் வெப்பநிலையை எப்படி நிர்வகிப்பீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "While baking chocolate sponge cakes for a party order, the cake center sinks completely after taking it out of the oven.",
                    "hi": "पार्टी ऑर्डर के लिए चॉकलेट स्पंज केक बनाते समय, ओवन से बाहर निकालने के बाद केक का मध्य भाग पूरी तरह से बैठ जाता है।",
                    "ta": "பார்ட்டி ஆர்டருக்காக சாக்லேட் கேக் சுடும் போது, அவனிலிருந்து எடுத்த பிறகு கேக்கின் நடுப்பகுதி அமிழ்ந்து விடுகிறது."
                },
                "q": {
                    "en": "What oven temperature, baking powder measurement, and batter mixing technique corrections will you apply?",
                    "hi": "आप ओवन के तापमान, बेकिंग पाउडर के नाप और बैटर मिक्सिंग तकनीक में क्या सुधार करेंगे?",
                    "ta": "அவன் வெப்பநிலை, பேக் பவுடர் அளவு மற்றும் மாவு கலவை நுட்பத்தில் என்ன மாற்றங்களைச் செய்வீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "While decorating a cake in high humidity, the fondant sugar paste becomes sticky, sweating, and starts tearing.",
                    "hi": "अत्यधिक नमी वाले मौसम में केक सजाते समय, फोंडेंट शुगर पेस्ट चिपचिपा हो जाता है और फटने लगता है।",
                    "ta": "அதிக ஈரப்பதம் கொண்ட வானிலையில் கேக் அலங்கரிக்கும் போது, சர்க்கரை பாகு பிசுபிசுப்பாகி கிழியத் தொடங்குகிறது."
                },
                "q": {
                    "en": "How will you handle cornstarch dusting, air conditioning dehumidification, and fondant kneading to repair the surface?",
                    "hi": "सतह को ठीक करने के लिए आप कॉर्नस्टार्च का उपयोग, नमी नियंत्रण और फोंडेंट गूंधने की क्या विधि अपनाएंगे?",
                    "ta": "கேக் மேற்பரப்பை சரிசெய்ய சோளமாவு பயன்பாடு மற்றும் ஈரப்பதம் கட்டுப்பாட்டை எவ்வாறு பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "Your batch of French macarons comes out flat without characteristic feet and the top shells crack during baking.",
                    "hi": "फ्रेंच मैकारॉन का आपका बैच बिना उभरे बेस के चपटा निकलता है और ऊपर का खोल बेकिंग के दौरान फट जाता है।",
                    "ta": "பிரெஞ்சு மக்காரான்கள் சரியாக எழும்பாமல் மேற்பரப்பு வெடித்து விடுகிறது."
                },
                "q": {
                    "en": "How will you adjust batter macaronage folding, skin resting duration, and oven convection airflow?",
                    "hi": "मैकारॉन को सही आकार और फिनिश देने के लिए बैटर फोल्डिंग, रेस्टिंग टाइम और ओवन एयरफ्लो में क्या बदलाव करेंगे?",
                    "ta": "மாவு கலக்கும் முறை மற்றும் அவன் காற்றோட்டத்தை எவ்வாறு சரிசெய்வீர்கள்?"
                }
            }
        ]

    # 3. Tailoring, Garment Stitching & Embroidery
    elif any(k in sn_lower for k in ['tailor', 'stitching', 'fabric', 'garment', 'apparel', 'sew', 'cutting', 'embroidery', 'blouse', 'aari']):
        pools = [
            {
                "sc": {
                    "en": "A customer brings expensive silk cloth for a wedding blouse, but requests a neck pattern requiring 20cm more fabric than provided.",
                    "hi": "एक ग्राहक शादी के ब्लाउज के लिए महंगा रेशमी कपड़ा लाता है, लेकिन ऐसे नेक पैटर्न का अनुरोध करता है जिसके लिए 20 सेमी अधिक कपड़े की आवश्यकता होती है।",
                    "ta": "ஒரு வாடிக்கையாளர் திருமண பிளவுஸுக்கு விலையுயர்ந்த பட்டுத் துணியைக் கொண்டு வருகிறார், ஆனால் வழங்கப்பட்டதை விட 20 செ.மீ கூடுதல் துணி தேவைப்படும் கழுத்து அமைப்பைக் கேட்கிறார்."
                },
                "q": {
                    "en": "How will you adjust the cutting pattern or design to satisfy the customer without damaging the cloth?",
                    "hi": "कपड़े को नुकसान पहुँचाए बिना ग्राहक को संतुष्ट करने के लिए आप क्या करेंगे?",
                    "ta": "துணியை சேதப்படுத்தாமல் வாடிக்கையாளரை திருப்திப்படுத்த என்ன செய்வீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A cotton kurti shrinks unevenly after its first trial wash, causing tightness under the armhole and shoulder mismatch.",
                    "hi": "ट्रायल वॉश के बाद एक सूती कुर्ती असमान रूप से सिकुड़ जाती है, जिससे आर्महोल के नीचे जकड़न और कंधे का तालमेल बिगड़ जाता है।",
                    "ta": "முதல் துவைப்பிற்குப் பிறகு காட்டன் குர்தி சீரற்ற முறையில் சுருங்கி, அக்குள் மற்றும் தோள்பட்டையில் இறுக்கத்தை ஏற்படுத்துகிறது."
                },
                "q": {
                    "en": "How will you use seam allowance adjustments, fabric pre-shrinking techniques, and shoulder realignment to restore fit?",
                    "hi": "फिटिंग सही करने के लिए आप सिलाई मार्जिन समायोजन, कपड़े को पहले से भिगोने की तकनीक और कंधे के संरेखण का उपयोग कैसे करेंगे?",
                    "ta": "பொருத்தத்தை மீட்டெடுக்க தையல் விளிம்பு மாற்றங்கள் மற்றும் தோள்பட்டை சீரமைப்பை எவ்வாறு பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "While working on heavy bridal silk fabric, the Zari thread breaks continuously on the Aari embroidery frame.",
                    "hi": "भारी दुल्हन रेशमी कपड़े पर काम करते समय, आरी कड़ाई फ्रेम पर ज़री का धागा बार-बार टूटता है।",
                    "ta": "பட்டாடையில் ஆரி தையல் வேலை செய்யும் போது ஜரிகை நூல் அடிக்கடி அறுந்து விடுகிறது."
                },
                "q": {
                    "en": "How will you adjust needle size gauge, thread tensioning, and fabric frame tension to prevent thread snapping?",
                    "hi": "धागे के टूटने को रोकने के लिए आप सुई के आकार, धागे के तनाव और कपड़े के फ्रेम के खिंचाव को कैसे समायोजित करेंगे?",
                    "ta": "நூல் அறுபடுவதைக் தடுக்க ஊசி அளவு மற்றும் பிரேம் இறுக்கத்தை எவ்வாறு சரிசெய்வீர்கள்?"
                }
            }
        ]

    # 4. Cooking, Culinary & Catering
    elif any(k in sn_lower for k in ['cook', 'cooking', 'chef', 'culinary', 'catering', 'food', 'tiffin', 'kitchen']):
        pools = [
            {
                "sc": {
                    "en": "You are catering an event for 80 guests, and the host requests 20 extra vegetarian meals with only 45 minutes remaining.",
                    "hi": "आप 80 मेहमानों के लिए भोजन की व्यवस्था कर रहे हैं, और आयोजक केवल 45 मिनट शेष रहते हुए 20 अतिरिक्त शाकाहारी भोजन का अनुरोध करता है।",
                    "ta": "80 விருந்தினர்களுக்கான உணவளிப்பில், நிகழ்ச்சி தொடங்குவதற்கு 45 நிமிடங்களுக்கு முன் கூடுதலாக 20 சைவ உணவுகள் கேட்கப்படுகின்றன."
                },
                "q": {
                    "en": "How will you prioritize kitchen prep, ingredient repurposing, and quality control under time pressure?",
                    "hi": "समय के दबाव में आप रसोई की तैयारी, सामग्री के उपयोग और गुणवत्ता नियंत्रण को कैसे प्राथमिकता देंगे?",
                    "ta": "நேர நெருக்கடியில் சமையல் தயாரிப்பு மற்றும் தரக் கட்டுப்பாட்டை எவ்வாறு நிர்வகிப்பீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A large pot of biryani gravy prepared for a wedding lunch tastes excessively salty 30 minutes before serving.",
                    "hi": "शादी के दोपहर के भोजन के लिए तैयार की गई बिरयानी ग्रेवी परोसने से 30 मिनट पहले बहुत अधिक नमकीन लगती है।",
                    "ta": "திருமண உணவிற்காக தயாரிக்கப்பட்ட பிரியாணி கிரேவியில் பரிமாறுவதற்கு 30 நிமிடங்களுக்கு முன் அதிக உப்பு உறைக்கிறது."
                },
                "q": {
                    "en": "What kitchen remedies like raw potato starch absorption, dairy cream addition, or volume expansion will you use to balance taste?",
                    "hi": "स्वाद को संतुलित करने के लिए आप कच्चे आलू, मलाई या मात्रा बढ़ाने जैसे कौन से उपाय करेंगे?",
                    "ta": "சுவையைச் சீராக்க உருளைக்கிழங்கு, பால் ஏடு அல்லது அளவு அதிகரிப்பு போன்ற என்ன உத்திகளைப் பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "You need to package and deliver 150 hot tiffin lunch boxes for corporate delivery while keeping rice fluffy and rotis soft without sogginess over 3 hours.",
                    "hi": "आपको 3 घंटे के सफर के लिए 150 टिफिन बॉक्स पैक करने हैं ताकि चावल खिले रहें और रोटियां नरम रहें और नमी से गीली न हों।",
                    "ta": "3 மணிநேர பயணத்திற்கு 150 டிபன் பாக்ஸ்களை உணவுகள் குலையாமல் சூடாக பேக் செய்ய வேண்டும்."
                },
                "q": {
                    "en": "What thermal steam venting, foil wrapping, and layering techniques will you apply during packing?",
                    "hi": "भोजन को गीला होने से बचाने और गर्म रखने के लिए आप पैकेजिंग और स्टीम वेंटिंग की क्या तकनीक अपनाएंगे?",
                    "ta": "உணவு வீணாகாமல் சூடாகவும் புத்துணர்ச்சியுடனும் இருக்க என்ன பேக்கிங் நுட்பங்களைப் பயன்படுத்துவீர்கள்?"
                }
            }
        ]

    # 5. Makeup Artistry, Beauty Parlour & Cosmetology
    elif any(k in sn_lower for k in ['makeup', 'beautician', 'parlour', 'skin', 'facial', 'hair', 'cosmetology']):
        pools = [
            {
                "sc": {
                    "en": "A bride has sensitive skin prone to sudden redness and expresses anxiety 2 hours before the bridal photoshoots.",
                    "hi": "दुल्हन की संवेदनशील त्वचा है जिस पर अचानक लालिमा आ जाती है, और वह ब्राइडल फोटोशूट से 2 घंटे पहले चिंतित है।",
                    "ta": "மணப்பெண்ணுக்கு உணர்திறன் வாய்ந்த சருமம் உள்ளது, புகைப்படப்பிடிப்புக்கு 2 மணி நேரத்திற்கு முன் சிவத்தல் ஏற்படுகிறது."
                },
                "q": {
                    "en": "What skin preparation, patch testing, primer selection, and calm customer communication steps will you take?",
                    "hi": "आप कौन सी स्किन प्रेप, प्राइमर चयन और ग्राहक संचार कदम उठाएंगे?",
                    "ta": "சரும ஆயத்தம் மற்றும் அழகு ஒப்பனையை பாதுகாப்பாக செய்ய என்ன செய்வீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A client with oily skin notices their full-coverage foundation oxidizes and turns two shades darker after 1 hour under photo lights.",
                    "hi": "तैलीय त्वचा वाले क्लाइंट का मेकअप 1 घंटे बाद ऑक्सिडाइज होकर गहरा हो जाता है।",
                    "ta": "எண்ணெய் சருமம் கொண்ட வாடிக்கையாளரின் மேக்கப் 1 மணி நேரத்திற்குப் பிறகு நிறம் மாறுகிறது."
                },
                "q": {
                    "en": "How will you use oil-free Mattifying primers, translucent setting powders, and pH balancing skin prep to prevent oxidation?",
                    "hi": "रंग बदलने से रोकने के लिए आप ऑयल-फ्री प्राइमर, पाउडर और स्किन प्रेप का उपयोग कैसे करेंगे?",
                    "ta": "நிற மாற்றத்தைத் தடுக்க எண்ணெய் அற்ற பிரைமர் மற்றும் பவுடரை எவ்வாறு பயன்படுத்துவீர்கள்?"
                }
            }
        ]

    # 6. Electrical Wiring & Appliance Repair
    elif any(k in sn_lower for k in ['electric', 'wiring', 'fuse', 'circuit', 'appliance', 'motor']):
        pools = [
            {
                "sc": {
                    "en": "A domestic customer reports that their main circuit breaker trips continuously whenever heavy appliances like geysers turn on.",
                    "hi": "एक घरेलू ग्राहक रिपोर्ट करता है कि जब भी गीजर जैसे भारी उपकरण चालू होते हैं, तो उनका मुख्य सर्किट ब्रेकर लगातार ट्रिप होता है।",
                    "ta": "கீசர் போன்ற அதிக மின்சாரம் பயன்படும் சாதனங்களை இயக்கும் போது பிரதான சர்க்யூட் பிரேக்கர் அடிக்கடி துண்டிக்கப்படுகிறது."
                },
                "q": {
                    "en": "How will you use a multimeter and insulation tester to isolate neutral-earth leaks and rebalance circuit phases?",
                    "hi": "न्यूट्रल-अर्थ लीक की जांच करने और सर्किट फेज को रीबैलेंस करने के लिए आप मल्टीमीटर और इंसुलेशन टेस्टर का उपयोग कैसे करेंगे?",
                    "ta": "மின் கசிவை கண்டறிய மல்டிமீட்டர் மற்றும் இன்சுலேஷன் பரிசோதனையை எவ்வாறு பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A commercial ceiling fan hums loudly and runs at half speed despite the regulator set to maximum speed.",
                    "hi": "रेगुलेटर को अधिकतम गति पर सेट करने के बावजूद एक वाणिज्यिक सीलिंग फैन जोर से भिनभिनाता है और आधी गति से चलता है।",
                    "ta": "ரெகுலேட்டர் அதிகபட்ச வேகத்தில் இருந்தாலும் மின் விசிறி மெதுவாக ஓடி சத்தம் எழுப்புகிறது."
                },
                "q": {
                    "en": "How will you test capacitor microfarad ratings, check motor winding resistance, and replace faulty start capacitors?",
                    "hi": "आप कैपेसिटर की रेटिंग जांचने, मोटर वाइंडिंग रेजिस्टेंस मापने और कैपेसिटर बदलने के क्या कदम उठाएंगे?",
                    "ta": "கேபாசிட்டர் அளவு மற்றும் மோட்டார் காயில் எதிர்ப்பை பரிசோதித்து பழுதுபார்ப்பது எப்படி?"
                }
            },
            {
                "sc": {
                    "en": "A single-phase residential building experiences sudden voltage drops to 140V during peak evening hours.",
                    "hi": "शाम के समय एक आवासीय भवन में अचानक वोल्टेज गिरकर 140V हो जाता है।",
                    "ta": "மாலை நேரத்தில் வீட்டில் மின் அழுத்தம் 140V ஆகக் குறைகிறது."
                },
                "q": {
                    "en": "How will you inspect the main service cable, check neutral connection tightness, and measure earthing resistance?",
                    "hi": "वोल्टेज ड्रॉप को ठीक करने के लिए आप मेन केबल, न्यूट्रल कनेक्शन और अर्थिंग रेजिस्टेंस की जांच कैसे करेंगे?",
                    "ta": "மின் கம்பிகள், நியூட்ரல் இணைப்பு மற்றும் எர்த் எதிர்ப்பை எவ்வாறு சரிபார்ப்பீர்கள்?"
                }
            }
        ]

    # 7. Plumbing & Pipefitting
    elif any(k in sn_lower for k in ['plumb', 'plumbing', 'pipe', 'leak', 'drain', 'faucet', 'valve', 'sanitary']):
        pools = [
            {
                "sc": {
                    "en": "The second-floor bathroom experiences extremely low water pressure despite the rooftop overhead tank being completely full.",
                    "hi": "छत पर ओवरहेड टैंक पूरी तरह भरा होने के बावजूद दूसरी मंजिल के बाथरूम में पानी का दबाव बहुत कम है।",
                    "ta": "மேல்நிலைத் தொட்டி முழுமையாக இருந்தும் இரண்டாவது தளக் கழிப்பறையில் நீர் அழுத்தம் மிகவும் குறைவாக உள்ளது."
                },
                "q": {
                    "en": "How will you check for air locks in supply lines, clear mineral scale accumulation, and inspect pressure release valves?",
                    "hi": "एयर लॉक हटाने, पाइप में खनिज जमाव साफ करने और प्रेशर वाल्व की जांच करने के क्या कदम उठाएंगे?",
                    "ta": "குழாய் அடைப்பு மற்றும் காற்று அடைப்பை நீக்கி நீர் அழுத்தத்தை சீராக்குவது எப்படி?"
                }
            },
            {
                "sc": {
                    "en": "A concealed PVC pipe inside a tiled bathroom wall develops a pinhole leak, dampening the adjoining bedroom wall.",
                    "hi": "बाथरूम की टाइल वाली दीवार के अंदर छिपी पीवीसी पाइप में रिसाव हो जाता है, जिससे बगल वाले कमरे की दीवार में सीलन आ जाती है।",
                    "ta": "சுவருக்குள் இருக்கும் பைப் கசிந்து பக்கத்து அறையின் சுவரில் ஈரம் படர்கிறது."
                },
                "q": {
                    "en": "How will you pinpoint leak coordinates, open minimal tile area, cut and join a coupler sleeve securely?",
                    "hi": "कम से कम टाइल तोड़े बिना रिसाव का सही स्थान ढूंढने और कपलर की मदद से पाइप की मरम्मत करने का तरीका बताएं?",
                    "ta": "கசிவை துல்லியமாக கண்டுபிடித்து குறைந்த சேதத்துடன் பைப்பை எவ்வாறு பழுதுபார்ப்பீர்கள்?"
                }
            }
        ]

    # 8. HVAC & Refrigeration Repair
    elif any(k in sn_lower for k in ['hvac', 'refrigeration', 'ac repair', 'air conditioner', 'fridge', 'compressor', 'chiller']):
        pools = [
            {
                "sc": {
                    "en": "A 1.5-ton split AC outdoor compressor unit runs continuously, but the indoor unit blows room temperature air with no cooling.",
                    "hi": "एक 1.5-टन स्प्लिट एसी का आउटडोर कंप्रेसर लगातार चलता है, लेकिन इनडोर यूनिट बिना कूलिंग के सामान्य हवा फेंकती है।",
                    "ta": "1.5 டன் ஏசியின் அவுட்டோர் கம்ப்ரஸர் ஓடுகிறது, ஆனால் இன்டோர் யூனிட்டில் குளிர்ச்சி வரவில்லை."
                },
                "q": {
                    "en": "How will you test suction and discharge refrigerant pressures, check for micro-leaks, and inspect run capacitors?",
                    "hi": "कूलिंग गैस दबाव की जांच, गैस लीक ढूंढने और कैपेसिटर की जांच के क्या कदम उठाएंगे?",
                    "ta": "கேஸ் அழுத்தம் மற்றும் கசிவை பரிசோதித்து குளிரூட்டும் முறையை எவ்வாறு சீரமைப்பீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "Thick frost and ice build up across the evaporator coils of a commercial display refrigerator, blocking airflow completely.",
                    "hi": "एक कमर्शियल रेफ्रिजरेटर के इवेपोरेटर कॉइल्स पर बर्फ की मोटी परत जम जाती है, जिससे हवा का प्रवाह रुक जाता है।",
                    "ta": "வணிகப் பயன்பாட்டு ஃபிரிட்ஜின் கூலிங் காயிலில் அதிக பனிப்பாறை படிந்து காற்று ஓட்டம் தடைபடுகிறது."
                },
                "q": {
                    "en": "How will you test defrost heater continuity, check defrost timer relays, and inspect door gasket airtight seals?",
                    "hi": "डिफ्रॉस्ट हीटर, टाइमर रिले और दरवाजे की गैसकेट सील की जांच करके बर्फ जमने की समस्या कैसे सुलझाएंगे?",
                    "ta": "டிஃப்ராஸ்ட் ஹீட்டர் மற்றும் கதவு கேஸ்கட் சீலை எவ்வாறு பரிசோதிப்பீர்கள்?"
                }
            }
        ]

    # 9. Carpentry & Woodworking
    elif any(k in sn_lower for k in ['carpenter', 'carpentry', 'wood', 'furniture', 'cabinet', 'plywood', 'timber']):
        pools = [
            {
                "sc": {
                    "en": "A heavy solid teak wood main door panel warps slightly during humid monsoon weather, sticking tightly against the wooden frame.",
                    "hi": "बारिश के मौसम में नमी के कारण सागौन की लकड़ी का मुख्य दरवाजा थोड़ा मुड़ जाता है और चौखट में फंसने लगता है।",
                    "ta": "மழைக்கால ஈரப்பதத்தால் தேக்கு மர கதவு சிறிது வளைந்து மரச் சட்டத்தில் சிக்கிக் கொள்கிறது."
                },
                "q": {
                    "en": "How will you plane precise high spots, adjust hinge clearances, and seal edge grains with waterproof varnish?",
                    "hi": "दरवाजे की रंदा घिसाई, कब्जे समायोजन और वाटरप्रूफ वार्निश से सील करने के क्या कदम उठाएंगे?",
                    "ta": "மரத்தை ரந்தா பிடித்து, திருகு மரையாணியை சீரமைத்து நீர்ப்புகா வார்னிஷ் பூசுவது எப்படி?"
                }
            },
            {
                "sc": {
                    "en": "Custom modular kitchen drawer telescopic runners bind midway and fail to close flush with the cabinet fascia.",
                    "hi": "मॉड्यूलर किचन की दराज के टेलीस्कोपिक चैनल बीच में अटक जाते हैं और कैबिनेट के साथ ठीक से बंद नहीं होते हैं।",
                    "ta": "சமையலறை டிராயர் சேனல் பாதியில் சிக்கி சரியாக மூட மறுக்கிறது."
                },
                "q": {
                    "en": "How will you verify cabinet squareness, adjust soft-close runner mounting screws, and correct drawer box alignment?",
                    "hi": "कैबिनेट का समकोण मापने, चैनल स्क्रू समायोजित करने और दराज के संरेखण को ठीक करने का तरीका बताएं?",
                    "ta": "டிராயர் சேனல் திருகுகளை சரிசெய்து சாய்வை எவ்வாறு சீரமைப்பீர்கள்?"
                }
            }
        ]

    # 10. Welding & Metal Fabrication
    elif any(k in sn_lower for k in ['weld', 'welder', 'welding', 'fabrication', 'metalwork', 'mig', 'tig', 'arc welding']):
        pools = [
            {
                "sc": {
                    "en": "During TIG welding of a stainless steel pipe joint, severe porosity pinholes and dark oxidation appear along the weld bead.",
                    "hi": "स्टेनलेस स्टील पाइप के जोड़ पर टीआईजी वेल्डिंग करते समय वेल्ड बीड पर छिद्र और गहरा ऑक्सीकरण दिखाई देता है।",
                    "ta": "ஸ்டெயின்லெஸ் ஸ்டீல் பைப்பில் TIG வெல்டிங் செய்யும் போது வெல்டிங் மூட்டில் துளைகள் மற்றும் நிறமாற்றம் ஏற்படுகிறது."
                },
                "q": {
                    "en": "How will you adjust Argon shielding gas flow rate, clean tungsten electrodes, and degrease metal joint surfaces?",
                    "hi": "ऑर्गन गैस फ्लो, टंगस्टन इलेक्ट्रोड की सफाई और मेटल जॉइंट की ग्रीस हटाने के क्या कदम उठाएंगे?",
                    "ta": "ஆர்கான் கேஸ் அளவு மற்றும் டங்ஸ்டன் ஊசியை எவ்வாறு சீரமைப்பீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A heavy structural I-beam warps out of linear alignment due to thermal expansion after continuous arc welding passes.",
                    "hi": "लगातार आर्क वेल्डिंग करने पर गर्मी के कारण भारी आई-बीम मुड़कर टेढ़ा हो जाता है।",
                    "ta": "தொடர்ச்சியான ஆர்க் வெல்டிங்கிற்குப் பிறகு வெப்பத்தால் பெரிய ஸ்டீல் பீம் வளைந்து விடுகிறது."
                },
                "q": {
                    "en": "How will you use staggered stitch welding sequences, clamp restraints, and heat-straightening techniques to correct beam distortion?",
                    "hi": "बीम के टेढ़ेपन को ठीक करने के लिए आप वेल्डिंग अनुक्रम, क्लैंप और हीट-स्ट्रेटनिंग तकनीक का उपयोग कैसे करेंगे?",
                    "ta": "வளைவைச் சீராக்க மாற்று வெல்டிங் வரிசை மற்றும் வெப்பச் சீரமைப்பை எவ்வாறு பயன்படுத்துவீர்கள்?"
                }
            }
        ]

    # 11. Automobile Repair & Mechanic
    elif any(k in sn_lower for k in ['mechanic', 'automobile', 'car repair', 'bike repair', 'engine', 'garage', 'brake', 'diesel']):
        pools = [
            {
                "sc": {
                    "en": "A customer brings a diesel SUV complaining of thick black exhaust smoke and loss of power while accelerating uphill.",
                    "hi": "एक ग्राहक अपनी डीजल एसयूवी लाता है और शिकायत करता है कि चढ़ाई पर गति बढ़ाते समय गाड़ी काला धुआं छोड़ती है और पिकअप गिर जाता है।",
                    "ta": "ஒரு வாடிக்கையாளர் தனது டீசல் கார் மலையேற்றத்தின் போது கருப்பு புகை வெளியேற்றி வேகம் குறைகிறது என புகார் கூறுகிறார்."
                },
                "q": {
                    "en": "How will you inspect air intake filters, check turbocharger boost pressure, and test fuel injector spray patterns?",
                    "hi": "एयर फिल्टर, टर्बोचार्जर दबाव और फ्यूल इंजेक्टर स्प्रे की जांच करने के क्या कदम उठाएंगे?",
                    "ta": "ஏர் ஃபில்டர், டர்போ அழுத்தம் மற்றும் ஃபியூவல் இன்ஜெக்டரை எவ்வாறு பரிசோதிப்பீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A sedan's hydraulic brake pedal feels soft and spongy when depressed, requiring double-pumping to stop the vehicle safely.",
                    "hi": "एक कार का हाइड्रोलिक ब्रेक पैडल दबाने पर बहुत नरम महसूस होता है और गाड़ी रोकने के लिए दो बार पैडल दबाना पड़ता है।",
                    "ta": "காரின் பிரேக் பேடல் மென்மையாகி வாகனம் நிற்க இரண்டு முறை அழுத்த வேண்டியுள்ளது."
                },
                "q": {
                    "en": "How will you inspect brake fluid lines for trapped air, perform caliper bleeding, and check master cylinder seals?",
                    "hi": "ब्रेक लाइनों से हवा निकालने (ब्लीडिंग), कैलीपर जांचने और मास्टर सिलेंडर सील की जांच करने की क्या विधि अपनाएंगे?",
                    "ta": "பிரேக் ஆயில் பைப்பில் உள்ள காற்றை நீக்கி மாஸ்டர் சிலிண்டரை எவ்வாறு சரிபார்ப்பீர்கள்?"
                }
            }
        ]

    # 12. Solar Panel & Renewable Energy
    elif any(k in sn_lower for k in ['solar', 'pv panel', 'inverter', 'renewable', 'solar installation']):
        pools = [
            {
                "sc": {
                    "en": "A 10kW rooftop solar panel array produces 40% less daily peak power output despite clear unshaded sunlight.",
                    "hi": "एक 10kW रूफटॉप सोलर सिस्टम साफ धूप होने के बावजूद 40% कम दैनिक बिजली पैदा कर रहा है।",
                    "ta": "10kW சோலார் பேனல் நல்ல வெயில் இருந்தும் 40% குறைந்த மின்சாரத்தையே உற்பத்தி செய்கிறது."
                },
                "q": {
                    "en": "How will you use a DC clamp meter and thermal camera to locate faulty panel bypass diodes and loose string connectors?",
                    "hi": "डीसी क्लैंप मीटर और थर्मल कैमरे की मदद से खराब बाईपास डायोड और ढीले कनेक्टर्स ढूंढने के क्या कदम उठाएंगे?",
                    "ta": "கிளாம்ப் மீட்டர் மற்றும் தெர்மல் கேமரா மூலம் சோலார் அமைப்பின் கோளாறை எவ்வாறு கண்டுபிடிப்பீர்கள்?"
                }
            }
        ]

    # 13. Software Development, Web & IT
    elif any(k in sn_lower for k in ['software', 'developer', 'programming', 'coding', 'python', 'javascript', 'java', 'html', 'css', 'react', 'node', 'sql', 'web development', 'app development', 'computer']):
        pools = [
            {
                "sc": {
                    "en": "During peak traffic hours, your production web API endpoint experiences high response latency spikes over 5 seconds due to unindexed database queries.",
                    "hi": "पीक आवर्स के दौरान, बिना इंडेक्स वाली डेटाबेस क्वेरी के कारण आपके प्रोडक्शन एपीआई का रिस्पॉन्स टाइम बढ़कर 5 सेकंड से अधिक हो जाता है।",
                    "ta": "அதிக பயனர்கள் இயங்கும் போது, இன்டெக்ஸ் இல்லாத தரவுத்தள வினவல்களால் வலை ஏபிஐ வேகம் 5 வினாடிகளுக்கு மேலாக தாமதமாகிறது."
                },
                "q": {
                    "en": "How will you use query execution plans (EXPLAIN), add compound SQL indexes, and set up Redis caching to reduce latency?",
                    "hi": "क्वेरी एक्जीक्यूशन प्लान (EXPLAIN) का विश्लेषण करने, SQL इंडेक्स जोड़ने और लेटेंसी कम करने के लिए रेडिस कैशिंग स्थापित करने के क्या कदम उठाएंगे?",
                    "ta": "தரவுத்தள வினவல் திட்டங்களை ஆய்வு செய்து இன்டெக்ஸ் மற்றும் கேச்சிங் அமைப்பை எவ்வாறு ஏற்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A long-running Node.js/Python microservice container repeatedly crashes with Out-Of-Memory (OOM) errors after 24 hours of operation.",
                    "hi": "24 घंटे चलने के बाद एक Node.js/Python माइक्रोसर्विस कंटेनर लगातार आउट-ऑफ-मेमोरी (OOM) एरर के साथ क्रैश हो जाता है।",
                    "ta": "24 மணி நேர செயல்பாட்டிற்குப் பிறகு Node.js சேவையகம் நினைவகக் கோளாறால் (OOM) மீண்டும் மீண்டும் செயலிழக்கிறது."
                },
                "q": {
                    "en": "How will you take heap snapshots, profile uncollected event listeners/global caches, and fix the memory leak?",
                    "hi": "हीप स्नैपशॉट लेने, अवांछित मेमोरी लीक ढूंढने और इसे ठीक करने के क्या कदम उठाएंगे?",
                    "ta": "ஹீப் ஸ்காப்பஷாட் எடுத்து நினைவக கசிவை (Memory Leak) எவ்வாறு கண்டுபிடித்து சரிசெய்வீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "A major mobile web app deployment suffers low Core Web Vitals scores due to large JavaScript bundles blocking main thread rendering.",
                    "hi": "बड़ी जावास्क्रिप्ट फाइलों के कारण मुख्य थ्रेड ब्लॉक होने से मोबाइल वेब ऐप की स्पीड और प्रदर्शन स्कोर काफी गिर जाता है।",
                    "ta": "பெரிய JavaScript கோப்புகளால் வலைப்பக்கத்தின் வேகம் மற்றும் Core Web Vitals மதிப்பெண் குறைகிறது."
                },
                "q": {
                    "en": "How will you implement code-splitting, dynamic dynamic imports, and defer non-critical assets to optimize rendering?",
                    "hi": "कोड-स्प्लिटिंग, डायनामिक इम्पोर्ट और पेज लोडिंग स्पीड सुधारने के लिए क्या कदम उठाएंगे?",
                    "ta": "கோட்களை பிரித்து (Code-splitting) பக்கத்தின் வேகத்தை எவ்வாறு அதிகரிப்பீர்கள்?"
                }
            }
        ]

    # 14. Mobile Repair & Electronics
    elif any(k in sn_lower for k in ['mobile repair', 'smartphone', 'soldering', 'chip level', 'electronics repair']):
        pools = [
            {
                "sc": {
                    "en": "A customer brings a water-damaged smartphone; the vibration motor responds when connected to a charger, but the display remains completely black.",
                    "hi": "एक ग्राहक पानी से खराब हुआ स्मार्टफोन लाता है; चार्जर लगाने पर फोन वाइब्रेट करता है लेकिन डिस्प्ले पूरी तरह से ब्लैक रहता है।",
                    "ta": "தண்ணீரில் விழுந்த ஸ்மார்ட்போனில் சார்ஜர் குத்தினால் அதிர்வு வருகிறது, ஆனால் திரையில் எதுவும் தெரியவில்லை."
                },
                "q": {
                    "en": "How will you inspect motherboard display connectors under a microscope, clean corrosion with IPA, and test backlight IC voltage?",
                    "hi": "माइक्रोस्कोप के तहत मदरबोर्ड कनेक्टर की जांच करने, आईपीए से जंग साफ करने और बैकलाइट आईसी वोल्टेज मापने के क्या कदम उठाएंगे?",
                    "ta": "மதர்போர்டு இணைப்பிகளை பரிசோதித்து பின்ஒளி IC மின்னழுத்தத்தை எவ்வாறு சரிபார்ப்பீர்கள்?"
                }
            }
        ]

    # 15. Driving & Logistics
    elif any(k in sn_lower for k in ['driver', 'driving', 'cab', 'taxi', 'truck', 'logistics', 'transport']):
        pools = [
            {
                "sc": {
                    "en": "Your commercial transport truck encounters sudden torrential rain on a steep mountain ghat road while carrying heavy cargo.",
                    "hi": "भारी सामान ले जाते समय खड़ी पहाड़ी सड़क पर अचानक मूसलाधार बारिश शुरू हो जाती है।",
                    "ta": "சரக்கு கொண்டு செல்லும் போது மலைச் சாலையில் திடீரென கனமழை பெய்கிறது."
                },
                "q": {
                    "en": "What downshift gear selection, engine braking, and traction maintenance protocols will you apply to navigate safely?",
                    "hi": "सुरक्षित वाहन चालन के लिए आप कौन से गियर नियंत्रण और ब्रेक प्रोटोकॉल का उपयोग करेंगे?",
                    "ta": "பாதுகாப்பாக வாகனம் ஓட்ட எந்த கியர் மற்றும் பிரேக் வழிமுறைகளைப் பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": "While driving a loaded cargo truck on a high-speed highway at night, a rear dual tire suddenly bursts.",
                    "hi": "रात में हाईवे पर सामान से लदा ट्रक चलाते समय अचानक पिछला टायरो फट जाता है।",
                    "ta": "இரவில் நெடுஞ்சாலையில் லாரி ஓட்டும் போது பின்புற டயர் திடீரென வெடிக்கிறது."
                },
                "q": {
                    "en": "How will you maintain firm steering control, decelerate gradually without slamming brakes, and safely park on the emergency shoulder?",
                    "hi": "स्टीयरिंग पर नियंत्रण बनाए रखने, धीरे-धीरे गति कम करने और वाहन को सुरक्षित रोकने के क्या कदम उठाएंगे?",
                    "ta": "ஸ்டீயரிங்கை பாதுகாப்பாக பிடித்து வாகனத்தை எவ்வாறு நிதானமாக நிறுத்துவீர்கள்?"
                }
            }
        ]

    # 16. Teaching & Tutoring
    elif any(k in sn_lower for k in ['tutor', 'tutoring', 'teacher', 'teaching', 'coaching']):
        pools = [
            {
                "sc": {
                    "en": "A high school student struggles to comprehend algebra concepts and experiences severe test anxiety before final board exams.",
                    "hi": "एक छात्र बीजगणित (अलजेब्रा) को समझने में संघर्ष कर रहा है और परीक्षा से पहले अत्यधिक चिंतित है।",
                    "ta": "ஒரு மாணவர் கணிதக் கருத்துகளைப் புரிந்துகொள்வதில் சிரமப்பட்டு தேர்வுக்கு முன் பயப்படுகிறார்."
                },
                "q": {
                    "en": "How will you break down complex steps visually, use relatable analogies, and rebuild confidence through practice?",
                    "hi": "कठिन चरणों को आसान उदाहरणों से समझाने और छात्र का आत्मविश्वास बढ़ाने के लिए आप क्या करेंगे?",
                    "ta": "கடினமான வழிமுறைகளை எளிய உதாரணங்களுடன் விளக்கி நம்பிக்கை ஊட்ட என்ன செய்வீர்கள்?"
                }
            }
        ]

    # 17. Security & Facility Safety
    elif any(k in sn_lower for k in ['security', 'guard', 'vigilance', 'watchman']):
        pools = [
            {
                "sc": {
                    "en": "An aggressive unauthorized visitor insists on entering a restricted commercial facility without a valid ID during night shift.",
                    "hi": "नाइट शिफ्ट के दौरान एक अनधिकृत आगंतुक बिना आईडी के प्रतिबंधित परिसर में प्रवेश करने की जिद्द करता है।",
                    "ta": "இரவுப் பணியின் போது அடையாள அட்டை இல்லாத நபர் வளாகத்திற்குள் நுழைய முற்படுகிறார்."
                },
                "q": {
                    "en": "How will you de-escalate tension calmly, verify credentials, and enforce security protocols without confrontation?",
                    "hi": "शांत रहकर स्थिति को संभालने, क्रेडेंशियल जांचने और सुरक्षा नियमों का पालन कराने के लिए आप क्या करेंगे?",
                    "ta": "அமைதியாக சூழ்நிலையைக் கையாண்டு பாதுகாப்பு விதிமுறைகளை எவ்வாறு அமல்படுத்துவீர்கள்?"
                }
            }
        ]

    # 18. Retail & Store Management
    elif any(k in sn_lower for k in ['retail', 'kirana', 'store', 'billing', 'inventory']):
        pools = [
            {
                "sc": {
                    "en": "A customer disputes a checkout bill amount at the counter during peak evening store hours, claiming a promotional discount was omitted.",
                    "hi": "पीक ऑवर्स के दौरान एक ग्राहक काउंटर पर बिल राशि पर विवाद करता है कि डिस्काउंट नहीं जोड़ा गया।",
                    "ta": "கடை நேரத்தில் பில்லிங் தொகையில் தள்ளுபடி சேர்க்கப்படவில்லை என வாடிக்கையாளர் சர்ச்சை செய்கிறார்."
                },
                "q": {
                    "en": "How will you verify item prices quickly, maintain counter composure, and resolve the billing query accurately?",
                    "hi": "शांत रहकर बिल की जांच करने और ग्राहक की समस्या का त्वरित समाधान करने के लिए आप क्या करेंगे?",
                    "ta": "பில்லிங்கை விரைவாக சரிபார்த்து வாடிக்கையாளரை எவ்வாறு திருப்திப்படுத்துவீர்கள்?"
                }
            }
        ]

    # 19. Customer Service & Call Handling (Explicitly for Customer Service ONLY)
    elif any(k in sn_lower for k in ['customer service', 'call center', 'helpdesk', 'support agent']):
        pools = [
            {
                "sc": {
                    "en": "An angry customer calls regarding a delayed delivery order and demands an immediate order cancellation along with a full refund.",
                    "hi": "एक नाराज ग्राहक ऑर्डर में देरी के संबंध में कॉल करता है और तत्काल रद्दीकरण और पूर्ण रिफंड की मांग करता है।",
                    "ta": "ஒரு கோபமான வாடிக்கையாளர் தாமதமான டெலிவரி குறித்து அழைத்து உடனடியாக ரத்து செய்து பணம் திரும்பக் கேட்கிறார்."
                },
                "q": {
                    "en": "How will you practice active listening, express empathy, check order status in the system, and present an agreeable resolution?",
                    "hi": "सहानुभूति व्यक्त करने, सिस्टम में स्थिति जांचने और ग्राहक को संतुष्ट करने के लिए आप कौन से कदम उठाएंगे?",
                    "ta": "வாடிக்கையாளரின் கோபத்தைத் தணித்து திருப்திகரமான தீர்வை எவ்வாறு வழங்குவீர்கள்?"
                }
            }
        ]

    # 20. Agriculture & Farming
    elif any(k in sn_lower for k in ['farm', 'farming', 'agriculture', 'crop', 'irrigation', 'pesticide']):
        pools = [
            {
                "sc": {
                    "en": "Crop leaves in a commercial vegetable farm show yellowing with dark brown spots during early monsoon, threatening harvest yield.",
                    "hi": "शुरुआती मानसून में सब्जियों की फसल की पत्तियों पर पीले और भूरे धब्बे दिखाई देते हैं, जिससे पैदावार को खतरा है।",
                    "ta": "மழைக்கால தொடக்கத்தில் பயிர் இலைகள் மஞ்சளாகி பழுப்பு புள்ளிகள் தோன்றி மகசூலை அச்சுறுத்துகிறது."
                },
                "q": {
                    "en": "How will you identify the fungal infection, perform soil pH/nutrient checks, and apply targeted bio-fungicide sprays?",
                    "hi": "फंगल संक्रमण की पहचान करने, मिट्टी का परीक्षण करने और जैविक कीटनाशक का छिड़काव करने के क्या कदम उठाएंगे?",
                    "ta": "பூஞ்சை தொற்றைக் கண்டறிந்து இயற்கை பூச்சிக்கொல்லி தெளித்து பயிரை எவ்வாறு காப்பாற்றுவீர்கள்?"
                }
            }
        ]

    # Pick a random scenario from pool if matched
    if pools:
        chosen = random.choice(pools)
        sc = chosen["sc"]
        q = chosen["q"]
    else:
        # Universal Dynamic Skill Generator for any unlisted skill name
        name_en = _get_localized_skill_name(skill_name, 'en')
        name_hi = _get_localized_skill_name(skill_name, 'hi')
        name_ta = _get_localized_skill_name(skill_name, 'ta')

        fallback_templates = [
            {
                "sc": {
                    "en": f"While executing a critical high-precision task for '{name_en}', an unexpected equipment fault or material defect arises.",
                    "hi": f"'{name_hi}' के लिए एक महत्वपूर्ण कार्य करते समय, एक अप्रत्याशित उपकरण दोष या सामग्री की समस्या उत्पन्न होती है।",
                    "ta": f"'{name_ta}' தொடர்பான முக்கியமான பணியை செய்யும் போது, எதிர்பாராத உபகரணக் கோளாறு ஏற்படுகிறது."
                },
                "q": {
                    "en": f"What specific technical diagnostic procedures, safety checks, and recovery steps will you apply to complete '{name_en}' successfully?",
                    "hi": f"'{name_hi}' को सफलतापूर्वक पूरा करने के लिए आप कौन से विशिष्ट तकनीकी समाधान, सुरक्षा जांच और सटीक कदम उठाएंगे?",
                    "ta": f"'{name_ta}' பணியை வெற்றிகரமாக முடிக்க என்ன தொழில்நுட்ப சோதனைகள் மற்றும் பாதுகாப்பு முறைகளைப் பயன்படுத்துவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": f"A client requests an urgent tight-deadline custom assignment in '{name_en}', but primary tools or standard materials are partially unavailable.",
                    "hi": f"एक ग्राहक '{name_hi}' में कम समय सीमा वाले कार्य का अनुरोध करता है, लेकिन मानक उपकरण या सामग्री आंशिक रूप से अनुपलब्ध हैं।",
                    "ta": f"வாடிக்கையாளர் '{name_ta}' துறையில் அவசர வேலை கேட்கிறார், ஆனால் சில கருவிகள் குறைவாக உள்ளன."
                },
                "q": {
                    "en": f"How will you adapt your technical workflow, select alternative tools, and maintain quality benchmarks in '{name_en}'?",
                    "hi": f"'{name_hi}' में कार्य गुणवत्ता बनाए रखने के लिए आप अपनी कार्यप्रणाली, वैकल्पिक उपकरणों और मानकों को कैसे समायोजित करेंगे?",
                    "ta": f"'{name_ta}' பணியில் மாற்று கருவிகள் மற்றும் முறைகளைப் பயன்படுத்தி தரத்தை எவ்வாறு பேணுவீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": f"During a formal quality control inspection of your work in '{name_en}', a senior supervisor detects a minor specification tolerance error.",
                    "hi": f"'{name_hi}' में आपके कार्य के गुणवत्ता निरीक्षण के दौरान, एक वरिष्ठ पर्यवेक्षक एक छोटी सी माप त्रुटि की ओर इशारा करता है।",
                    "ta": f"'{name_ta}' பணியின் தர பரிசோதனையின் போது ஒரு சிறிய கோளாறு கண்டறியப்படுகிறது."
                },
                "q": {
                    "en": f"How will you re-calibrate your equipment, perform precise corrections, and ensure your work strictly complies with trade standards for '{name_en}'?",
                    "hi": f"'{name_hi}' में पेशेवर मानकों को पूरा करने के लिए आप माप, उपकरण अंशांकन और सुधार के क्या कदम उठाएंगे?",
                    "ta": f"'{name_ta}' துறையில் தொழில்முறை தரத்தை எட்ட என்ன சீரமைப்பு நடவடிக்கைகளை எடுப்பீர்கள்?"
                }
            },
            {
                "sc": {
                    "en": f"While delivering a complex project in '{name_en}', sudden environmental or site conditions threaten to compromise the finished quality.",
                    "hi": f"'{name_hi}' में कार्य करते समय, अचानक प्रतिकूल मौसम या स्थल की स्थितियां काम की गुणवत्ता को प्रभावित करने की आशंका पैदा करती हैं।",
                    "ta": f"'{name_ta}' பணியை செய்யும் போது எதிர்பாராத காலநிலை அல்லது இடர்பாடுகள் தரத்தை பாதிக்கின்றன."
                },
                "q": {
                    "en": f"What preventive measures, protective techniques, and tactical adjustments will you deploy to guarantee excellent results in '{name_en}'?",
                    "hi": f"'{name_hi}' में उत्कृष्ट परिणाम सुनिश्चित करने के लिए आप कौन से निवारक उपाय, सुरक्षात्मक तकनीकें और समायोजन लागू करेंगे?",
                    "ta": f"'{name_ta}' துறையில் சிறந்த முடிவுகளை உறுதிசெய்ய என்ன தடுப்பு நடவடிக்கைகளை எடுப்பீர்கள்?"
                }
            }
        ]
        chosen = random.choice(fallback_templates)
        sc = chosen["sc"]
        q = chosen["q"]

    return {
        "scenario": sc.get(language, sc["en"]),
        "question": q.get(language, q["en"]),
        "scenario_hi": sc["hi"],
        "question_hi": q["hi"],
        "scenario_ta": sc["ta"],
        "question_ta": q["ta"],
    }


NO_EVIDENCE_PHRASES = [
    "i don't know", "i dont know", "dont know", "don't know", "do not know",
    "no idea", "i have no idea", "not sure", "i'm not sure", "im not sure", "am not sure",
    "can't answer", "cant answer", "cannot answer", "don't remember", "dont remember",
    "haven't done this", "no experience", "dunno", "idk", "never done", "nothing", "skip",
    "pata nahi", "mujh pata nahi", "mujhe nahi pata", "maloom nahi", "samajh nahi आया", "samajh nahi aaya",
    "theriyathu", "theriyala", "enaku theriyathu", "enaku theriyaadhu", "theriyaadhu", "puriyala",
]


def _classify_answer_state(user_response: str) -> str:
    """Classify response state. Returns 'no_evidence' or 'has_evidence'."""
    text = (user_response or "").strip().lower()
    if not text:
        return "no_evidence"
    
    for phrase in NO_EVIDENCE_PHRASES:
        if phrase in text:
            if len(text.split()) <= 10:
                return "no_evidence"
    
    if len(text) < 4:
        return "no_evidence"
        
    return "has_evidence"


def _get_skill_dimensions(skill_name: str) -> List[str]:
    sn = (skill_name or "").lower()
    if any(k in sn for k in ['electric', 'wiring', 'plumb', 'mechanic', 'repair', 'auto', 'welding', 'carpentry', 'masonry', 'hardware', 'paint', 'painting']):
        return ["Problem Diagnosis", "Technical Understanding", "Troubleshooting Approach", "Safety Awareness"]
    elif any(k in sn for k in ['cook', 'cooking', 'culinary', 'bake', 'baking', 'food', 'catering']):
        return ["Recipe & Technique", "Hygiene & Safety", "Process Control", "Customer Service"]
    elif any(k in sn for k in ['tailor', 'stitching', 'fabric', 'garment', 'embroidery']):
        return ["Measurement & Pattern", "Craftsmanship", "Material Handling", "Client Customization"]
    elif any(k in sn for k in ['makeup', 'beautician', 'parlour', 'skin', 'hair']):
        return ["Client Consultation", "Technique & Precision", "Hygiene & Skin Safety", "Product Application"]
    return ["Problem Understanding", "Communication", "Decision Making", "Empathy"]


def generate_shap_narrative(shap_data: Dict[str, Any], skill_name: str, language: str = "en") -> Dict[str, str]:
    """Generate human-friendly explanation of actual SHAP contributions in user's selected language."""
    if not shap_data:
        return {"en": "", "hi": "", "ta": ""}
        
    pos = [f"{c['feature']} (+{c['shap_value']})" for c in shap_data.get("positive_factors", [])]
    neg = [f"{c['feature']} ({c['shap_value']})" for c in shap_data.get("negative_factors", [])]
    
    pos_str = ", ".join(pos) if pos else "None"
    neg_str = ", ".join(neg) if neg else "None"
    
    narrative_en = f"Your confidence score of {shap_data['final_score']}% is driven by strong positive contributions from {pos_str}."
    if neg_str != "None":
        narrative_en += f" Factors reducing confidence include {neg_str}."
        
    narrative_hi = f"आपका {shap_data['final_score']}% का विश्वास स्कोर इन सकारात्मक कारकों से बढ़ा है: {pos_str}।"
    if neg_str != "None":
        narrative_hi += f" विश्वास कम करने वाले कारक: {neg_str}।"

    narrative_ta = f"உங்கள் {shap_data['final_score']}% நம்பிக்கை மதிப்பெண் இந்த நேர்மறை காரணிகளால் அதிகரித்துள்ளது: {pos_str}."
    if neg_str != "None":
        narrative_ta += f" நம்பிக்கையை குறைக்கும் காரணிகள்: {neg_str}."
        
    if _openai_client and not settings.is_demo_mode:
        lang_instruction = _get_language_instruction(language)
        system_prompt = f"""You convert actual SHAP machine learning feature contributions into a clear 2-3 sentence explanation for the user.
Skill: {skill_name}
Final Score: {shap_data['final_score']}%
Positive Contributors: {pos_str}
Negative Contributors: {neg_str}

{lang_instruction}
Rules:
1. Explain WHY the score was high or low using ONLY the provided SHAP features and values.
2. DO NOT invent factors or modify SHAP values.
3. Output ONLY plain text in the requested language. Do not mix languages."""
        
        user_prompt = f"Explain these SHAP contributions entirely in {language}."
        llm_out = _call_llm(system_prompt, user_prompt, json_mode=False)
        if llm_out:
            if language == "ta":
                narrative_ta = llm_out
            elif language == "hi":
                narrative_hi = llm_out
            else:
                narrative_en = llm_out

    return {
        "en": narrative_en,
        "hi": narrative_hi,
        "ta": narrative_ta,
    }


def evaluate_verification_response(
    skill_name: str, scenario: str, user_response: str, language: str = "en"
) -> Dict[str, Any]:
    """Evaluate user's verification response."""
    state = _classify_answer_state(user_response)
    if state == "no_evidence":
        no_ev_explanations = {
            "en": "We couldn't verify this skill from your response. Your previous experience may indicate this skill, but there is not enough evidence from this verification attempt to confirm it.",
            "hi": "हम आपके उत्तर से इस कौशल को सत्यापित नहीं कर सके। आपके अनुभव में यह कौशल हो सकता है, लेकिन इस प्रयास में पर्याप्त प्रमाण नहीं है।",
            "ta": "உங்கள் பதிலில் இருந்து இந்த திறனை எங்களால் சரிபார்க்க முடியவில்லை. உங்கள் அனுபவத்தில் இத்திறன் இருக்கலாம், ஆனால் இந்த முயற்சியில் போதுமான ஆதாரம் இல்லை."
        }
        exp = no_ev_explanations.get(language, no_ev_explanations["en"])
        return {
            "status": "no_evidence",
            "score": 0,
            "dimensions": {},
            "explanation": exp,
            "explanation_hi": no_ev_explanations["hi"],
            "explanation_ta": no_ev_explanations["ta"],
            "shap_data": None,
            "shap_explanation": None,
            "shap_explanation_hi": None,
            "shap_explanation_ta": None,
        }

    if settings.is_demo_mode:
        return _demo_evaluation(language, skill_name)

    lang_instruction = _get_language_instruction(language)
    dims = _get_skill_dimensions(skill_name)
    dims_str = "\n".join([f"- {d}" for d in dims])
    dims_json = ", ".join([f'"{d}": 0' for d in dims])

    system_prompt = f"""You are evaluating a skill verification response for AnubhavAI.
Skill: {skill_name}
{lang_instruction}

Evaluate the response on these skill-specific dimensions (0-100):
{dims_str}

Determine status: demonstrated | partially_demonstrated | needs_improvement

Return JSON:
{{
  "status": "...",
  "score": 0-100,
  "dimensions": {{{dims_json}}},
  "explanation": "...",
  "explanation_hi": "...",
  "explanation_ta": "..."
}}"""

    user_prompt = f"Scenario: {scenario}\n\nUser response: {user_response}"
    result = _call_llm(system_prompt, user_prompt)
    parsed = None
    if result:
        try:
            parsed = json.loads(result)
        except Exception:
            pass

    if not parsed:
        parsed = _demo_evaluation(language, skill_name)

    score = float(parsed.get("score", 85))
    dimensions = parsed.get("dimensions", {})
    if not dimensions:
        demo_dims = {}
        for idx, d in enumerate(dims):
            demo_dims[d] = 85.0
        dimensions = demo_dims

    shap_data = calculate_real_shap(
        skill_name=skill_name,
        experience_confidence=0.90,
        years_experience=3.0,
        dimensions=dimensions,
        evaluated_score=score
    )
    shap_nar = generate_shap_narrative(shap_data, skill_name, language)

    parsed["shap_data"] = shap_data
    parsed["shap_explanation"] = shap_nar.get(language, shap_nar["en"])
    parsed["shap_explanation_hi"] = shap_nar["hi"]
    parsed["shap_explanation_ta"] = shap_nar["ta"]

    return parsed


def _demo_evaluation(language: str, skill_name: str = "") -> Dict[str, Any]:
    r = DEMO_VERIFICATION["result"]
    dims = _get_skill_dimensions(skill_name)
    demo_dims = {}
    base_scores = [92, 88, 85, 90]
    for idx, d in enumerate(dims):
        demo_dims[d] = base_scores[idx % len(base_scores)]

    score = float(r["score"])
    shap_data = calculate_real_shap(
        skill_name=skill_name,
        experience_confidence=0.90,
        years_experience=3.0,
        dimensions=demo_dims,
        evaluated_score=score
    )
    shap_nar = generate_shap_narrative(shap_data, skill_name, language)

    return {
        "status": r["status"],
        "score": score,
        "dimensions": demo_dims,
        "explanation": r["explanation"].get(language, r["explanation"]["en"]),
        "explanation_hi": r["explanation"]["hi"],
        "explanation_ta": r["explanation"]["ta"],
        "shap_data": shap_data,
        "shap_explanation": shap_nar.get(language, shap_nar["en"]),
        "shap_explanation_hi": shap_nar["hi"],
        "shap_explanation_ta": shap_nar["ta"],
    }


def calculate_skill_gap(user_skills: List[Dict], language: str = "en") -> List[Dict]:
    """Dynamically generate skill gap analysis based on extracted user skills."""
    if not user_skills:
        return DEMO_SKILL_GAPS

    skill_names = [s.get("name", "").lower() for s in user_skills]
    combined_names = " ".join(skill_names)

    if any(k in combined_names for k in ['bake', 'baking', 'cake', 'pastry', 'oven']):
        return [
            {"skill_name": {"en": "Baking & Cake Decoration", "hi": "बेकिंग और केक सजावट", "ta": "பேக்கிங் மற்றும் கேக் அலங்காரம்"}, "current_score": 92, "target_score": 100},
            {"skill_name": {"en": "Commercial Oven Operations", "hi": "व्यावसायिक ओवन संचालन", "ta": "வணிக ஓவன் இயக்கம்"}, "current_score": 85, "target_score": 100},
            {"skill_name": {"en": "Food Safety & FSSAI Standards", "hi": "खाद्य सुरक्षा और FSSAI मानक", "ta": "உணவு பாதுகாப்பு மற்றும் FSSAI தரநிலைகள்"}, "current_score": 55, "target_score": 100},
            {"skill_name": {"en": "Digital Marketing & Online Delivery", "hi": "डिजिटल मार्केटिंग और ऑनलाइन डिलीवरी", "ta": "டிஜிட்டல் மார்க்கெட்டிங் மற்றும் ஆன்லைன் டெலிவரி"}, "current_score": 30, "target_score": 100},
        ]
    elif any(k in combined_names for k in ['tailor', 'stitching', 'fabric', 'garment', 'embroidery']):
        return [
            {"skill_name": {"en": "Tailoring & Garment Construction", "hi": "सिलाई और वस्त्र निर्माण", "ta": "தையல் மற்றும் ஆடை தயாரிப்பு"}, "current_score": 94, "target_score": 100},
            {"skill_name": {"en": "Pattern Cutting & Embroidery", "hi": "पैटर्न कटाई और कढ़ाई", "ta": "பேட்டர்ன் வெட்டுதல் மற்றும் எம்பிராய்டரி"}, "current_score": 88, "target_score": 100},
            {"skill_name": {"en": "Boutique Quality Control", "hi": "बुटीक गुणवत्ता नियंत्रण", "ta": "பூட்டிக் தரக் கட்டுப்பாடு"}, "current_score": 60, "target_score": 100},
            {"skill_name": {"en": "Social Media Selling & Branding", "hi": "सोशल मीडिया बिक्री व ब्रांडिंग", "ta": "சோஷியல் மீடியா விற்பனை"}, "current_score": 35, "target_score": 100},
        ]
    elif any(k in combined_names for k in ['cook', 'culinary', 'catering', 'food', 'tiffin']):
        return [
            {"skill_name": {"en": "Commercial Culinary Preparation", "hi": "व्यावसायिक पाक कला", "ta": "வணிகரீதியான சமையல் தயாரிப்பு"}, "current_score": 95, "target_score": 100},
            {"skill_name": {"en": "Kitchen Hygiene & Food Safety", "hi": "रसोई स्वच्छता व खाद्य सुरक्षा", "ta": "சமையலறை சுகாதாரம் & உணவு பாதுகாப்பு"}, "current_score": 85, "target_score": 100},
            {"skill_name": {"en": "Bulk Catering Management", "hi": "थोक कैटरिंग प्रबंधन", "ta": "மொத்த கேட்டரிங் மேலாண்மை"}, "current_score": 65, "target_score": 100},
            {"skill_name": {"en": "Digital Order Booking", "hi": "डिजिटल ऑर्डर बुकिंग", "ta": "டிஜிட்டல் ஆர்டர் புக்கிங்"}, "current_score": 30, "target_score": 100},
        ]
    elif any(k in combined_names for k in ['makeup', 'beautician', 'parlour', 'skin', 'facial', 'hair']):
        return [
            {"skill_name": {"en": "Bridal & Event Makeup Artistry", "hi": "ब्राइडल व इवेंट मेकअप कला", "ta": "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை"}, "current_score": 95, "target_score": 100},
            {"skill_name": {"en": "Skin Care & Hair Styling", "hi": "त्वचा की देखभाल व हेयर स्टाइलिंग", "ta": "சரும பராமரிப்பு மற்றும் முடி அலங்காரம்"}, "current_score": 90, "target_score": 100},
            {"skill_name": {"en": "Cosmetology Hygiene & Sterilization", "hi": "सौंदर्य प्रसाधन स्वच्छता व नसबंदी", "ta": "அழகு சாதன சுகாதாரம்"}, "current_score": 60, "target_score": 100},
            {"skill_name": {"en": "Salon Booking & Online Marketing", "hi": "सैलून बुकिंग व ऑनलाइन मार्केटिंग", "ta": "சலூன் புக்கிங் & ஆன்லைன் விளம்பரம்"}, "current_score": 35, "target_score": 100},
        ]
    elif any(k in combined_names for k in ['electric', 'wiring', 'fuse', 'appliance']):
        return [
            {"skill_name": {"en": "Domestic Electrical Wiring", "hi": "घरेलू बिजली वायरिंग", "ta": "வீட்டு மின்சார வயரிங்"}, "current_score": 95, "target_score": 100},
            {"skill_name": {"en": "Appliance Diagnostics & Repair", "hi": "उपकरण जांच व मरम्मत", "ta": "மின் சாதன பழுது நீக்கம்"}, "current_score": 85, "target_score": 100},
            {"skill_name": {"en": "Industrial Safety & Earthing", "hi": "औद्योगिक सुरक्षा व अर्थिंग", "ta": "தொழில்துறை பாதுகாப்பு & எர்த்திங்"}, "current_score": 55, "target_score": 100},
            {"skill_name": {"en": "Solar & Inverter Technology", "hi": "सोलर व इन्वर्टर तकनीक", "ta": "சூரிய சக்தி & இன்வெர்ட்டர் தொழில்நுட்பம்"}, "current_score": 30, "target_score": 100},
        ]

    return DEMO_SKILL_GAPS


def match_opportunities(user_skills: List[Dict], district: str, language: str = "en") -> List[Dict]:
    """Dynamically prioritize schemes based on extracted trade skills."""
    skill_names = " ".join([s.get("name", "").lower() for s in user_skills]) if user_skills else ""

    schemes = [
        {
            "name": "PM Vishwakarma Kaushal Samman (PM-VIKAS) Scheme",
            "name_hi": "पीएम विश्वकर्मा कौशल सम्मान योजना",
            "name_ta": "பிரதமர் விஸ்வகர்மா திறன் சம்மான் திட்டம்",
            "category": "Vocational & Artisan Grants",
            "district": district or "Chennai",
            "description": "Financial aid, toolkit incentive of ₹15,000, and collateral-free enterprise loan up to ₹3 Lakhs at 5% interest for Bakers, Tailors, Electricians, Plumbers, Mechanics & Artisans.",
            "description_hi": "बेकर्स, दर्जी, बिजली मिस्त्री, प्लंबर, मेकेनिक और कारीगरों के लिए 15,000 रुपये का टूलकिट प्रोत्साहन और 3 लाख रुपये तक का ब्याज सब्सिडी ऋण।",
            "description_ta": "பேக்கர்கள், தையல்காரர்கள், எலக்ட்ரீஷியன்கள், பிளம்பர்களுக்கு 15,000 கருவித்தொகுப்பு மானியம் மற்றும் 3 லட்சம் வரை பிணை இல்லா கடன்.",
            "eligibility": "Self-employed artisan, traditional trade worker or micro-entrepreneur",
            "eligibility_hi": "स्व-रोजगार कारीगर, पारंपरिक व्यापार कार्यकर्ता या सूक्ष्म-उद्यमी",
            "eligibility_ta": "சுயதொழில் செய்யும் கைவினைஞர் அல்லது சிறு தொழில்முனைவோர்",
            "duration": "Ongoing",
            "benefits": "₹15,000 toolkit stipend, ₹3 Lakh collateral-free credit at 5% interest, and skill certification",
            "benefits_hi": "15,000 रुपये टूलकिट वजीफा, 5% ब्याज पर 3 लाख संपार्श्विक-मुक्त ऋण, और कौशल प्रमाणन",
            "benefits_ta": "15,000 கருவித்தொகுப்பு உதவித்தொகை, 5% வட்டியில் 3 லட்சம் கடன் மற்றும் சான்றிதழ்",
            "match_score": 98 if any(k in skill_names for k in ['bake', 'tailor', 'stitch', 'weld', 'electric', 'plumb', 'mechanic', 'potter']) else 90,
            "is_demo": True,
        },
        {
            "name": "Samarth Scheme for Capacity Building in Textile & Apparel Sector",
            "name_hi": "समर्थ वस्त्र व परिधान कौशल विकास योजना",
            "name_ta": "சமர்த் ஆடை மற்றும் ஜவுளித்துறை திறன் மேம்பாட்டுத் திட்டம்",
            "category": "Textile & Apparel",
            "district": district or "Chennai",
            "description": "Skill upgrade training, advanced sewing/embroidery machines, and direct market linkage for tailoring micro-entrepreneurs.",
            "description_hi": "सिलाई सूक्ष्म उद्यमियों के लिए कौशल उन्नयन प्रशिक्षण, उन्नत सिलाई मशीनें और प्रत्यक्ष बाजार जुड़ाव।",
            "description_ta": "தையல் தொழில் முனைவோருக்கு மேம்பட்ட தையல் இயந்திரங்கள், திறன் பயிற்சி மற்றும் நேரடி சந்தை இணைப்பு.",
            "eligibility": "Practicing tailors, embroidery artisans, and garment makers",
            "eligibility_hi": "अभ्यास करने वाले दर्जी, कढ़ाई कारीगर और परिधान निर्माता",
            "eligibility_ta": "தையல்காரர்கள், எம்பிராய்டரி கலைஞர்கள் மற்றும் ஆடை தயாரிப்பாளர்கள்",
            "duration": "3-6 months",
            "benefits": "Free skill upgrade, sewing machine subsidy, and wage/employment placement linkage",
            "benefits_hi": "मुफ्त कौशल उन्नयन, सिलाई मशीन सब्सिडी, और रोजगार जुड़ाव",
            "benefits_ta": "இலவச திறன் மேம்பாடு, தையல் இயந்திர மானியம் மற்றும் வேலைவாய்ப்பு இணைப்பு",
            "match_score": 98 if any(k in skill_names for k in ['tailor', 'stitch', 'fabric', 'garment', 'embroidery']) else 82,
            "is_demo": True,
        },
        {
            "name": "PM Formalization of Micro Food Processing Enterprises (PM FME)",
            "name_hi": "प्रधानमंत्री सूक्ष्म खाद्य उद्यम औपचारिकीकरण योजना (पीएम एफएमई)",
            "name_ta": "சிறு உணவு பதப்படுத்தல் நிறுவனங்கள் முறைசார் திட்டம் (PM FME)",
            "category": "Food & Beverages",
            "district": district or "Chennai",
            "description": "Financial, technical, and branding support for micro baking, cooking, tiffin, and food units.",
            "description_hi": "सूक्ष्म बेकिंग, कुकिंग, टिफिन और खाद्य इकाइयों के लिए वित्तीय, तकनीकी और ब्रांडिंग सहायता।",
            "description_ta": "சிறு பேக்கிங், சமையல், டிபன் மற்றும் உணவு அலகுகளுக்கு நிதி மற்றும் பிராண்டிங் ஆதரவு.",
            "eligibility": "Existing micro food, baking, or tiffin unit",
            "eligibility_hi": "मौजूदा सूक्ष्म खाद्य, बेकिंग या टिफिन इकाई",
            "eligibility_ta": "தற்போது இயங்கும் சிறு உணவு, பேக்கிங் அல்லது டிபன் அலகு",
            "duration": "Ongoing",
            "benefits": "Up to Rs 10 lakh credit linked subsidy, technical training, branding support",
            "benefits_hi": "10 लाख रुपये तक क्रेडिट लिंक्ड सब्सिडी, तकनीकी प्रशिक्षण, ब्रांडिंग सहायता",
            "benefits_ta": "10 லட்சம் வரை கடன் சார்ந்த மானியம், தொழில்நுட்ப பயிற்சி, பிராண்டிங் ஆதரவு",
            "match_score": 97 if any(k in skill_names for k in ['bake', 'cook', 'culinary', 'food', 'tiffin', 'catering']) else 84,
            "is_demo": True,
        },
        {
            "name": "DAY-NULM / DAY-NRLM Micro-Enterprise & Self-Employment Grant",
            "name_hi": "दीनदयाल अंत्योदय योजना सूक्ष्म-उद्यम अनुदान",
            "name_ta": "தீன்தயாள் அந்தியோதயா திட்டம் சிறு தொழில் மானியம்",
            "category": "Social Justice & Skilling",
            "district": district or "Chennai",
            "description": "Interest subvention and credit linkages for urban & rural women self-help groups in beautician, tailoring, baking, and retail trades.",
            "description_hi": "ब्यूटीशियन, सिलाई, बेकिंग और रिटेल ट्रेडों में शहरी और ग्रामीण महिला स्वयं सहायता समूहों के लिए ब्याज सब्सिडी।",
            "description_ta": "அழகு கலை, தையல், பேக்கிங் தொழில் செய்யும் மகளிர் சுயஉதவிக் குழுக்களுக்கு வட்டி மானியம் மற்றும் கடன் உதவி.",
            "eligibility": "Women micro-entrepreneurs, self-help group members, beauty parlour operators",
            "eligibility_hi": "महिला सूक्ष्म-उद्यमी, स्वयं सहायता समूह की सदस्य, ब्यूटी पार्लर संचालक",
            "eligibility_ta": "பெண் சிறு தொழில்முனைவோர், அழகு நிலைய உரிமையாளர்கள்",
            "duration": "Ongoing",
            "benefits": "Interest subvention on bank loans up to ₹2 Lakhs, free toolkit & exhibition stalls",
            "benefits_hi": "2 लाख रुपये तक बैंक ऋण पर ब्याज सब्सिडी, मुफ्त टूलकिट और प्रदर्शनी स्टॉल",
            "benefits_ta": "2 லட்சம் வரை வங்கி கடன்களுக்கு வட்டி மானியம், இலவச கண்காட்சி அரங்குகள்",
            "match_score": 96 if any(k in skill_names for k in ['makeup', 'beautician', 'parlour', 'skin', 'facial', 'tailor', 'bake']) else 86,
            "is_demo": True,
        },
    ]

    schemes.sort(key=lambda x: x["match_score"], reverse=True)
    return schemes


def generate_progression_path(user_skills: List[Dict], gaps: List[Dict], language: str = "en") -> Dict[str, Any]:
    steps = DEMO_PROGRESSION_STEPS.get(language, DEMO_PROGRESSION_STEPS["en"])
    titles = {
        "en": "Your Growth Journey",
        "hi": "आपकी विकास यात्रा",
        "ta": "உங்கள் வளர்ச்சி பயணம்",
    }
    return {
        "title": titles.get(language, titles["en"]),
        "title_hi": titles["hi"],
        "title_ta": titles["ta"],
        "steps": steps,
        "current_step": 0,
    }


def generate_spoken_explanation(content: str, language: str = "en") -> str:
    if settings.is_demo_mode:
        explanations = {
            "en": "This opportunity matches your informal skill profile. Your practical experience makes you eligible for this scheme.",
            "hi": "यह अवसर आपके कौशल से मेल खाता है। आपका अनुभव आपको इस योजना के लिए योग्य बनाता है।",
            "ta": "இத்திட்டம் உங்கள் திறனுக்கு பொருத்தமானது.",
        }
        return explanations.get(language, explanations["en"])

    lang_instruction = _get_language_instruction(language)
    result = _call_llm(
        f"You generate spoken explanations. {lang_instruction} Be concise and natural (2-3 sentences).",
        content,
        json_mode=False,
    )
    return result or content


def generate_clarification_question(context: str, language: str = "en") -> str:
    questions = {
        "en": "Could you tell me more about the type of work you do? For example, do you work with machines, food, crops, tools, or customers?",
        "hi": "क्या आप मुझे अपने काम के बारे में और बता सकते हैं?",
        "ta": "உங்கள் வேலையைப் பற்றி மேலும் கொஞ்சம் சொல்ல முடியுமா?",
    }
    return questions.get(language, questions["en"])
