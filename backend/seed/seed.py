"""
Seed script for AnubhavAI.
Run: python seed/seed.py
Populates MySQL with demo data: skills, schemes, training programs, demo user.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, Base, engine
from app.models.models import (
    User, Skill, SkillCategory, Experience, ExperienceSkill, SkillEvidence,
    Scheme, TrainingProgram, SkillVerification, VerificationStatus
)

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("Seeding AnubhavAI database...")

# ── Skill Categories ───────────────────────────────────────────────────────────
categories_data = [
    "Baking & Confectionery", "Textile & Apparel", "Food Production", "Personal Care & Beauty",
    "Electrical & Electronics", "Plumbing & Sanitary", "Carpentry & Woodwork",
    "Mechanical & Automotive", "Metalwork & Manufacturing", "Construction & Building",
    "Agriculture & Allied", "Crafts & Artisans", "Education & Training", "Transport",
    "Housekeeping & Services", "Security & Safety", "Digital & Computers", "Sales",
    "Customer Handling", "Inventory", "Business Management", "Marketing"
]

categories = {}
for cat_name in categories_data:
    cat = db.query(SkillCategory).filter(SkillCategory.name == cat_name).first()
    if not cat:
        cat = SkillCategory(name=cat_name)
        db.add(cat)
        db.flush()
    categories[cat_name] = cat

db.commit()
print(f"  Created {len(categories)} skill categories")

# ── Skills ─────────────────────────────────────────────────────────────────────
skills_data = [
    {
        "name": "Baking & Cake Decoration",
        "name_hi": "बेकिंग और केक सजावट",
        "name_ta": "பேக்கிங் மற்றும் கேக் அலங்காரம்",
        "category": "Baking & Confectionery",
        "description": "Ability to bake cakes, pastries, bread, and decorate confectionery items",
        "description_hi": "केक, पेस्ट्री, ब्रेड बेक करने और बेकरी आइटम सजाने की क्षमता",
        "description_ta": "கேக்குகள், பேஸ்ட்ரிகள் தயாரிக்கும் மற்றும் அலங்கரிக்கும் திறன்",
    },
    {
        "name": "Tailoring & Garment Construction",
        "name_hi": "सिलाई और वस्त्र निर्माण",
        "name_ta": "தையல் மற்றும் ஆடை தயாரிப்பு",
        "category": "Textile & Apparel",
        "description": "Stitching custom garments, blouse designing, fabric cutting, and embroidery",
        "description_hi": "कस्टम कपड़े सिलने, ब्लाउज डिजाइनिंग, कपड़े की कटाई और कढ़ाई",
        "description_ta": "ஆடைகள் தைத்தல், பிளவுஸ் டிசைனிங், துணி வெட்டுதல் மற்றும் எம்பிராய்டரி",
    },
    {
        "name": "Commercial Culinary Preparation & Cooking",
        "name_hi": "व्यावसायिक पाक कला व भोजन निर्माण",
        "name_ta": "வணிகரீதியான சமையல் தயாரிப்பு",
        "category": "Food Production",
        "description": "Preparing commercial meals, catering orders, tiffin service, and kitchen hygiene",
        "description_hi": "व्यावसायिक भोजन, कैटरिंग ऑर्डर, टिफिन सेवा और रसोई की स्वच्छता",
        "description_ta": "வணிக உணவுகள், கேட்டரிங் ஆர்டர்கள், டிபன் சேவை தயாரிக்கும் திறன்",
    },
    {
        "name": "Bridal & Event Makeup Artistry",
        "name_hi": "ब्राइडल व इवेंट मेकअप कला",
        "name_ta": "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை",
        "category": "Personal Care & Beauty",
        "description": "Bridal makeup, skin prep, cosmetics application, threading, facials, and hair styling",
        "description_hi": "ब्राइडल मेकअप, स्किन केयर, फेशियल, थ्रेडिंग और हेयर स्टाइलिंग",
        "description_ta": "மணப்பெண் அலங்காரம், சரும பராமரிப்பு, ஃபேஷியல் மற்றும் முடி அலங்காரம்",
    },
    {
        "name": "Domestic Electrical Wiring & Appliance Repair",
        "name_hi": "घरेलू बिजली वायरिंग व उपकरण मरम्मत",
        "name_ta": "மின்சார வயரிங் மற்றும் சாதன பழுது நீக்கம்",
        "category": "Electrical & Electronics",
        "description": "Installing house wiring, main switchboards, ceiling fan, motor, and appliance repairs",
        "description_hi": "घरेलू वायरिंग, स्विचबोर्ड, पंखे, मोटर और बिजली उपकरण सुधार",
        "description_ta": "வீட்டு வயரிங், சுவிட்ச்போர்டு, ஃபேன் மற்றும் மோட்டார் பழுது நீக்கும் திறன்",
    },
    {
        "name": "Plumbing & Water Pipeline Installation",
        "name_hi": "प्लंबिंग व जल पाइपलाइन बिछाना",
        "name_ta": "பிளம்பிங் மற்றும் குடிநீர் குழாய் அமைத்தல்",
        "category": "Plumbing & Sanitary",
        "description": "PVC/metal pipe fitting, water tank setup, tap and sanitary leakage repair",
        "description_hi": "पीवीसी/धातु पाइप फिटिंग, पानी की टंकी और लीक मरम्मत",
        "description_ta": "குழாய் பொருத்துதல், தண்ணீர் தொட்டி மற்றும் கசிவு பழுது நீக்குதல்",
    },
    {
        "name": "Carpentry & Custom Furniture Making",
        "name_hi": "बढ़ईगीरी व कस्टम फर्नीचर निर्माण",
        "name_ta": "தச்சவேலை மற்றும் மரப் மரச்சாமான்கள் தயாரிப்பு",
        "category": "Carpentry & Woodwork",
        "description": "Crafting wooden doors, windows, plywood cabinets, and wood polishing",
        "description_hi": "लकड़ी के दरवाजे, खिड़कियां, अलमारी और पॉलिशिंग का काम",
        "description_ta": "மரக் கதவுகள், ஜன்னல்கள், அலமாரிகள் தயாரித்தல் மற்றும் பாலிஷ் செய்தல்",
    },
    {
        "name": "Automotive Engine & Mechanical Repair",
        "name_hi": "ऑटोमोटिव इंजन व यांत्रिक मरम्मत",
        "name_ta": "வாகன என்ஜின் மற்றும் இயந்திர பழுது நீக்கம்",
        "category": "Mechanical & Automotive",
        "description": "2-wheeler/4-wheeler engine repair, brake servicing, oil change, and vehicle mechanics",
        "description_hi": "दोपहिया/चार पहिया वाहन इंजन सुधार, ब्रेक सर्विसिंग और ऑयल बदलना",
        "description_ta": "வாகன என்ஜின் பழுதுபார்த்தல், பிரேக் சர்வீஸ் மற்றும் பராமரிப்பு",
    },
    {
        "name": "Mobile Hardware & Screen Repair",
        "name_hi": "मोबाइल हार्डवेयर व स्क्रीन मरम्मत",
        "name_ta": "மொபைல் ஹார்டுவேர் மற்றும் திரை பழுது நீக்கம்",
        "category": "Electrical & Electronics",
        "description": "Replacing smartphone displays, charging jacks, battery units, and soldering",
        "description_hi": "स्मार्टफोन डिस्प्ले, चार्जिंग जैक, बैटरी यूनिट बदलना और सोल्डरिंग",
        "description_ta": "மொபைல் தொடுதிரை, சார்ஜிங் சாக்கெட் மற்றும் பேட்டரி மாற்றுதல்",
    },
    {
        "name": "Arc & Metal Fabrication Welding",
        "name_hi": "आर्क व धातु फैब्रिकेशन वेल्डिंग",
        "name_ta": "மெட்டல் ஃபேப்ரிகேஷன் & வெல்டிங்",
        "category": "Metalwork & Manufacturing",
        "description": "Arc welding, iron gate construction, window safety grill fabrication",
        "description_hi": "आर्क वेल्डिंग, लोहे के गेट और ग्रिल निर्माण",
        "description_ta": "வெல்டிங், இரும்பு கேட் மற்றும் கிரில் சாதனங்கள் தயாரிப்பு",
    },
    {
        "name": "Masonry & Brickwork Construction",
        "name_hi": "राजमिस्त्री व ईंट निर्माण",
        "name_ta": "கொத்தனார் மற்றும் செங்கல் வேலை",
        "category": "Construction & Building",
        "description": "Bricklaying, cement plastering, tile flooring, and wall painting",
        "description_hi": "ईंट बिछाने, सीमेंट प्लास्टर, टाइल फिटिंग और पेंटिंग",
        "description_ta": "செங்கல் கட்டுதல், சிமெண்ட் பூச்சு மற்றும் தரை டைல்ஸ் பொருத்துதல்",
    },
    {
        "name": "Agricultural Crop Management & Cultivation",
        "name_hi": "कृषि फसल प्रबंधन व खेती",
        "name_ta": "விவசாய பயிர் மேலாண்மை & சாகுபடி",
        "category": "Agriculture & Allied",
        "description": "Crop cultivation, soil preparation, organic fertilizing, harvesting, and dairy farming",
        "description_hi": "फसल खेती, मिट्टी की तैयारी, जैविक खाद और पशुपालन",
        "description_ta": "பயிர் சாகுபடி, இயற்கை உரம், அறுவடை மற்றும் பால் பண்ணை பராமரிப்பு",
    },
    {
        "name": "Food Production",
        "name_hi": "खाद्य उत्पादन",
        "name_ta": "உணவு உற்பத்தி",
        "category": "Food Production",
        "description": "Ability to produce, prepare, and package food products",
        "description_hi": "खाद्य उत्पादों को बनाने, तैयार करने और पैकेज करने की क्षमता",
        "description_ta": "உணவு பொருட்களை தயாரிக்கும், தயாரிக்கும் மற்றும் பேக் செய்யும் திறன்",
    },
    {
        "name": "Sales & Customer Service",
        "name_hi": "बिक्री और ग्राहक सेवा",
        "name_ta": "விற்பனை மற்றும் வாடிக்கையாளர் சேவை",
        "category": "Sales",
        "description": "Ability to sell products and services effectively, manage counter sales and clients",
        "description_hi": "उत्पादों और सेवाओं को बेचने और ग्राहकों के साथ बातचीत करने की क्षमता",
        "description_ta": "பொருட்கள் மற்றும் சேவைகளை விற்கும் மற்றும் வாடிக்கையாளர் சேவை திறன்",
    },
    {
        "name": "Customer Handling",
        "name_hi": "ग्राहक प्रबंधन",
        "name_ta": "வாடிக்கையாளர் சேவை",
        "category": "Customer Handling",
        "description": "Ability to manage customer relationships and resolve issues",
        "description_hi": "ग्राहक संबंधों को प्रबंधित करने और समस्याओं को हल करने की क्षमता",
        "description_ta": "வாடிக்கையாளர் உறவுகளை நிர்வகிக்கும் மற்றும் சிக்கல்களை தீர்க்கும் திறன்",
    },
    {
        "name": "Inventory Management",
        "name_hi": "इन्वेंटरी प्रबंधन",
        "name_ta": "சரக்கு மேலாண்மை",
        "category": "Inventory",
        "description": "Ability to track, manage, and optimize inventory",
        "description_hi": "इन्वेंटरी को ट्रैक करने, प्रबंधित करने और अनुकूलित करने की क्षमता",
        "description_ta": "சரக்குகளை கண்காணிக்கும், நிர்வகிக்கும் மற்றும் மேம்படுத்தும் திறன்",
    },
    {
        "name": "Pricing & Marketing",
        "name_hi": "मूल्य निर्धारण और विपणन",
        "name_ta": "விலை நிர்ணயம் மற்றும் சந்தைப்படுத்தல்",
        "category": "Marketing",
        "description": "Ability to price products and market them effectively",
        "description_hi": "उत्पाद मूल्य निर्धारण और विपणन की क्षमता",
        "description_ta": "பொருட்களை விலை நிர்ணயம் செய்து சந்தைப்படுத்தும் திறன்",
    },
    {
        "name": "Small Business Management",
        "name_hi": "लघु व्यवसाय प्रबंधन",
        "name_ta": "சிறு வணிக நிர்வாகம்",
        "category": "Business Management",
        "description": "Ability to manage and grow a small business",
        "description_hi": "एक छोटे व्यवसाय को प्रबंधित करने और बढ़ाने की क्षमता",
        "description_ta": "சிறு வணிகத்தை நிர்வகிக்கும் மற்றும் வளர்க்கும் திறன்",
    },
    {
        "name": "Mechanical Repair",
        "name_hi": "यांत्रिक मरम्मत",
        "name_ta": "இயந்திர பழுது நீக்கம்",
        "category": "Mechanical",
        "description": "Ability to diagnose and repair mechanical equipment",
        "description_hi": "यांत्रिक उपकरणों का निदान और मरम्मत करने की क्षमता",
        "description_ta": "இயந்திர சாதனங்களை கண்டறிந்து பழுது நீக்கும் திறன்",
    },
    {
        "name": "Digital Marketing",
        "name_hi": "डिजिटल मार्केटिंग",
        "name_ta": "டிஜிட்டல் மார்க்கெட்டிங்",
        "category": "Digital",
        "description": "Ability to market products and services through digital channels",
        "description_hi": "डिजिटल माध्यमों से उत्पादों और सेवाओं का विपणन करने की क्षमता",
        "description_ta": "டிஜிட்டல் சேனல்கள் மூலம் பொருட்கள் மற்றும் சேவைகளை சந்தைப்படுத்தும் திறன்",
    },
]

skill_map = {}
for sd in skills_data:
    skill = db.query(Skill).filter(Skill.name == sd["name"]).first()
    if not skill:
        cat = categories.get(sd["category"])
        skill = Skill(
            name=sd["name"],
            name_hi=sd["name_hi"],
            name_ta=sd["name_ta"],
            category_id=cat.id if cat else None,
            description=sd["description"],
            description_hi=sd["description_hi"],
            description_ta=sd["description_ta"],
        )
        db.add(skill)
        db.flush()
    skill_map[sd["name"]] = skill

db.commit()
print(f"  Created {len(skill_map)} skills")

# ── Demo Schemes ───────────────────────────────────────────────────────────────
schemes_data = [
    {
        "name": "PM Formalization of Micro Food Processing Enterprises (PM FME)",
        "name_hi": "प्रधानमंत्री सूक्ष्म खाद्य उद्यम औपचारिकीकरण योजना",
        "name_ta": "சிறு உணவு பதப்படுத்தல் நிறுவனங்கள் முறைசார் திட்டம் (PM FME)",
        "category": "Food & Beverages",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "description": "Financial, technical, and business support for micro food processing enterprises to formalize and grow.",
        "description_hi": "सूक्ष्म खाद्य प्रसंस्करण उद्यमों को औपचारिक बनाने और बढ़ाने के लिए वित्तीय, तकनीकी और व्यावसायिक सहायता।",
        "description_ta": "சிறு உணவு பதப்படுத்தல் நிறுவனங்களை முறைப்படுத்தவும் வளர்க்கவும் நிதி, தொழில்நுட்ப மற்றும் வணிக ஆதரவு.",
        "eligibility": "Existing micro food processing unit, own or leased premises",
        "eligibility_hi": "मौजूदा सूक्ष्म खाद्य प्रसंस्करण इकाई, स्वयं या पट्टे पर लिया गया परिसर",
        "eligibility_ta": "தற்போது இயங்கும் சிறு உணவு பதப்படுத்தல் அலகு, சொந்த அல்லது குத்தகை வளாகம்",
        "duration": "Ongoing",
        "benefits": "Up to Rs 10 lakh credit linked subsidy, technical training, branding support",
        "benefits_hi": "10 लाख रुपये तक क्रेडिट लिंक्ड सब्सिडी, तकनीकी प्रशिक्षण, ब्रांडिंग सहायता",
        "benefits_ta": "10 லட்சம் வரை கடன் சார்ந்த மானியம், தொழில்நுட்ப பயிற்சி, பிராண்டிங் ஆதரவு",
        "match_score": 92.0,
        "is_demo": True,
        "active": True,
    },
    {
        "name": "PM-AJAY Skilling Grant (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana)",
        "name_hi": "पीएम-अजय कौशल विकास अनुदान योजना",
        "name_ta": "பிஎம்-அஜய் திறன் மேம்பாட்டு மானியத் திட்டம்",
        "category": "Social Justice & Skilling",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "description": "District-level skill training grant and financial support for SC beneficiaries & informal micro-entrepreneurs.",
        "description_hi": "अनुसूचित जाति के लाभार्थियों और अनौपचारिक सूक्ष्म उद्यमियों के लिए जिला स्तरीय कौशल प्रशिक्षण अनुदान।",
        "description_ta": "பட்டியலின பயனாளிகள் மற்றும் முறைசாரா சிறு தொழில் முனைவோருக்கான மாவட்ட அளவிலான திறன் பயிற்சி மானியம்.",
        "eligibility": "District resident, SC beneficiary or informal micro-entrepreneur",
        "eligibility_hi": "जिला निवासी, अनुसूचित जाति के लाभार्थी या अनौपचारिक सूक्ष्म-उद्यमी",
        "eligibility_ta": "மாவட்டத்தில் வசிப்பவர், பட்டியலின பயனாளி அல்லது முறைசாரா சிறு தொழிலாளி",
        "duration": "3-6 months",
        "benefits": "Free skill certification, toolkit stipend, and direct credit linkage up to Rs 50,000",
        "benefits_hi": "मुफ्त कौशल प्रमाणन, टूलकिट वजीफा, और 50,000 रुपये तक की प्रत्यक्ष क्रेडिट लिंकेज",
        "benefits_ta": "இலவச திறன் சான்றிதழ், கருவித்தொகுப்பு உதவித்தொகை, மற்றும் 50,000 வரை கடன் இணைப்பு",
        "match_score": 96.0,
        "is_demo": True,
        "active": True,
    },
    {
        "name": "MUDRA Loan — Shishu Category",
        "name_hi": "मुद्रा ऋण — शिशु श्रेणी",
        "name_ta": "முத்ரா கடன் — சிசு பிரிவு",
        "category": "Finance",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "description": "Collateral-free business loans up to Rs 50,000 for micro enterprises in their early stage.",
        "description_hi": "प्रारंभिक चरण के सूक्ष्म उद्यमों के लिए 50,000 रुपये तक का संपार्श्विक-मुक्त व्यापार ऋण।",
        "description_ta": "ஆரம்ப கட்ட சிறு நிறுவனங்களுக்கு 50,000 வரை பிணை இல்லாத வணிக கடன்.",
        "eligibility": "Non-farm income generating activity, Indian citizen",
        "eligibility_hi": "गैर-कृषि आय उत्पन्न करने वाली गतिविधि, भारतीय नागरिक",
        "eligibility_ta": "விவசாயமற்ற வருமான ஈட்டும் செயல்பாடு, இந்திய குடிமகன்",
        "duration": "1-5 years repayment",
        "benefits": "Up to Rs 50,000 loan, no collateral, low interest rate",
        "benefits_hi": "50,000 रुपये तक ऋण, कोई संपार्श्विक नहीं, कम ब्याज दर",
        "benefits_ta": "50,000 வரை கடன், பிணை தேவையில்லை, குறைந்த வட்டி விகிதம்",
        "match_score": 85.0,
        "is_demo": True,
        "active": True,
    },
    {
        "name": "Tamil Nadu Skill Training Program — Food Processing",
        "name_hi": "तमिलनाडु कौशल प्रशिक्षण कार्यक्रम — खाद्य प्रसंस्करण",
        "name_ta": "தமிழ்நாடு திறன் பயிற்சி திட்டம் — உணவு பதப்படுத்தல்",
        "category": "Training",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "description": "3-month skill training program for food processing and packaging.",
        "description_hi": "खाद्य प्रसंस्करण और पैकेजिंग के लिए 3 महीने का कौशल प्रशिक्षण कार्यक्रम।",
        "description_ta": "உணவு பதப்படுத்தல் மற்றும் பேக்கேஜிங்கிற்கான 3 மாத திறன் பயிற்சி திட்டம்.",
        "eligibility": "Age 18-45, basic literacy",
        "eligibility_hi": "आयु 18-45, बुनियादी साक्षरता",
        "eligibility_ta": "வயது 18-45, அடிப்படை கல்வியறிவு",
        "duration": "3 months",
        "benefits": "Free training, certificate, placement assistance",
        "benefits_hi": "मुफ्त प्रशिक्षण, प्रमाण पत्र, नियुक्ति सहायता",
        "benefits_ta": "இலவச பயிற்சி, சான்றிதழ், வேலைவாய்ப்பு உதவி",
        "match_score": 78.0,
        "is_demo": True,
        "active": True,
    },
]

for sd in schemes_data:
    existing = db.query(Scheme).filter(Scheme.name == sd["name"]).first()
    if not existing:
        scheme = Scheme(**sd)
        db.add(scheme)

db.commit()
print(f"  Created {len(schemes_data)} demo schemes")

# ── Training Programs ──────────────────────────────────────────────────────────
training_data = [
    {
        "name": "Digital Marketing for Small Business",
        "name_hi": "लघु व्यवसाय के लिए डिजिटल मार्केटिंग",
        "name_ta": "சிறு வணிகத்திற்கான டிஜிட்டல் மார்க்கெட்டிங்",
        "skill_focus": "Digital Marketing",
        "duration": "3 months",
        "description": "Learn to market your products online using social media and e-commerce platforms.",
        "description_hi": "सोशल मीडिया और ई-कॉमर्स प्लेटफार्म का उपयोग करके अपने उत्पादों का ऑनलाइन विपणन करना सीखें।",
        "description_ta": "சமூக ஊடகங்கள் மற்றும் இ-காமர்ஸ் தளங்களைப் பயன்படுத்தி உங்கள் பொருட்களை ஆன்லைனில் சந்தைப்படுத்த கற்றுக்கொள்ளுங்கள்.",
        "provider": "NSDC",
        "district": "Chennai",
        "is_demo": True,
    },
    {
        "name": "Food Safety & Quality Certification",
        "name_hi": "खाद्य सुरक्षा और गुणवत्ता प्रमाणन",
        "name_ta": "உணவு பாதுகாப்பு மற்றும் தர சான்றிதழ்",
        "skill_focus": "Food Production",
        "duration": "6 months",
        "description": "FSSAI certification for food businesses — hygiene, safety standards, and quality control.",
        "description_hi": "खाद्य व्यवसायों के लिए FSSAI प्रमाणन — स्वच्छता, सुरक्षा मानक और गुणवत्ता नियंत्रण।",
        "description_ta": "உணவு வணிகங்களுக்கான FSSAI சான்றிதழ் — சுகாதாரம், பாதுகாப்பு தரங்கள் மற்றும் தர கட்டுப்பாடு.",
        "provider": "FSSAI",
        "district": "Chennai",
        "is_demo": True,
    },
]

for td in training_data:
    existing = db.query(TrainingProgram).filter(TrainingProgram.name == td["name"]).first()
    if not existing:
        tp = TrainingProgram(**td)
        db.add(tp)

db.commit()
print(f"  Created {len(training_data)} training programs")

# ── Demo User ──────────────────────────────────────────────────────────────────
demo_user = db.query(User).filter(User.device_id == "demo-device-001").first()
if not demo_user:
    demo_user = User(
        device_id="demo-device-001",
        name="Demo User",
        district="Chennai",
        state="Tamil Nadu",
        language="en",
    )
    db.add(demo_user)
    db.flush()

    exp = Experience(
        user_id=demo_user.id,
        raw_text="I have been making and selling homemade pickles for five years. I manage customers, purchase ingredients, calculate prices, and also handle packaging.",
        language="en",
        summary="Five years of food production and small business management experience.",
    )
    db.add(exp)
    db.flush()

    skills_to_add = ["Food Production", "Sales", "Customer Handling", "Inventory Management"]
    from app.models.models import ConfidenceLevel
    for skill_name in skills_to_add:
        skill = skill_map.get(skill_name)
        if skill:
            es = ExperienceSkill(
                experience_id=exp.id,
                skill_id=skill.id,
                confidence=0.9 if skill_name != "Inventory Management" else 0.72,
                confidence_level=ConfidenceLevel.HIGH if skill_name != "Inventory Management" else ConfidenceLevel.MEDIUM,
                years_experience=5.0,
            )
            db.add(es)
            db.flush()
            ev = SkillEvidence(
                experience_skill_id=es.id,
                evidence_text=f"User's experience directly demonstrates {skill_name}.",
                confidence=0.9,
            )
            db.add(ev)

    db.commit()
    print(f"  Created demo user with ID {demo_user.id}")
else:
    print("  Demo user already exists")

db.close()
print("\nSeeding complete! AnubhavAI database is ready.")
print(f"  Admin login: admin / anubhav2024")
print(f"  Demo user device_id: demo-device-001")
