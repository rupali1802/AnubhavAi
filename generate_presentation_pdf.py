import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

pdf_path = r"C:\Users\RupaTanu\Desktop\vekohack\ANUBHAVAI_Presentation_Deck.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()

primary_color = colors.HexColor("#312e81")    # Indigo 900
secondary_color = colors.HexColor("#4f46e5")  # Indigo 600
accent_color = colors.HexColor("#0d9488")     # Teal 600
dark_neutral = colors.HexColor("#111827")     # Gray 900
light_bg = colors.HexColor("#faf8f5")         # Warm cream
border_color = colors.HexColor("#e5e7eb")

title_style = ParagraphStyle(
    'CoverTitle', parent=styles['Heading1'],
    fontName='Helvetica-Bold', fontSize=22, leading=26,
    textColor=primary_color, alignment=TA_CENTER
)

tagline_style = ParagraphStyle(
    'CoverTagline', parent=styles['Normal'],
    fontName='Helvetica-Oblique', fontSize=12, leading=15,
    textColor=accent_color, alignment=TA_CENTER
)

h1_style = ParagraphStyle(
    'SectionH1', parent=styles['Heading1'],
    fontName='Helvetica-Bold', fontSize=14, leading=18,
    textColor=primary_color, spaceAfter=6
)

body_style = ParagraphStyle(
    'BodyDark', parent=styles['BodyText'],
    fontName='Helvetica', fontSize=8.5, leading=12,
    textColor=dark_neutral, spaceAfter=4
)

table_header_style = ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=8, leading=10,
    textColor=colors.white, alignment=TA_CENTER
)

table_cell_style = ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontName='Helvetica', fontSize=7.5, leading=10,
    textColor=dark_neutral
)

table_cell_bold = ParagraphStyle(
    'TableCellBold', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=7.5, leading=10,
    textColor=primary_color
)

story = []

# PAGE 1: Title & Problem Statement Compliance
story.append(Spacer(1, 4))
story.append(Paragraph("ANUBHAVAI — VoicePath Solution Deck", title_style))
story.append(Spacer(1, 2))
story.append(Paragraph('"Your Experience Has Skills — Empowering Vernacular Informal Workers"', tagline_style))
story.append(Spacer(1, 4))
story.append(HRFlowable(width="100%", thickness=1.5, color=secondary_color, spaceBefore=2, spaceAfter=6))

story.append(Paragraph("Problem Statement 04 — VoicePath Compliance Matrix", h1_style))

ps_matrix_data = [
    [Paragraph("PS Requirement (04 VoicePath)", table_header_style), Paragraph("ANUBHAVAI Implementation & AI Model", table_header_style), Paragraph("Status", table_header_style)],
    [
        Paragraph("<b>1. Unscripted Spoken Account</b><br/>Natural speech in Indian languages.", table_cell_style),
        Paragraph("<b>Web Speech API Live Voice Recording</b><br/>Real-time capture in English (en-IN), Hindi (hi-IN), or Tamil (ta-IN).", table_cell_style),
        Paragraph("<b>100% PASS</b>", table_cell_bold)
    ],
    [
        Paragraph("<b>2. Indirect Phrasing Skill Extraction</b><br/>'Fixing bikes' -> Mechanical Repair.", table_cell_style),
        Paragraph("<b>GPT-4o-mini + Vernacular NLP Heuristic Engine</b><br/>Parses informal stories into skills, confidence levels & evidence quotes.", table_cell_style),
        Paragraph("<b>100% PASS</b>", table_cell_bold)
    ],
    [
        Paragraph("<b>3. Transcript & Skill Highlighting</b><br/>Live transcript display & skill badges.", table_cell_style),
        Paragraph("<b>Interactive Transcript & Skill Graph</b><br/>Displays full spoken transcript with highlighted key phrases & skill tags.", table_cell_style),
        Paragraph("<b>100% PASS</b>", table_cell_bold)
    ],
    [
        Paragraph("<b>4. Real District-Level Scheme Dataset</b><br/>PM-AJAY & skilling grants matching.", table_cell_style),
        Paragraph("<b>PM-AJAY & PM FME District Engine</b><br/>Vector match scoring against PM-AJAY grants & MUDRA loan datasets.", table_cell_style),
        Paragraph("<b>100% PASS</b>", table_cell_bold)
    ],
    [
        Paragraph("<b>5. Read Back ALOUD + Justification</b><br/>TTS audio narration with spoken reason.", table_cell_style),
        Paragraph("<b>Multilingual SpeechSynthesis TTS</b><br/>Narrows top matches & speaks justification grounded in user's words.", table_cell_style),
        Paragraph("<b>100% PASS</b>", table_cell_bold)
    ],
    [
        Paragraph("<b>6. Stretch Goal (Code-Switching)</b><br/>Mixed Hinglish / Tanglish speech.", table_cell_style),
        Paragraph("<b>Code-Switched Token Parsing</b><br/>Extracts skills from mixed Hindi-English & Tamil-English narratives.", table_cell_style),
        Paragraph("<b>100% PASS</b>", table_cell_bold)
    ]
]
t_ps = Table(ps_matrix_data, colWidths=[140, 330, 70])
t_ps.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), primary_color),
    ('BACKGROUND', (2,1), (2,-1), colors.HexColor("#f0fdf4")),
    ('GRID', (0,0), (-1,-1), 0.5, border_color),
    ('PADDING', (0,0), (-1,-1), 3.5),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('ALIGN', (2,1), (2,-1), 'CENTER'),
]))
story.append(t_ps)

story.append(PageBreak())

# PAGE 2: AI/ML Architecture & Full Tech Stack
story.append(Paragraph("AI / ML Architecture & Model Breakdown", h1_style))

ml_model_data = [
    [Paragraph("AI / ML Component", table_header_style), Paragraph("Model / Technique Used", table_header_style), Paragraph("Role & Responsibilities", table_header_style)],
    [
        Paragraph("<b>Primary Language Model (LLM)</b>", table_cell_bold),
        Paragraph("<b>OpenAI GPT-4o-mini / GPT-4o</b><br/>(Structured JSON Mode, Temp 0.3)", table_cell_style),
        Paragraph("Processes unscripted spoken accounts, performs indirect skill extraction, and generates scenario-based verification questions grounded in candidate experience.", table_cell_style)
    ],
    [
        Paragraph("<b>Vernacular NLP Extraction Engine</b>", table_cell_bold),
        Paragraph("<b>Multilingual Rule-Based NLP Heuristics</b><br/>(20+ Occupation Regex Parsers)", table_cell_style),
        Paragraph("Deterministic offline fallback parsing transcripts across Tailoring, Mechanical Repair, Food Production, Carpentry, Masonry, Agriculture, Electrical & Plumbing.", table_cell_style)
    ],
    [
        Paragraph("<b>Code-Switching NLP Tokenizer</b>", table_cell_bold),
        Paragraph("<b>Vernacular Code-Switch Token Parser</b><br/>(Hinglish & Tanglish Rules)", table_cell_style),
        Paragraph("Handles mixed language narratives (e.g. Hindi+English or Tamil+English) without losing skill context or evidence quotes.", table_cell_style)
    ],
    [
        Paragraph("<b>Speech Recognition (STT)</b>", table_cell_bold),
        Paragraph("<b>Web Speech API SpeechRecognition</b><br/>(Locale: <code>en-IN</code>, <code>hi-IN</code>, <code>ta-IN</code>)", table_cell_style),
        Paragraph("Real-time live speech-to-text recording directly inside the browser with continuous interim result streaming.", table_cell_style)
    ],
    [
        Paragraph("<b>Speech Synthesis (TTS)</b>", table_cell_bold),
        Paragraph("<b>Web Speech API SpeechSynthesis</b><br/>(Native Voice Selection & Rate Control)", table_cell_style),
        Paragraph("Reads scheme justifications, skill passport details, and recruiter voice bio audio previews aloud in native Indian languages.", table_cell_style)
    ],
    [
        Paragraph("<b>Opportunity Match Engine</b>", table_cell_bold),
        Paragraph("<b>Cosine Similarity & Vector Match Scoring</b>", table_cell_style),
        Paragraph("Calculates match percentages between user skill vectors and district-level PM-AJAY, PM-FME, and MUDRA scheme requirements.", table_cell_style)
    ],
]
t_ml = Table(ml_model_data, colWidths=[130, 160, 250])
t_ml.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), primary_color),
    ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ('GRID', (0,0), (-1,-1), 0.5, border_color),
    ('PADDING', (0,0), (-1,-1), 4),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(t_ml)

story.append(Spacer(1, 8))
story.append(Paragraph("Complete Production Technology Stack", h1_style))

stack_data = [
    [Paragraph("Layer", table_header_style), Paragraph("Technologies Used", table_header_style), Paragraph("Key Features & Capabilities", table_header_style)],
    [
        Paragraph("<b>Frontend UI Layer</b>", table_cell_bold),
        Paragraph("React 19, TypeScript, Vite, Vanilla CSS + Tailwind v4, Lucide Icons, ReactFlow, i18next (en/hi/ta)", table_cell_style),
        Paragraph("Glassmorphism dark/light design, dynamic skill node graphs, localized multi-language state, PWA offline caching.", table_cell_style)
    ],
    [
        Paragraph("<b>Voice & Recruiter Audio</b>", table_cell_bold),
        Paragraph("Web Speech API, VoicePitchPlayer, Equalizer Waveform Visualizer", table_cell_style),
        Paragraph("Recruiter Audio Pitch Player with animated equalizer bars, playback speed controls (1x to 1.5x), and native TTS voice bio.", table_cell_style)
    ],
    [
        Paragraph("<b>Recruiter & Reach Portal</b>", table_cell_bold),
        Paragraph("MSME Recruiter Portal (<code>/recruiter</code>), WhatsAppAlertSimulator", table_cell_style),
        Paragraph("Direct talent search by district & skill, call/WhatsApp triggers, instant simulated WhatsApp job & PM-AJAY scheme notifications.", table_cell_style)
    ],
    [
        Paragraph("<b>Backend API Layer</b>", table_cell_bold),
        Paragraph("FastAPI (Python 3.11+), Pydantic v2, Python-Jose JWT Auth, RESTful Architecture", table_cell_style),
        Paragraph("High-performance asynchronous endpoints for user management, skill extraction, verification quizzes, and scheme matching.", table_cell_style)
    ],
    [
        Paragraph("<b>Database & Persistence</b>", table_cell_bold),
        Paragraph("SQLAlchemy 2.0 ORM, Local MySQL (Prod) & SQLite Auto-Fallback (<code>anubhavai.db</code>)", table_cell_style),
        Paragraph("Supports direct connection to local MySQL (via <code>.env</code>) with automatic zero-config SQLite fallback for instant hackathon demos.", table_cell_style)
    ],
]
t_stack = Table(stack_data, colWidths=[120, 190, 230])
t_stack.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), secondary_color),
    ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ('GRID', (0,0), (-1,-1), 0.5, border_color),
    ('PADDING', (0,0), (-1,-1), 4),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(t_stack)

doc.build(story)
print(f"Presentation PDF successfully updated at: {pdf_path}")
