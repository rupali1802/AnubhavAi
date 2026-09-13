# AnubhavAI (अनुभव AI / அனுபவ் AI)

<p align="center">
  <strong><em>"Your Experience Has Skills — Empowering Vernacular Informal Workers"</em></strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646C9F?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 🌟 Overview

Millions of skilled informal and blue-collar workers across India (mechanics, tailors, cooks, carpenters, electricians, artisans) lack formal resumes, technical jargon, or credentials. Traditional job portals fail them because they require resume uploads and structured profile forms.

**AnubhavAI** is a voice-first, multilingual platform that enables informal workers to simply **speak their story in their native language** (Hindi, Tamil, English, or code-switched Hinglish/Tanglish). Using AI, AnubhavAI extracts implicit skills, verifies competencies through real-world voice scenarios, matches workers to district-level government schemes and jobs (e.g., PM-AJAY, PM-FME, MUDRA), and issues an evidence-backed **Skill Passport**.

---

## 🚀 Key Features

### 🎙️ 1. Voice-First Spoken Account
- **Natural speech input** using the browser Web Speech API (`hi-IN`, `ta-IN`, `en-IN`).
- No forms, no resume requirements, and support for low-bandwidth environments.
- **Code-switching support**: Handles mixed-language speech (Hinglish / Tanglish) seamlessly.

### 🧠 2. Indirect Skill Extraction & AI Engine
- Powered by **OpenAI GPT-4o-mini** with structured JSON output and a deterministic **Vernacular NLP heuristic engine** for offline fallback.
- Unpacks informal phrasing into verified trade competencies (e.g., *"I fix bikes and talk to suppliers"* &rarr; Mechanical Diagnostics, Customer Handling, Inventory Management).
- Extracts confidence levels, trade categories, and direct evidence quotes from spoken transcripts.

### 📊 3. Interactive Skill Graph & Live Highlighting
- Live real-time transcript streaming with highlighted keywords.
- Dynamic interactive **Skill Graph** built with ReactFlow visualizing how life experiences connect to trade capabilities and growth pathways.

### 🛡️ 4. Voice Scenario-Based Skill Verification
- Interactive voice quiz scenarios that present realistic workplace dilemmas.
- Evaluates candidate problem solving, decision making, communication, and domain knowledge.
- Clear distinction between **Inferred Skills** (from spoken narrative) and **Demonstrated Skills** (verified through scenario challenges).

### 🎯 5. District-Level Opportunity & Scheme Matching
- Vector match scoring against real Indian government welfare schemes and skilling programs (PM-AJAY, PM-FME, MUDRA, Self-Help Groups).
- **Read Aloud TTS**: Narrates scheme benefits and grounded justification in the user's native tongue.
- Interactive district map covering major centers (Chennai, Coimbatore, Madurai, Trichy, Salem, etc.).

### 🪪 6. Verifiable Skill Passport & Recruiter Portal
- **Digital Skill Passport**: Evidence-backed, shareable, printable profile showcasing verified skills, voice bio, and career pathways.
- **MSME Recruiter Portal (`/recruiter`)**: Allows employers to search candidates by district, listen to native voice bio pitches, and trigger WhatsApp notifications and direct calls.

---

## 🏗️ System Architecture

```
                       ┌───────────────────────────────┐
                       │       Browser Client          │
                       │   (React 19 + Vite + TS)      │
                       └───────────────┬───────────────┘
                                       │
                      HTTP / REST API  │  Web Speech API
                                       ▼
                       ┌───────────────────────────────┐
                       │      FastAPI Backend API      │
                       │          (Port 8000)          │
                       └───────────────┬───────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ OpenAI GPT-4o-mini│        │ Vernacular NLP   │         │ SQLAlchemy ORM   │
│ & SHAP Explainer │         │ Fallback Engine  │         │ (MySQL / SQLite) │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

## 📂 Repository Structure

```
vekohack/
├── backend/
│   ├── app/
│   │   ├── ai/               # GPT-4o extractor, demo datasets, SHAP explainers
│   │   ├── api/              # Endpoints: users, experiences, verification, opportunities, admin
│   │   ├── core/             # Configuration, settings, JWT security
│   │   ├── db/               # SQLAlchemy engine, session, migrations
│   │   ├── models/           # User, Experience, Skill, Verification, Opportunity models
│   │   ├── repositories/     # Database CRUD access layer
│   │   ├── schemas/          # Pydantic schemas (request/response validation)
│   │   ├── services/         # Business logic services
│   │   └── main.py           # FastAPI entrypoint & middleware
│   ├── seed/                 # Seed data scripts
│   ├── tests/                # Pytest suites
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Sample environment config
│   └── create_db.py          # Database initialization helper
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API client & endpoint helpers
│   │   ├── assets/           # Illustrations and logos
│   │   ├── components/       # Layouts, VoiceBuddy, UI widgets
│   │   ├── hooks/            # App state & context hooks
│   │   ├── i18n/             # Multilingual translations (en, hi, ta)
│   │   ├── pages/            # Landing, Dashboard, Story, Skills, Verification, Recruiter, Admin
│   │   ├── services/         # Voice synthesis & speech recognition
│   │   ├── types/            # TypeScript data models
│   │   ├── App.tsx           # Router & page routes
│   │   └── main.tsx          # Application entrypoint
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.ts        # Vite configuration
├── ANUBHAVAI_Presentation_Deck.pdf # Project presentation deck
├── generate_presentation_pdf.py    # Deck generator script
├── .gitignore                # Git exclusions (secrets, builds, node_modules)
└── README.md                 # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v18 or higher) and `npm`
- **Python** (v3.11 or higher)
- **MySQL 8.0+** *(optional; automatically falls back to zero-config SQLite if MySQL is not running)*

---

### 1. Backend Setup

```powershell
# 1. Navigate to backend directory
cd backend

# 2. (Optional) Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Copy .env.example to .env and adjust variables (OpenAI Key, MySQL credentials, etc.)
copy .env.example .env

# 5. Start the FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2. Frontend Setup

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Variables

Create a `backend/.env` file with the following configuration:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `AnubhavAI` | Application title |
| `DEBUG` | `True` | Debug mode |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS frontend origin |
| `MYSQL_HOST` | `localhost` | MySQL host (falls back to SQLite if unreachable) |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_DATABASE` | `anubhavai` | Database name |
| `MYSQL_USER` | `root` | Database username |
| `MYSQL_PASSWORD` | `your_password` | Database password |
| `OPENAI_API_KEY` | `sk-...` | OpenAI key for live LLM extraction & questions |
| `OPENAI_MODEL` | `gpt-4o-mini` | LLM model name |
| `ADMIN_USERNAME` | `admin` | Admin dashboard login username |
| `ADMIN_PASSWORD` | `anubhav2024` | Admin dashboard login password |

---

## 🧪 Testing

To run the backend test suite:

```powershell
cd backend
pytest -v
```

To build and check frontend types:

```powershell
cd frontend
npm run build
```

---

## 👥 Authors & Acknowledgments

Built with ❤️ for **VekoHack / VoicePath Challenge** to empower vernacular informal workers and build an inclusive, skilled, and empowered workforce.
