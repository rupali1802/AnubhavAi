import type { ExtractedSkill, VerificationResult, Language } from '../types';

export interface SkillMatchedJob {
  id: string;
  title: string;
  title_hi: string;
  title_ta: string;
  company: string;
  location: string;
  location_hi: string;
  location_ta: string;
  wage: string;
  wage_hi: string;
  wage_ta: string;
  matchedSkill: string;
  description: string;
  description_hi: string;
  description_ta: string;
  score: number;
}

const ALL_JOBS: SkillMatchedJob[] = [
  {
    id: 'job-food-1',
    title: 'Food Production & Hygiene Supervisor',
    title_hi: 'खाद्य उत्पादन और स्वच्छता पर्यवेक्षक',
    title_ta: 'உணவு உற்பத்தி & சுகாதார மேற்பார்வையாளர்',
    company: 'Annam Foods Ltd.',
    location: 'Guindy Industrial Estate, Chennai',
    location_hi: 'गिंडी इंडस्ट्रियल एस्टेट, चेन्नई',
    location_ta: 'கிண்டி தொழிற்பேட்டை, சென்னை',
    wage: '₹850 / day',
    wage_hi: '₹850 / प्रति दिन',
    wage_ta: '₹850 / நாள்',
    matchedSkill: 'Food Production & Hygiene',
    description: 'Inspect food packaging, raw material quality, and enforce safety hygiene standards.',
    description_hi: 'खाद्य पैकेजिंग, कच्चे माल की गुणवत्ता का निरीक्षण करें और सुरक्षा स्वच्छता मानकों को लागू करें।',
    description_ta: 'உணவு பேக்கேஜிங் மற்றும் தரக்கட்டுப்பாட்டை மேற்பார்வையிடுதல்.',
    score: 95,
  },
  {
    id: 'job-cust-1',
    title: 'Sales & Customer Relations Specialist',
    title_hi: 'बिक्री और ग्राहक संबंध विशेषज्ञ',
    title_ta: 'விற்பனை மற்றும் வாடிக்கையாளர் சேவை நிபுணர்',
    company: 'Retail Basket Stores',
    location: 'Anna Nagar, Chennai',
    location_hi: 'अन्ना नगर, चेन्नई',
    location_ta: 'அண்ணா நகர், சென்னை',
    wage: '₹800 / day',
    wage_hi: '₹800 / प्रति दिन',
    wage_ta: '₹800 / நாள்',
    matchedSkill: 'Customer Handling',
    description: 'Manage retail counters, address customer inquiries, and coordinate product restocking.',
    description_hi: 'खुदरा काउंटरों को संभालें, ग्राहकों के प्रश्नों का समाधान करें और स्टॉक रीस्टॉकिंग समन्वय करें।',
    description_ta: 'சில்லறை கடை கவுண்டர்கள் மேலாண்மை மற்றும் வாடிக்கையாளர் சேவை.',
    score: 92,
  },
  {
    id: 'job-mech-1',
    title: 'Two-Wheeler Mechanic & Engine Specialist',
    title_hi: 'दुपहिया वाहन मैकेनिक और इंजन विशेषज्ञ',
    title_ta: 'இருசக்கர வாகன மெக்கானிக் & இன்ஜின் நிபுணர்',
    company: 'Kovai Speed Motors',
    location: 'Gandhipuram, Coimbatore',
    location_hi: 'गांधीपुरम, कोयंबटूर',
    location_ta: 'காந்திபுரம், கோயம்புத்தூர்',
    wage: '₹950 / day',
    wage_hi: '₹950 / प्रति दिन',
    wage_ta: '₹950 / நாள்',
    matchedSkill: 'Mechanical Repair',
    description: 'Engine overhaul, clutch servicing, spare parts replacement, and diagnostic repair.',
    description_hi: 'इंजन ओवरहाल, क्लच सर्विसिंग, स्पेयर पार्ट्स रिप्लेसमेंट और डायग्नोस्टिक मरम्मत।',
    description_ta: 'இன்ஜின் பழுதுபார்ப்பு மற்றும் இருசக்கர வாகன மெக்கானிக் பணி.',
    score: 94,
  },
  {
    id: 'job-store-1',
    title: 'Store Management & Billing Assistant',
    title_hi: 'स्टोर प्रबंधन और बिलिंग सहायक',
    title_ta: 'ஸ்டோர் மேலாண்மை & பில்லிங் உதவி',
    company: 'Fresh Mart Supermarket',
    location: 'Madurai Main Road',
    location_hi: 'मदुरै मेन रोड',
    location_ta: 'மதுரை மெயின் ரோடு',
    wage: '₹750 / day',
    wage_hi: '₹750 / प्रति दिन',
    wage_ta: '₹750 / நாள்',
    matchedSkill: 'Store Management & Billing',
    description: 'Inventory stock count tracking, cash counter billing, and supplier receiving.',
    description_hi: 'इन्वेंट्री स्टॉक ट्रैकिंग, कैश काउंटर बिलिंग और आपूर्तिकर्ता रसीद।',
    description_ta: 'சரக்கு மேலாண்மை மற்றும் ரொக்கப் பில்லிங் பணி.',
    score: 87,
  },
  {
    id: 'job-scheme-1',
    title: 'PM-AJAY Skilling & Business Toolkit Support Grant',
    title_hi: 'पीएम-अजय कौशल विकास एवं टूलकिट सहायता अनुदान',
    title_ta: 'பிஎம்-அஜய் திறன் மேம்பாடு & கருவித்தொகுப்பு மானியம்',
    company: 'Ministry of Social Justice & Empowerment',
    location: 'District MSME Center',
    location_hi: 'जिला एमएसएमई केंद्र',
    location_ta: 'மாவட்ட குறுந்தொழில் மையம்',
    wage: 'Up to ₹50,000 Grant',
    wage_hi: '₹50,000 तक वित्तीय सहायता',
    wage_ta: '₹50,000 வரை மானியம்',
    matchedSkill: 'General Verified Skill',
    description: 'Free skill certification, toolkit stipend, and direct credit linkage for informal workers.',
    description_hi: 'मुफ्त कौशल प्रमाणन, टूलकिट वजीफा और अनौपचारिक श्रमिकों के लिए प्रत्यक्ष क्रेडिट लिंकेज।',
    description_ta: 'இலவச திறன் சான்றிதழ், கருவித்தொகுப்பு உதவித்தொகை மற்றும் நிதி உதவி.',
    score: 96,
  },
];

export const getMatchedJobsForUser = (
  skills: ExtractedSkill[],
  verificationResult: VerificationResult | null
): SkillMatchedJob[] => {
  const userSkillNames = new Set<string>();

  if (verificationResult?.skill_name) {
    userSkillNames.add(verificationResult.skill_name.toLowerCase());
  }

  skills.forEach((s) => {
    if (s.name) userSkillNames.add(s.name.toLowerCase());
  });

  if (userSkillNames.size === 0) {
    return [ALL_JOBS[0], ALL_JOBS[1], ALL_JOBS[4]];
  }

  const matched = ALL_JOBS.filter((job) => {
    const jobSkill = job.matchedSkill.toLowerCase();
    for (const userSkill of userSkillNames) {
      if (
        jobSkill.includes(userSkill) ||
        userSkill.includes(jobSkill) ||
        (userSkill.includes('food') && jobSkill.includes('food')) ||
        (userSkill.includes('customer') && jobSkill.includes('customer')) ||
        (userSkill.includes('repair') && jobSkill.includes('repair')) ||
        (userSkill.includes('mechanic') && jobSkill.includes('repair')) ||
        (userSkill.includes('store') && jobSkill.includes('store'))
      ) {
        return true;
      }
    }
    return false;
  });

  if (matched.length === 0) {
    return [ALL_JOBS[0], ALL_JOBS[4]];
  }

  if (!matched.some((m) => m.id === 'job-scheme-1')) {
    matched.push(ALL_JOBS[4]);
  }

  return matched;
};
