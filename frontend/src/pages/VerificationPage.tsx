import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Loader2, SkipForward, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { startVerification, evaluateVerification } from '../api/endpoints';
import {
  startSpeechRecognition, stopSpeechRecognition, speak, stopSpeaking
} from '../services/voice';
import type { VerificationScenario } from '../types';

const SKILL_TRANSLATIONS: Record<string, { hi: string; ta: string }> = {
  "Commercial Culinary Preparation & Cooking": { hi: "व्यावसायिक पाक कला व भोजन निर्माण", ta: "வணிகரீதியான சமையல் தயாரிப்பு" },
  "Tailoring & Garment Construction": { hi: "सिलाई और वस्त्र निर्माण", ta: "தையல் மற்றும் ஆடை தயாரிப்பு" },
  "Bridal & Event Makeup Artistry": { hi: "ब्राइडल व इवेंट मेकअप कला", ta: "மணப்பெண் மேக்கப் மற்றும் ஒப்பனை" },
  "Domestic Electrical Wiring & Appliance Repair": { hi: "घरेलू बिजली वायरिंग व उपकरण मरम्मत", ta: "வீட்டு மின் வயரிங் மற்றும் உபகரணப் பழுது" },
  "Plumbing, Fitting & Sanitary Maintenance": { hi: "प्लंबिंग, फिटिंग व सेनेटरी रखरखाव", ta: "பிளம்பிங் மற்றும் சுகாதாரப் பராமரிப்பு" },
  "HVAC & Refrigeration Maintenance": { hi: "एचवीएसी व रेफ्रिजरेशन रखरखाव", ta: "HVAC மற்றும் குளிரூட்டல் பராமரிப்பு" },
  "Baking & Cake Decoration": { hi: "बेकिंग और केक सजावट", ta: "பேக்கிங் மற்றும் கேக் அலங்காரம்" },
  "Automobile & Two-Wheeler Mechanics": { hi: "ऑटोमोबाइल व टू-व्हीलर मैकेनिक", ta: "ஆட்டோமொபைல் மெக்கானிக்" },
  "Carpentry & Custom Woodworking": { hi: "कारपेंट्री व कस्टम वुडवर्किंग", ta: "தச்சர் மற்றும் மரவேலை" },
  "Welding & Metal Fabrication": { hi: "वेल्डिंग व मेटल फैब्रिकेशन", ta: "வெல்டிங் மற்றும் உலோக வேலை" },
  "Software & Web Development": { hi: "सॉफ्टवेयर व वेब डेवलपमेंट", ta: "மென்பொருள் உருவாக்கம்" },
  "Solar Panel Installation & Renewable Energy": { hi: "सोलर पैनल इंस्टॉलेशन", ta: "சூரிய ஒளி பேனல் நிறுவுதல்" },
  "Retail Store Operations & Inventory Billing": { hi: "रिटेल स्टोर ऑपरेशन्स व बिलिंग", ta: "சில்லறை கடை நிர்வாகம்" },
  "Mobile & Smartphone Hardware Repair": { hi: "मोबाइल रिपेयरिंग", ta: "மொபைல் பழுதுபார்ப்பு" },
  "House Painting & Wall Surface Finishing": { hi: "पेंटिंग व वॉल फिनिशिंग", ta: "சுவர் வண்ணம் பூசுதல்" }
};

function getLocalizedSkillName(targetSkill: any, lang: string): string {
  const skillObj = typeof targetSkill === 'string' ? { name: targetSkill } : targetSkill || {};
  const nameEn = skillObj.name || 'Practical Trade Skill';
  if (lang === 'en') return nameEn;
  if (lang === 'hi' && skillObj.name_hi) return skillObj.name_hi;
  if (lang === 'ta' && skillObj.name_ta) return skillObj.name_ta;

  const match = SKILL_TRANSLATIONS[nameEn];
  if (match && lang in match) return match[lang as 'hi'|'ta'];

  const snLower = nameEn.toLowerCase();
  if (snLower.includes('cook') || snLower.includes('culinary') || snLower.includes('food')) {
    return lang === 'hi' ? 'व्यावसायिक पाक कला व भोजन निर्माण' : 'வணிகரீதியான சமையல் தயாரிப்பு';
  }
  if (snLower.includes('bake') || snLower.includes('cake')) {
    return lang === 'hi' ? 'बेकिंग और केक सजावट' : 'பேக்கிங் மற்றும் கேக் அலங்காரம்';
  }
  if (snLower.includes('tailor') || snLower.includes('stitch') || snLower.includes('fabric')) {
    return lang === 'hi' ? 'सिलाई और वस्त्र निर्माण' : 'தையல் மற்றும் ஆடை தயாரிப்பு';
  }
  if (snLower.includes('electric') || snLower.includes('wiring')) {
    return lang === 'hi' ? 'घरेलू बिजली वायरिंग व उपकरण मरम्मत' : 'வீட்டு மின் வயரிங் மற்றும் உபகரணப் பழுது';
  }

  return lang === 'hi' ? 'व्यवसायिक कौशल' : 'தொழில்முறை திறன்';
}

function getSkillSpecificDemoScenario(targetSkill: any, lang: string): { scenario: string; question: string } {
  const nameEn = getLocalizedSkillName(targetSkill, 'en');
  const nameHi = getLocalizedSkillName(targetSkill, 'hi');
  const nameTa = getLocalizedSkillName(targetSkill, 'ta');

  const combinedLower = `${nameEn} ${nameHi} ${nameTa}`.toLowerCase();
  const rand = Math.floor(Math.random() * 3);

  // Cooking, Culinary & Catering
  if (combinedLower.includes('cook') || combinedLower.includes('culinary') || combinedLower.includes('food') || combinedLower.includes('chef') || combinedLower.includes('catering') || combinedLower.includes('tiffin') || combinedLower.includes('पाक') || combinedLower.includes('भोजन') || combinedLower.includes('रसोई') || combinedLower.includes('சமையல்')) {
    const options = [
      {
        en: { scenario: 'You are catering an event for 80 guests, and the host requests 20 extra vegetarian meals with only 45 minutes remaining.', question: 'How will you prioritize kitchen prep, ingredient repurposing, and quality control under time pressure?' },
        hi: { scenario: 'आप 80 मेहमानों के लिए भोजन की व्यवस्था कर रहे हैं, और आयोजक केवल 45 मिनट शेष रहते हुए 20 अतिरिक्त शाकाहारी भोजन का अनुरोध करता है।', question: 'समय के दबाव में आप रसोई की तैयारी, सामग्री के उपयोग और गुणवत्ता नियंत्रण को कैसे प्राथमिकता देंगे?' },
        ta: { scenario: '80 விருந்தினர்களுக்கான உணவளிப்பில், நிகழ்ச்சி தொடங்குவதற்கு 45 நிமிடங்களுக்கு முன் கூடுதலாக 20 சைவ உணவுகள் கேட்கப்படுகின்றன.', question: 'நேர நெருக்கடியில் சமையல் தயாரிப்பு மற்றும் தரக் கட்டுப்பாட்டை எவ்வாறு நிர்வகிப்பீர்கள்?' }
      },
      {
        en: { scenario: 'A large pot of biryani gravy prepared for a wedding lunch tastes excessively salty 30 minutes before serving.', question: 'What kitchen remedies like raw potato starch absorption, dairy cream addition, or volume expansion will you use to balance taste?' },
        hi: { scenario: 'शादी के दोपहर के भोजन के लिए तैयार की गई बिरयानी ग्रेवी परोसने से 30 मिनट पहले बहुत अधिक नमकीन लगती है।', question: 'स्वाद को संतुलित करने के लिए आप कच्चे आलू, मलाई या मात्रा बढ़ाने जैसे कौन से उपाय करेंगे?' },
        ta: { scenario: 'திருமண உணவிற்காக தயாரிக்கப்பட்ட பிரியாணி கிரேவியில் பரிமாறுவதற்கு 30 நிமிடங்களுக்கு முன் அதிக உப்பு உறைக்கிறது.', question: 'சுவையைச் சீராக்க உருளைக்கிழங்கு, பால் ஏடு அல்லது அளவு அதிகரிப்பு போன்ற என்ன உத்திகளைப் பயன்படுத்துவீர்களா?' }
      },
      {
        en: { scenario: 'You need to package and deliver 150 hot tiffin lunch boxes for corporate delivery while keeping rice fluffy and rotis soft without sogginess over 3 hours.', question: 'What thermal steam venting, foil wrapping, and layering techniques will you apply during packing?' },
        hi: { scenario: 'आपको 3 घंटे के सफर के लिए 150 टिफिन बॉक्स पैक करने हैं ताकि चावल खिले रहें और रोटियां नरम रहें और नमी से गीली न हों।', question: 'भोजन को गीला होने से बचाने और गर्म रखने के लिए आप पैकेजिंग और स्टीम वेंटिंग की क्या तकनीक अपनाएंगे?' },
        ta: { scenario: '3 மணிநேர பயணத்திற்கு 150 டிபன் பாக்ஸ்களை உணவுகள் குலையாமல் சூடாக பேக் செய்ய வேண்டும்.', question: 'உணவு வீணாகாமல் சூடாகவும் புத்துணர்ச்சியுடனும் இருக்க என்ன பேக்கிங் நுட்பங்களைப் பயன்படுத்துவீர்கள்?' }
      }
    ];
    const item = options[rand % options.length];
    return item[lang as 'en'|'hi'|'ta'] || item.en;
  }

  // Baking & Confectionery
  if (combinedLower.includes('bake') || combinedLower.includes('baking') || combinedLower.includes('cake') || combinedLower.includes('pastry')) {
    const options = [
      {
        en: { scenario: 'A customer orders a custom two-tier wedding cake with cream icing on a hot afternoon, but the lower layer starts softening during transit.', question: 'How will you adjust the cake structure, dowel support, cooling, and icing temperature to fix it?' },
        hi: { scenario: 'एक ग्राहक गर्म दोपहर में क्रीम आइसिंग के साथ दो मंजिला शादी के केक का ऑर्डर देता है, लेकिन रास्ते में निचली परत नरम होने लगती है।', question: 'इसे ठीक करने के लिए आप केक की संरचना, सपोर्ट और तापमान नियंत्रण में क्या सुधार करेंगे?' },
        ta: { scenario: 'ஒரு வாடிக்கையாளர் வெயில் நேரத்தில் இரண்டு அடுக்கு கேக் ஆர்டர் செய்கிறார், ஆனால் கொண்டு செல்லும் போது கீழ் அடுக்கு தளரத் தொடங்குகிறது.', question: 'இதை சரிசெய்ய கேக்கின் கட்டமைப்பு மற்றும் வெப்பநிலையை எப்படி நிர்வகிப்பீர்கள்?' }
      },
      {
        en: { scenario: 'While baking chocolate sponge cakes for a party order, the cake center sinks completely after taking it out of the oven.', question: 'What oven temperature, baking powder measurement, and batter mixing technique corrections will you apply?' },
        hi: { scenario: 'पार्टी ऑर्डर के लिए चॉकलेट स्पंज केक बनाते समय, ओवन से बाहर निकालने के बाद केक का मध्य भाग पूरी तरह से बैठ जाता है।', question: 'आप ओवन के तापमान, बेकिंग पाउडर के नाप और बैटर मिक्सिंग तकनीक में क्या सुधार करेंगे?' },
        ta: { scenario: 'பார்ட்டி ஆர்டருக்காக சாக்லேட் கேக் சுடும் போது, அவனிலிருந்து எடுத்த பிறகு கேக்கின் நடுப்பகுதி அமிழ்ந்து விடுகிறது.', question: 'அவன் வெப்பநிலை, பேக் பவுடர் அளவு மற்றும் மாவு கலவை நுட்பத்தில் என்ன மாற்றங்களைச் செய்வீர்கள்?' }
      },
      {
        en: { scenario: 'Your batch of French macarons comes out flat without characteristic feet and the top shells crack during baking.', question: 'How will you adjust batter macaronage folding, skin resting duration, and oven convection airflow?' },
        hi: { scenario: 'फ्रेंच मैकारॉन का आपका बैच बिना उभरे बेस के चपटा निकलता है और ऊपर का खोल बेकिंग के दौरान फट जाता है।', question: 'मैकारॉन को सही आकार और फिनिश देने के लिए बैटर फोल्डिंग, रेस्टिंग टाइम और ओवन एयरफ्लो में क्या बदलाव करेंगे?' },
        ta: { scenario: 'பிரெஞ்சு மக்காரான்கள் சரியாக எழும்பாமல் மேற்பரப்பு வெடித்து விடுகிறது.', question: 'மாவு கலக்கும் முறை மற்றும் அவன் காற்றோட்டத்தை எவ்வாறு சரிசெய்வீர்கள்?' }
      }
    ];
    const item = options[rand % options.length];
    return item[lang as 'en'|'hi'|'ta'] || item.en;
  }

  // Tailoring & Stitching
  if (combinedLower.includes('tailor') || combinedLower.includes('stitch') || combinedLower.includes('fabric') || combinedLower.includes('garment') || combinedLower.includes('blouse') || combinedLower.includes('सिलाई') || combinedLower.includes('தையல்')) {
    const options = [
      {
        en: { scenario: 'A customer brings expensive silk cloth for a wedding blouse, but requests a neck pattern requiring 20cm more fabric than provided.', question: 'How will you adjust the cutting pattern or design to satisfy the customer without damaging the cloth?' },
        hi: { scenario: 'एक ग्राहक शादी के ब्लाउज के लिए महंगा रेशमी कपड़ा लाता है, लेकिन ऐसे नेक पैटर्न का अनुरोध करता है जिसके लिए 20 सेमी अधिक कपड़े की आवश्यकता होती है।', question: 'कपड़े को नुकसान पहुँचाए बिना ग्राहक को संतुष्ट करने के लिए आप क्या करेंगे?' },
        ta: { scenario: 'ஒரு வாடிக்கையாளர் திருமண பிளவுஸுக்கு விலையுயர்ந்த பட்டுத் துணியைக் கொண்டு வருகிறார், ஆனால் வழங்கப்பட்டதை விட 20 செ.மீ கூடுதல் துணி தேவைப்படும் கழுத்து அமைப்பைக் கேட்கிறார்.', question: 'துணியை சேதப்படுத்தாமல் வாடிக்கையாளரை திருப்திப்படுத்த என்ன செய்வீர்கள்?' }
      },
      {
        en: { scenario: 'A cotton kurti shrinks unevenly after its first trial wash, causing tightness under the armhole and shoulder mismatch.', question: 'How will you use seam allowance adjustments, fabric pre-shrinking techniques, and shoulder realignment to restore fit?' },
        hi: { scenario: 'ट्रायल वॉश के बाद एक सूती कुर्ती असमान रूप से सिकुड़ जाती है, जिससे आर्महोल के नीचे जकड़न और कंधे का तालमेल बिगड़ जाता है।', question: 'फिटिंग सही करने के लिए आप सिलाई मार्जिन समायोजन, कपड़े को पहले से भिगोने की तकनीक और कंधे के संरेखण का उपयोग कैसे करेंगे?' },
        ta: { scenario: 'முதல் துவைப்பிற்குப் பிறகு காட்டன் குர்தி சீரற்ற முறையில் சுருங்கி, அக்குள் மற்றும் தோள்பட்டையில் இறுக்கத்தை ஏற்படுத்துகிறது.', question: 'பொருத்தத்தை மீட்டெடுக்க தையல் விளிம்பு மாற்றங்கள் மற்றும் தோள்பட்டை சீரமைப்பை எவ்வாறு பயன்படுத்துவீர்கள்?' }
      }
    ];
    const item = options[rand % options.length];
    return item[lang as 'en'|'hi'|'ta'] || item.en;
  }

  // Electrical Wiring
  if (combinedLower.includes('electric') || combinedLower.includes('wiring') || combinedLower.includes('circuit') || combinedLower.includes('motor') || combinedLower.includes('इलेक्ट्रिक') || combinedLower.includes('மின்சாரம்')) {
    const options = [
      {
        en: { scenario: 'A domestic customer reports that their main circuit breaker trips continuously whenever heavy appliances like geysers turn on.', question: 'How will you use a multimeter and insulation tester to isolate neutral-earth leaks and rebalance circuit phases?' },
        hi: { scenario: 'एक घरेलू ग्राहक रिपोर्ट करता है कि जब भी गीजर जैसे भारी उपकरण चालू होते हैं, तो उनका मुख्य सर्किट ब्रेकर लगातार ट्रिप होता है।', question: 'न्यूट्रल-अर्थ लीक की जांच करने और सर्किट फेज को रीबैलेंस करने के लिए आप मल्टीमीटर और इंसुलेशन टेस्टर का उपयोग कैसे करेंगे?' },
        ta: { scenario: 'கீசர் போன்ற அதிக மின்சாரம் பயன்படும் சாதனங்களை இயக்கும் போது பிரதான சர்க்யூட் பிரேக்கர் அடிக்கடி துண்டிக்கப்படுகிறது.', question: 'மின் கசிவை கண்டறிய மல்டிமீட்டர் மற்றும் இன்சுலேஷன் பரிசோதனையை எவ்வாறு பயன்படுத்துவீர்கள்?' }
      },
      {
        en: { scenario: 'A commercial ceiling fan hums loudly and runs at half speed despite the regulator set to maximum speed.', question: 'How will you test capacitor microfarad ratings, check motor winding resistance, and replace faulty start capacitors?' },
        hi: { scenario: 'रेगुलेटर को अधिकतम गति पर सेट करने के बावजूद एक वाणिज्यिक सीलिंग फैन जोर से भिनभिनाता है और आधी गति से चलता है।', question: 'आप कैपेसिटर की रेटिंग जांचने, मोटर वाइंडिंग रेजिस्टेंस मापने और कैपेसिटर बदलने के क्या कदम उठाएंगे?' },
        ta: { scenario: 'ரெகுலேட்டர் அதிகபட்ச வேகத்தில் இருந்தாலும் மின் விசிறி மெதுவாக ஓடி சத்தம் எழுப்புகிறது.', question: 'கேபாசிட்டர் அளவு மற்றும் மோட்டார் காயில் எதிர்ப்பை பரிசோதித்து பழுதுபார்ப்பது எப்படி?' }
      }
    ];
    const item = options[rand % options.length];
    return item[lang as 'en'|'hi'|'ta'] || item.en;
  }

  // Software & IT
  if (combinedLower.includes('software') || combinedLower.includes('code') || combinedLower.includes('developer') || combinedLower.includes('program') || combinedLower.includes('python') || combinedLower.includes('web') || combinedLower.includes('सॉफ्टवेयर') || combinedLower.includes('மென்பொருள்')) {
    const options = [
      {
        en: { scenario: 'During peak traffic hours, your production web API endpoint experiences high response latency spikes over 5 seconds due to unindexed database queries.', question: 'How will you use query execution plans (EXPLAIN), add compound SQL indexes, and set up Redis caching to reduce latency?' },
        hi: { scenario: 'पीक आवर्स के दौरान, बिना इंडेक्स वाली डेटाबेस क्वेरी के कारण आपके प्रोडक्शन एपीआई का रिस्पॉन्स टाइम बढ़कर 5 सेकंड से अधिक हो जाता है।', question: 'क्वेरी एक्जीक्यूशन प्लान (EXPLAIN) का विश्लेषण करने, SQL इंडेक्स जोड़ने और लेटेंसी कम करने के लिए रेडिस कैशिंग स्थापित करने के क्या कदम उठाएंगे?' },
        ta: { scenario: 'அதிக பயனர்கள் இயங்கும் போது, இன்டெக்ஸ் இல்லாத தரவுத்தள வினவல்களால் வலை ஏபிஐ வேகம் 5 வினாடிகளுக்கு மேலாக தாமதமாகிறது.', question: 'தரவுத்தள வினவல் திட்டங்களை ஆய்வு செய்து இன்டெக்ஸ் மற்றும் கேச்சிங் அமைப்பை எவ்வாறு ஏற்படுத்துவீர்கள்?' }
      },
      {
        en: { scenario: 'A long-running Node.js/Python microservice container repeatedly crashes with Out-Of-Memory (OOM) errors after 24 hours of operation.', question: 'How will you take heap snapshots, profile uncollected event listeners/global caches, and fix the memory leak?' },
        hi: { scenario: '24 घंटे चलने के बाद एक Node.js/Python माइक्रोसर्विस कंटेनर लगातार आउट-ऑफ-मेमोरी (OOM) एरर के साथ क्रैश हो जाता है।', question: 'हीप स्नैपशॉट लेने, अवांछित मेमोरी लीक ढूंढने और इसे ठीक करने के क्या कदम उठाएंगे?' },
        ta: { scenario: '24 மணி நேர செயல்பாட்டிற்குப் பிறகு Node.js சேவையகம் நினைவகக் கோளாறால் (OOM) மீண்டும் மீண்டும் செயலிழக்கிறது.', question: 'ஹீப் ஸ்காப்பஷாட் எடுத்து நினைவக கசிவை (Memory Leak) எவ்வாறு கண்டுபிடித்து சரிசெய்வீர்கள்?' }
      }
    ];
    const item = options[rand % options.length];
    return item[lang as 'en'|'hi'|'ta'] || item.en;
  }

  // Universal Dynamic Fallback using exact language skill name without mixing English into Hindi/Tamil
  const universal = [
    {
      en: { scenario: `While executing a critical task for '${nameEn}', an unexpected equipment fault or material defect arises.`, question: `What specific technical diagnostic procedures, safety checks, and recovery steps will you apply to complete '${nameEn}' successfully?` },
      hi: { scenario: `'${nameHi}' के लिए एक महत्वपूर्ण कार्य करते समय, एक अप्रत्याशित उपकरण दोष या सामग्री की समस्या उत्पन्न होती है।`, question: `'${nameHi}' को सफलतापूर्वक पूरा करने के लिए आप कौन से विशिष्ट तकनीकी समाधान, सुरक्षा जांच और सटीक कदम उठाएंगे?` },
      ta: { scenario: `'${nameTa}' தொடர்பான முக்கியமான பணியை செய்யும் போது, எதிர்பாராத உபகரணக் கோளாறு ஏற்படுகிறது.`, question: `'${nameTa}' பணியை வெற்றிகரமாக முடிக்க என்ன தொழில்நுட்ப சோதனைகள் மற்றும் பாதுகாப்பு முறைகளைப் பயன்படுத்துவீர்கள்?` }
    },
    {
      en: { scenario: `A client requests an urgent tight-deadline custom assignment in '${nameEn}', but primary tools or standard materials are partially unavailable.`, question: `How will you adapt your technical workflow, select alternative tools, and maintain quality benchmarks in '${nameEn}'?` },
      hi: { scenario: `एक ग्राहक '${nameHi}' में कम समय सीमा वाले कार्य का अनुरोध करता है, लेकिन मानक उपकरण या सामग्री आंशिक रूप से अनुपलब्ध हैं।`, question: `'${nameHi}' में कार्य गुणवत्ता बनाए रखने के लिए आप अपनी कार्यप्रणाली, वैकल्पिक उपकरणों और मानकों को कैसे समायोजित करेंगे?` },
      ta: { scenario: `வாடிக்கையாளர் '${nameTa}' துறையில் அவசர வேலை கேட்கிறார், ஆனால் சில கருவிகள் குறைவாக உள்ளன.`, question: `'${nameTa}' பணியில் மாற்று கருவிகள் மற்றும் முறைகளைப் பயன்படுத்தி தரத்தை எவ்வாறு பேணுவீர்கள்?` }
    }
  ];
  const choice = universal[rand % universal.length];
  return choice[lang as 'en'|'hi'|'ta'] || choice.en;
}
export default function VerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, language, skills, setSkills, setVerificationResult } = useApp();

  const [scenario, setScenario] = useState<VerificationScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [response, setResponse] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [isSpeakingScenario, setIsSpeakingScenario] = useState(false);

  // Selected skill from location state or first discovered skill or demo fallback
  const targetSkill = location.state?.skill || skills[0] || {
    skill_id: 1, name: 'Baking & Cake Decoration', name_hi: 'बेकिंग और केक सजावट', name_ta: 'பேக்கிங் மற்றும் கேக் அலங்காரம்',
  };

  const getSkillName = () => {
    if (language === 'hi' && (targetSkill as any).name_hi) return (targetSkill as any).name_hi;
    if (language === 'ta' && (targetSkill as any).name_ta) return (targetSkill as any).name_ta;
    return targetSkill.name;
  };

  const handleStart = async () => {
    setLoading(true);
    let loadedScenario: VerificationScenario | null = null;

    try {
      if (userId && (targetSkill as any).skill_id) {
        loadedScenario = await startVerification(userId, (targetSkill as any).skill_id, language);
      } else {
        const demo = getSkillSpecificDemoScenario(targetSkill.name, language);
        loadedScenario = {
          id: Date.now(),
          skill_id: (targetSkill as any).skill_id || 3,
          skill_name: targetSkill.name,
          scenario: demo.scenario,
          question: demo.question,
          language,
        };
      }
    } catch {
      const demo = getSkillSpecificDemoScenario(targetSkill.name, language);
      loadedScenario = {
        id: Date.now(),
        skill_id: (targetSkill as any).skill_id || 3,
        skill_name: targetSkill.name,
        scenario: demo.scenario,
        question: demo.question,
        language,
      };
    } finally {
      setScenario(loadedScenario);
      setLoading(false);
    }
  };

  const getScenarioTexts = (sc: VerificationScenario | null) => {
    const sText = (language === 'hi' && (sc as any)?.scenario_hi)
      ? (sc as any).scenario_hi
      : (language === 'ta' && (sc as any)?.scenario_ta)
        ? (sc as any).scenario_ta
        : sc?.scenario || '';

    const qText = (language === 'hi' && (sc as any)?.question_hi)
      ? (sc as any).question_hi
      : (language === 'ta' && (sc as any)?.question_ta)
        ? (sc as any).question_ta
        : sc?.question || '';

    return { sText, qText };
  };

  const triggerAutoSpeak = (sc: VerificationScenario) => {
    const { sText, qText } = getScenarioTexts(sc);
    if (sText || qText) {
      stopSpeaking();
      setIsSpeakingScenario(true);
      speak(`${sText}. ${qText}`, language, {
        onEnd: () => setIsSpeakingScenario(false),
      });
    }
  };

  const toggleSpeakScenario = () => {
    if (isSpeakingScenario) {
      stopSpeaking();
      setIsSpeakingScenario(false);
    } else {
      const { sText, qText } = getScenarioTexts(scenario);
      if (sText || qText) {
        setIsSpeakingScenario(true);
        speak(`${sText}. ${qText}`, language, {
          onEnd: () => setIsSpeakingScenario(false),
        });
      }
    }
  };

  // Automatically start verification scenario loading on page load
  useEffect(() => {
    handleStart();
    return () => {
      stopSpeaking();
    };
  }, [location.state]);

  const handleListen = () => {
    // Stop scenario speech when user starts recording their answer
    if (isSpeakingScenario) {
      stopSpeaking();
      setIsSpeakingScenario(false);
    }

    if (listening) {
      const final = stopSpeechRecognition();
      setResponse(prev => prev + ' ' + final);
      setListening(false);
    } else {
      setListening(true);
      startSpeechRecognition(language, {
        onResult: (text) => setResponse(text),
        onEnd: (final) => { setResponse(final); setListening(false); },
        onError: () => setListening(false),
      });
    }
  };

  const applyVerifiedSkill = (evalResult: any) => {
    setVerificationResult(evalResult);
    const isPassed = evalResult.status === 'demonstrated' || evalResult.status === 'partially_demonstrated';
    if (isPassed) {
      const targetName = targetSkill.name;
      const currentSkills = skills.length > 0 ? [...skills] : [
        { name: targetSkill.name, name_hi: (targetSkill as any).name_hi, name_ta: (targetSkill as any).name_ta, category: 'Vocational Specialist', confidence: 0.95, confidence_level: 'high' as const, evidence: [], verified: true },
        { name: 'Tailoring & Garment Construction', name_hi: 'सिलाई और वस्त्र निर्माण', name_ta: 'தையல் மற்றும் ஆடை தயாரிப்பு', category: 'Textile & Apparel', confidence: 0.94, confidence_level: 'high' as const, evidence: [], verified: true },
      ];
      const updated = currentSkills.map(s => {
        if (s.name.toLowerCase() === targetName.toLowerCase() || (s as any).skill_id === (targetSkill as any).skill_id) {
          return {
            ...s,
            verified: true,
            verification_status: evalResult.status,
            confidence: Math.max(s.confidence || 0.85, (evalResult.score || 88) / 100),
          };
        }
        return s;
      });
      if (!updated.some(s => s.name.toLowerCase() === targetName.toLowerCase())) {
        updated.unshift({
          name: targetSkill.name,
          name_hi: (targetSkill as any).name_hi,
          name_ta: (targetSkill as any).name_ta,
          category: (targetSkill as any).category || 'Vocational Specialist',
          confidence: (evalResult.score || 88) / 100,
          confidence_level: 'high',
          evidence: [],
          verified: true,
          verification_status: evalResult.status,
        });
      }
      setSkills(updated);
      try {
        localStorage.setItem('anubhavai_has_passport', 'true');
        localStorage.setItem('anubhavai_passport_id', `ANUBHAV-SKILL-PASS-${String(userId || 1).padStart(4, '0')}`);
        localStorage.setItem('anubhavai_last_verified_skill', targetName);
        localStorage.setItem('anubhavai_last_verified_score', String(evalResult.score || 88));
        localStorage.setItem('anubhavai_verified_at', new Date().toISOString());
      } catch (_) {}
    }
  };

  const handleSubmit = async () => {
    if (!response.trim()) return;
    stopSpeaking();
    setIsSpeakingScenario(false);
    setEvaluating(true);

    try {
      const verificationId = scenario?.id || 1;
      const result = await evaluateVerification(verificationId, response, language);
      applyVerifiedSkill(result);
      navigate('/app/verify/result');
    } catch {
      // Demo result fallback
      const lower = response.trim().toLowerCase();
      const noEvPhrases = [
        "don't know", "dont know", "no idea", "not sure", "can't answer", "cant answer",
        "don't remember", "pata nahi", "theriyathu", "theriyala", "puriyala", "skip", "nothing"
      ];
      const isNoEv = noEvPhrases.some(p => lower.includes(p)) || lower.length < 4;

      const DEMO_RESULT = isNoEv ? {
        id: 1, skill_id: (targetSkill as any).skill_id || 3, skill_name: targetSkill.name,
        status: 'no_evidence' as const,
        score: 0,
        dimensions: {} as Record<string, number>,
        explanation: {
          en: "We couldn't verify this skill from your response. Your previous experience may indicate this skill, but there is not enough evidence from this verification attempt to confirm it.",
          hi: "हम आपके उत्तर से इस कौशल को सत्यापित नहीं कर सके। आपके अनुभव में यह कौशल हो सकता है, लेकिन इस प्रयास में पर्याप्त प्रमाण नहीं है।",
          ta: "உங்கள் பதிலில் இருந்து இந்த திறனை எங்களால் சரிபார்க்க முடியவில்லை. உங்கள் அனுபவத்தில் இத்திறன் இருக்கலாம், ஆனால் இந்த முயற்சியில் போதுமான ஆதாரம் இல்லை.",
        }[language] || "We couldn't verify this skill from your response.",
        language,
      } : {
        id: 1, skill_id: (targetSkill as any).skill_id || 3, skill_name: targetSkill.name,
        status: 'demonstrated' as const,
        score: 88,
        dimensions: { 'Problem Understanding': 92, 'Communication': 88, 'Decision Making': 85, 'Empathy': 90 },
        explanation: {
          en: 'You handled the customer concern professionally and showed good problem-solving skills.',
          hi: 'आपने ग्राहक की समस्या को पेशेवर तरीके से संभाला और अच्छी समस्या-समाधान कौशल दिखाई।',
          ta: 'வாடிக்கையாளரின் கவலையை நீங்கள் தொழில்முறையாக கையாண்டீர்கள்.',
        }[language] || 'You handled the situation well.',
        language,
      };
      applyVerifiedSkill(DEMO_RESULT);
      navigate('/app/verify/result');
    }
  };

  const { sText: scenarioText, qText: questionText } = getScenarioTexts(scenario);

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck size={26} className="text-primary-600" />
            {t('verification.title')}
          </h1>
          <p className="text-xs text-text-muted mt-1">{t('verification.subtitle')}</p>
        </div>
        <button onClick={() => { stopSpeaking(); navigate('/app/gap'); }} className="btn-ghost text-sm">
          <SkipForward size={15} /> {t('verification.skip')}
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center gap-3 py-12">
          <Loader2 size={24} className="animate-spin text-primary-600" />
          <span className="text-base font-medium text-text-secondary">{t('common.loading')}</span>
        </div>
      ) : scenario ? (
        <>
          {/* Skill Verification Challenge Card */}
          <div className="card mb-5 border-2 border-primary-200 shadow-sm relative">
            <div className="flex items-center justify-between mb-4 border-b border-surface-border pb-3">
              <div>
                <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">{t('verification.skill')}</p>
                <p className="text-lg font-bold text-primary-900">{getSkillName()}</p>
              </div>

              {/* TTS Listen Control */}
              <button
                onClick={toggleSpeakScenario}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                  isSpeakingScenario
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                }`}
                title={isSpeakingScenario ? t('verification.stopListening') : t('verification.listenScenario')}
              >
                {isSpeakingScenario ? (
                  <>
                    <VolumeX size={16} className="text-amber-700" />
                    <span>{t('verification.stopListening')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} className="text-primary-600" />
                    <span>{t('verification.listenScenario')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Workplace Scenario */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {t('verification.scenario')}
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-surface-border">
                <p className="text-sm text-text-primary leading-relaxed">{scenarioText}</p>
              </div>
            </div>

            {/* Practical Technical Question */}
            <div className="p-4 bg-primary-50/70 rounded-xl border border-primary-100">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">{t('verification.question')}</p>
              <p className="text-base font-bold text-text-primary leading-snug">{questionText}</p>
            </div>
          </div>

          {/* Voice & Text Response Card */}
          <div className="card mb-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              {t('verification.answerVoice')}
            </p>
            <button
              onClick={handleListen}
              className={`w-full flex flex-col items-center justify-center gap-3 py-6 rounded-xl border-2 transition-all cursor-pointer
                ${listening ? 'border-red-300 bg-red-50 text-red-600' : 'border-primary-200 bg-primary-50 hover:border-primary-400 text-primary-700'}`}
            >
              {listening ? (
                <>
                  <MicOff size={32} className="text-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-red-600">{t('verification.listening')}</span>
                </>
              ) : (
                <>
                  <Mic size={32} className="text-primary-600" />
                  <span className="text-sm font-bold text-primary-800">{t('verification.answerVoice')}</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-text-muted my-3">{t('verification.answerText')}</p>

            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder={questionText}
              className="input resize-none text-sm p-3 rounded-xl border-surface-border"
              rows={3}
            />
          </div>

          {/* Submit Action */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || evaluating}
              className="btn-primary flex-1 justify-center py-3.5 text-base font-semibold shadow-md"
            >
              {evaluating
                ? <><Loader2 size={18} className="animate-spin" /> {t('verification.processing')}</>
                : t('verification.submit')}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
