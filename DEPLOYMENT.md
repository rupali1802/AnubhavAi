# 🚀 AnubhavAI — Complete Production Deployment Guide

This guide covers how to deploy **AnubhavAI** fully to the cloud so that anyone in the world can access it.

---

## 🌟 Recommended: Option 1 — Render 1-Click Blueprint (Free Tier)

We have configured a `render.yaml` Blueprint in the repository. Render will automatically provision:
1. **Backend Web Service** (`anubhavai-backend`): FastAPI on Python 3.11 with automatic restart and `/health` monitoring.
2. **Frontend Static Site** (`anubhavai-frontend`): High-speed CDN serving the React 19 + Vite app with full SPA routing.
3. **Managed PostgreSQL Database** (`anubhavai-db`): Auto-creates tables and automatically seeds skills, trade categories, and government schemes on first boot.

### Step 1: Push the latest code to GitHub

Run these commands in your project terminal:

```bash
git add .
git commit -m "Configure full-stack cloud deployment (Render, Docker, Vercel)"
git push origin main
```

---

### Step 2: Create a Blueprint Instance on Render

1. Open [render.com](https://render.com) and log in (sign up free with GitHub if you haven't already).
2. Click the blue **"New +"** button in the top navigation bar.
3. Select **"Blueprint"**.
4. Connect your GitHub repository: `rupali1802/AnubhavAi`.
5. Render will automatically read [`render.yaml`](render.yaml) and display the three resources it will create:
   - `anubhavai-backend` (Web Service)
   - `anubhavai-frontend` (Static Site)
   - `anubhavai-db` (PostgreSQL Database)
6. Under **Environment Variables**, you will be prompted for:
   - `OPENAI_API_KEY`: Paste your OpenAI API key (`sk-proj-...`).
7. Click **"Apply"**.

---

### Step 3: Wait for Build & Verify

Render will now build and deploy both services in parallel (~3–5 minutes):

- **Backend URL:** `https://anubhavai-backend.onrender.com`
  - Health check: `https://anubhavai-backend.onrender.com/health` (should return `{"status":"ok"}`)
  - Swagger Docs: `https://anubhavai-backend.onrender.com/docs`
- **Frontend URL:** `https://anubhavai-frontend.onrender.com`
  - Open in any mobile or desktop browser.
  - Test voice recognition, skill extraction, scenario quizzes, and the recruiter portal!

---

## ⚡ Option 2 — Frontend on Vercel + Backend on Render

If you prefer Vercel for the React frontend:

### Deploy Backend to Render
1. Follow Step 2 above (or create a Web Service pointing to `backend/` directory).
2. Copy your live backend URL (e.g., `https://anubhavai-backend.onrender.com`).

### Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New..."** &rarr; **"Project"**.
2. Select `rupali1802/AnubhavAi`.
3. In the project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** Click "Edit" and select `frontend`
   - **Environment Variables:**
     - Key: `VITE_API_URL`
     - Value: `https://anubhavai-backend.onrender.com` (your live backend URL)
4. Click **"Deploy"**.
   - The [`frontend/vercel.json`](frontend/vercel.json) file will automatically handle client-side routing rewrites (`/story`, `/skills`, `/verification`, `/recruiter`, `/admin`).

---

## 🐳 Option 3 — Unified Docker / VPS / Cloud Container

You can deploy the entire application (both Frontend + Backend + Database) as a single container or via Docker Compose on any VPS (AWS EC2, DigitalOcean, Hetzner, Railway, Fly.io).

### 1-Command Deployment with Docker Compose

```bash
# Clone the repository on your server
git clone https://github.com/rupali1802/AnubhavAi.git
cd AnubhavAi

# Create environment file with your OpenAI key
echo "OPENAI_API_KEY=sk-your-openai-api-key" > .env

# Start services
docker compose up -d --build
```

- Your full-stack application will be live at `http://YOUR_SERVER_IP:8000`.
- Fast, containerized, includes PostgreSQL with automated health checks and persistent storage volumes.

---

## 📋 Production Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `OPENAI_API_KEY` | **Yes** | OpenAI API key for real-time skill extraction & voice scenarios | `sk-proj-...` |
| `OPENAI_MODEL` | No | OpenAI model name (defaults to `gpt-4o-mini`) | `gpt-4o-mini` |
| `DATABASE_URL` | No | PostgreSQL / MySQL connection string (falls back to SQLite if unset) | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | No | JWT secret key for admin authentication | Random 32+ char string |
| `FRONTEND_URL` | No | Allowed frontend origin for CORS (auto-handled on Render) | `https://anubhavai-frontend.onrender.com` |
| `ADMIN_USERNAME` | No | Admin username (default: `admin`) | `admin` |
| `ADMIN_PASSWORD` | No | Admin password (default: `anubhav2024`) | `your_secure_password` |

---

## 🛡️ Key Production Features Built-in

- **Automated Database Seeding:** The backend automatically checks if the database is fresh on startup and seeds all 22+ trade categories, 50+ trade skills, and Indian government schemes (PM-AJAY, PM-FME, MUDRA).
- **Graceful Fallbacks:** If the primary database is momentarily unreachable, the application falls back to an embedded SQLite engine without crashing.
- **Multilingual Support:** Full client & server support for Hindi (`hi`), Tamil (`ta`), and English (`en`), including code-switched Hinglish and Tanglish.
- **Zero CORS Blockers:** Production regex CORS allows secure communication between the custom or assigned frontend domain and the API.
