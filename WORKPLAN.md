# Human-AI Sensemaking Canvas — Detailed Workplan

> **Project:** Human-AI Sensemaking Canvas  
> **Owner:** Raphael Moreno, Head of Human-Centered Computing (HCC), Temus  
> **Port:** `8731`  
> **Stack:** Vanilla JS/CSS/HTML (CDN-first) + FastAPI (Python) + Anthropic Claude API  
> **Vibe Coding Principles:** Atomic CSS, Web Components, functional JS, CDN-first, template-first, framework-agnostic

---

## What Is This Platform?

The **Human-AI Sensemaking Canvas** is a strategic workshop tool designed to help teams and practitioners answer one critical question:

> *"In this process, what should humans do, what should AI do, and where does it get complicated?"*

It is not a project management tool. It is not a chatbot builder. It is a **structured thinking environment** that makes the division of labour between humans and AI systems explicit, visual, and actionable.

### The Problem It Solves

When organisations adopt AI, they typically do it one of two ways:
1. **Too fast** — automating everything without considering where human judgment is irreplaceable, creating brittle systems people don't trust
2. **Too cautiously** — adding AI as a cosmetic layer without fundamentally redesigning workflows, leading to underperformance and wasted investment

Neither approach involves a deliberate, facilitated conversation about *human-AI collaboration design*. That gap is what this tool fills.

### Who Uses It

**Solo practitioners** (UX designers, service designers, AI product managers, consultants) use it to map out a process they are designing or auditing, get AI-powered suggestions on how to split responsibilities, and produce a professional report they can share with clients or stakeholders.

**Facilitated teams** (workshops, sprint sessions, design reviews) use it with a facilitator guiding them step-by-step through the mapping exercise. The tool structures the conversation so teams don't skip hard questions — like "what happens when the AI is wrong here?" or "does the user even trust AI to do this?"

### The Designer's Background

This tool was designed by Raphael Moreno, a Human-Centered Computing lead with 16+ years of experience in AI product design, conversational UX, and responsible AI. He has built AI training simulators, designed AI personas for major insurance companies (FWD Philippines, AIA Thailand), and developed frameworks for explainable AI. This canvas is an extension of his **Human-AI Behavior Design** practice and his **Trust by Design** BD methodology at Temus. 

The canvas is also intended as a **portfolio artifact** — it should look and feel like something a senior design leader built, not a student project. Visual quality, UX clarity, and conceptual depth all matter.

---

## Core Concept: The Four Lenses

Every step in a process is analysed through four lenses. These are not arbitrary — each one addresses a distinct failure mode in human-AI system design:

| Lens | The Failure It Prevents |
|------|------------------------|
| **Task Allocation** | "We automated this but nobody checked if AI was actually good at it" |
| **Risk Flagging** | "We over-automated and now there's no human judgment when it matters most" |
| **Trust & Explainability** | "Users don't trust the AI output because they can't understand how it decided" |
| **Handoff Points** | "The AI handed off to a human but the human had no context and made a worse decision" |

These four lenses together form the canvas. Each step in the user's process gets assessed across all four. The output is a complete picture of where AI helps, where it creates risk, and where humans must stay in the loop.

---

## Two Modes Explained

### Solo Mode
The user works independently. They define a process (e.g. "customer complaint resolution", "loan application review", "clinical triage"), add the steps in sequence, assign initial ownership hunches, then hit Analyse. Claude reviews the full process and enriches each step with suggestions across all four lenses. The user can then adjust, re-analyse, and finally export a PDF report.

**Use case:** A consultant preparing an AI readiness assessment for a client. A designer doing a pre-project AI impact review. A researcher documenting human-AI collaboration patterns.

### Facilitated Mode
The tool acts as a workshop co-facilitator. It guides the team through each stage with prompts, questions, and framing. Each section has an instruction panel that helps the facilitator ask the right questions. AI suggestions surface progressively rather than all at once, so the team can discuss before the AI weighs in.

**Use case:** A design sprint where the team is mapping a new AI-augmented service. A client workshop where stakeholders need to align on what AI should and shouldn't do. An internal review session for an existing AI product.

---

## What the AI Actually Does

Claude is not a chatbot in this product. It is an **analytical engine** operating behind two API calls:

### 1. `/analyse` — Step-by-Step Dimension Analysis
The user's full process context (name, description, all steps with ownership assignments) is sent to Claude. Claude returns structured JSON with per-step assessments across all four configured dimensions. This is rendered visually on the canvas — badges, ratings, flags, and explanation text per step.

Claude is given the `dimensions.json` config so the analysis is always aligned to whatever dimensions are active. Adding or removing a dimension in the config changes what Claude analyses without touching any other code.

### 2. `/report` — Professional Report Generation
Once the canvas is complete and analysed, the user requests a report. Claude receives the full analysed canvas state and generates a structured professional document covering: executive summary, process overview, per-step breakdown, key risks, and strategic recommendations. This is rendered as a preview in-browser and exported as PDF.

---

## Design Principles for the AI Coder

These are non-negotiable and reflect the owner's Vibe Coding methodology:

1. **No inline styles.** All styling lives in external CSS files, organised by concern.
2. **No frameworks.** Vanilla JS only. No React, Vue, or Alpine. Web Components for reusable UI elements.
3. **CDN-first.** No npm for frontend. All libraries (if any) loaded from `cdnjs.cloudflare.com`.
4. **Template-first.** Use `<template>` tags or template literal functions for repeating UI elements (step cards, dimension badges, etc.).
5. **Functional JS.** Pure functions where possible. Avoid classes except for Web Components.
6. **All prompts in markdown files.** No prompt strings in Python or JS code. Every Claude prompt lives in a `.md` file in the `/prompts/` directory and is loaded at runtime.
7. **Config-driven dimensions.** The canvas dimensions (what AI analyses) are defined entirely in `config/dimensions.json`. An AI coder or future developer should be able to add a new dimension, rename one, or change its values without touching any route or frontend logic.
8. **Incremental build.** Each phase must be tested before the next begins. Do not scaffold everything and fill in later.

---

## Project Structure

```
hai-canvas/
├── frontend/
│   ├── index.html                  ← App shell, mode selector landing page
│   ├── canvas.html                 ← Main canvas workspace
│   ├── report.html                 ← Report preview page
│   ├── css/
│   │   ├── reset.css               ← Normalize base styles
│   │   ├── tokens.css              ← Design tokens: colors, spacing, type scale
│   │   ├── layout.css              ← Page grid, header, main, footer
│   │   ├── components.css          ← Buttons, cards, badges, panels, modals
│   │   ├── canvas.css              ← Step cards, ownership selector, dimension badges
│   │   └── report.css              ← Report preview layout, print styles
│   ├── js/
│   │   ├── app.js                  ← Entry point, mode detection, routing
│   │   ├── canvas.js               ← Step card CRUD, drag-reorder, canvasState
│   │   ├── analyse.js              ← POST /analyse, merge results, re-render
│   │   ├── report.js               ← POST /report, render report preview
│   │   └── export.js               ← POST /export, trigger PDF download
│   └── prompts/
│       ├── analyse.md              ← Claude prompt: dimension analysis
│       └── report.md               ← Claude prompt: report generation
│
├── backend/
│   ├── main.py                     ← FastAPI app, CORS, static mount, route registration
│   ├── config/
│   │   └── dimensions.json         ← THE source of truth for canvas dimensions
│   ├── routes/
│   │   ├── analyse.py              ← POST /analyse endpoint
│   │   ├── report.py               ← POST /report endpoint
│   │   └── export.py               ← POST /export endpoint (returns PDF)
│   ├── services/
│   │   ├── claude.py               ← Anthropic SDK wrapper + prompt file loader
│   │   └── pdf.py                  ← WeasyPrint PDF generation service
│   └── prompts/
│       ├── analyse.md              ← Same prompts as frontend/prompts (backend-served)
│       └── report.md
│
├── .env                            ← ANTHROPIC_API_KEY only (never committed)
├── .gitignore                      ← .env, __pycache__, *.pyc, venv/, .DS_Store
├── requirements.txt                ← fastapi, uvicorn, anthropic, weasyprint, python-dotenv
├── startup.sh                      ← Aggressive port killer + env load + server start
└── WORKPLAN.md                     ← This file
```

---

## Canvas Dimensions — Config Schema

Dimensions are entirely config-driven. This is the schema for `config/dimensions.json`. An AI coder must read this before touching any analysis or rendering logic.

```json
{
  "dimensions": [
    {
      "id": "task_allocation",
      "label": "Task Allocation",
      "description": "Who owns this step — Human, AI, or shared responsibility?",
      "ai_instruction": "Suggest whether this step should be owned by a Human, AI, or Both. Provide a 1-sentence rationale grounded in the nature of the task.",
      "values": ["Human", "AI", "Both"],
      "badge_style": "ownership"
    },
    {
      "id": "risk_flagging",
      "label": "Risk Flagging",
      "description": "Is this step at risk of over-automation or ethical harm?",
      "ai_instruction": "Assess whether this step risks over-automation, loss of human accountability, or ethical harm if AI-handled. Rate Low/Medium/High and explain in 1-2 sentences.",
      "values": ["Low", "Medium", "High"],
      "badge_style": "traffic-light"
    },
    {
      "id": "trust_explainability",
      "label": "Trust & Explainability",
      "description": "How important is it that AI decisions here are explainable to users?",
      "ai_instruction": "Rate the explainability requirement for any AI involvement at this step. Consider: will users or operators need to understand why the AI decided what it did? Rate Low/Medium/High and note if XAI mechanisms (explanations, confidence scores, audit trails) are needed.",
      "values": ["Low", "Medium", "High"],
      "badge_style": "traffic-light"
    },
    {
      "id": "handoff_points",
      "label": "Handoff Points",
      "description": "Should a human take over from AI at this step? Under what conditions?",
      "ai_instruction": "Determine if this step requires a human handoff point — a moment where a human must review, approve, or intervene before the process continues. If yes, describe the trigger condition (e.g. 'when confidence is below threshold', 'when emotional content is detected', 'always for high-value decisions').",
      "values": ["Yes", "No"],
      "badge_style": "boolean"
    }
  ]
}
```

**To add a new dimension:** Add a new object to the `dimensions` array. The frontend and backend will automatically include it in analysis and rendering. No other files need to change.

---

## API Contract

### POST `/analyse`
**Request:**
```json
{
  "process_name": "Customer Complaint Resolution",
  "context_description": "A telco's end-to-end process for handling billing complaints",
  "context_type": "Process/Workflow",
  "steps": [
    {
      "id": "step_1",
      "title": "Receive complaint",
      "description": "Customer submits complaint via app or call centre",
      "ownership": "Both"
    }
  ]
}
```
**Response:**
```json
{
  "steps": [
    {
      "step_id": "step_1",
      "task_allocation": { "value": "Both", "rationale": "Initial intake can be AI-triaged but human warmth matters at first contact." },
      "risk_flagging": { "value": "Low", "rationale": "Low risk as long as the AI is not making decisions, only routing." },
      "trust_explainability": { "value": "Medium", "rationale": "Customer should understand why their complaint was routed a certain way." },
      "handoff_points": { "value": "Yes", "rationale": "If sentiment analysis detects high frustration, escalate to human agent immediately." }
    }
  ]
}
```

### POST `/report`
**Request:** Full `canvasState` object including all steps with analysis results  
**Response:** Structured report object with: `title`, `executive_summary`, `process_overview`, `step_analyses[]`, `key_risks[]`, `recommendations[]`, `trust_summary`

### POST `/export`
**Request:** Full canvas + report data  
**Response:** PDF file as `application/pdf` with `Content-Disposition: attachment; filename="hai-canvas-[process-name]-[date].pdf"`

### GET `/health`
**Response:** `{ "status": "ok" }`

---

## Phases

---

### Phase 0 — Project Scaffold
**Goal:** Repo ready, environment working, server running on port 8731

**Tasks:**
- [ ] Create full directory structure as specified above
- [ ] `requirements.txt`: `fastapi`, `uvicorn`, `anthropic`, `weasyprint`, `python-dotenv`
- [ ] `.env` with `ANTHROPIC_API_KEY=` placeholder
- [ ] `.gitignore`: `.env`, `__pycache__`, `*.pyc`, `venv/`, `.DS_Store`
- [ ] `main.py`: FastAPI app, static file mount at `/` serving `frontend/`, CORS enabled for localhost
- [ ] `config/dimensions.json`: full schema as above
- [ ] `startup.sh`: aggressive port 8731 killer (`lsof -ti:8731 | xargs kill -9`), venv activation if present, env export, uvicorn start
- [ ] GET `/health` route returns `{"status": "ok"}`

**Test:** `bash startup.sh` → `curl http://localhost:8731/health` → `{"status": "ok"}`  
**Git commit:** `[Phase 0] Project scaffold, health check passing`

---

### Phase 1 — Frontend Shell
**Goal:** Landing page renders with mode selection, routing works

**Tasks:**
- [ ] `index.html`: App name "Human-AI Sensemaking Canvas", tagline, Solo and Facilitated mode cards with descriptions, CTA buttons
- [ ] `tokens.css`: Color palette (professional, not generic — suggest deep navy + warm amber + clean white), spacing scale (4px base), font stack via Google Fonts CDN (suggest Inter or DM Sans)
- [ ] `reset.css`: Normalize base
- [ ] `layout.css`: Centered container, header with logo/title, main region, footer
- [ ] `components.css`: Button primary/secondary, mode card, hover states
- [ ] `app.js`: Reads URL param `?mode=`, stores in `sessionStorage`, no routing library
- [ ] Mode buttons route to `canvas.html?mode=solo` and `canvas.html?mode=facilitated`

**Test:** Open `localhost:8731` → both mode cards visible and styled → each button routes correctly  
**Git commit:** `[Phase 1] Landing page, mode selection, routing`

---

### Phase 2 — Canvas Workspace
**Goal:** User can define a process, add/edit/reorder steps, assign ownership

**Tasks:**
- [ ] `canvas.html`: Two-panel layout — left sidebar (process meta) + right main area (step cards) + sticky action bar at bottom
- [ ] Sidebar fields: Process Name (text input), Context Description (textarea), Context Type (dropdown — options loaded from a config array in `app.js`, easy to edit)
- [ ] Mode indicator in header (Solo / Facilitated badge)
- [ ] Step card as Web Component or `<template>` literal:
  - Editable step title (click-to-edit or always-editable input)
  - Editable step description (textarea)
  - Ownership segmented control: Human / AI / Both (3-option pill selector)
  - Drag handle (left edge)
  - Delete button (top-right, with confirmation)
  - Dimension results area (empty until analysed, then populated)
- [ ] "Add Step" button → appends new blank step card, auto-focuses title
- [ ] Drag-to-reorder via HTML5 Drag API — no libraries
- [ ] `canvasState` object in `canvas.js`: `{ process: {...}, steps: [...] }` — single source of truth
- [ ] All mutations go through pure functions that update `canvasState` then re-render
- [ ] Facilitated mode: instruction panel above canvas with guiding text per section
- [ ] `canvas.css`: Step card layout, ownership pill styles, drag ghost styles, facilitated instruction panel

**Test:** Add 3 steps, edit titles/descriptions, change ownership on each, drag to reorder — `canvasState` logged to console shows correct state  
**Git commit:** `[Phase 2] Canvas workspace, step cards, drag-reorder`

---

### Phase 3 — AI Analysis Backend
**Goal:** `/analyse` endpoint returns structured per-step dimension assessments

**Tasks:**
- [ ] `backend/prompts/analyse.md`: Full prompt instructing Claude to receive process context + steps and return JSON matching the API contract above. Include the dimensions dynamically from config. Be explicit about JSON-only output, no markdown fences.
- [ ] `services/claude.py`:
  - `load_prompt(filename: str) -> str` — reads from `backend/prompts/`
  - `call_claude(prompt: str, max_tokens: int) -> str` — wraps `anthropic.Anthropic().messages.create()` using `claude-sonnet-4-20250514`
- [ ] `routes/analyse.py`:
  - Pydantic models for request and response
  - Loads `dimensions.json` at startup
  - Builds prompt by injecting process context + steps + dimension instructions into `analyse.md` template
  - Parses Claude's JSON response
  - Returns typed response
- [ ] Error handling: if Claude returns malformed JSON, return 422 with detail

**Test:** `curl -X POST localhost:8731/analyse -H "Content-Type: application/json" -d '{...}'` with a 3-step payload → structured JSON response with all 4 dimensions per step  
**Git commit:** `[Phase 3] Analysis backend, Claude integration, dimension config`

---

### Phase 4 — AI Analysis Frontend
**Goal:** Analyse button triggers backend, results render on step cards

**Tasks:**
- [ ] "Analyse" button in action bar — disabled until at least 1 step exists and process name is filled
- [ ] `analyse.js`:
  - Collects current `canvasState`
  - POST to `/analyse`
  - On success: merges dimension results into each step in `canvasState`
  - Triggers re-render of step cards to show dimension data
- [ ] Step cards expand after analysis to show dimension result rows:
  - **Task Allocation:** badge (Human=blue, AI=purple, Both=teal) + rationale text
  - **Risk Flagging:** badge (Low=green, Medium=amber, High=red) + rationale text
  - **Trust & Explainability:** badge (same traffic-light scheme) + rationale text
  - **Handoff Points:** badge (Yes=orange, No=grey) + condition text
- [ ] Dimension result rows collapsible (click to expand/collapse per step)
- [ ] Loading state: Analyse button shows spinner, step cards show skeleton loader
- [ ] Error state: toast notification if API fails
- [ ] "Re-analyse" replaces previous results cleanly

**Test:** Fill 3 steps with titles, descriptions, ownership → click Analyse → all cards update with dimension badges and rationale text, no console errors  
**Git commit:** `[Phase 4] Analysis frontend, dimension badge rendering`

---

### Phase 5 — Report Generation
**Goal:** Report page renders full structured report from analysed canvas

**Tasks:**
- [ ] `backend/prompts/report.md`: Prompt instructing Claude to generate a professional structured report from the full canvas state. Include all section names. Specify JSON output format.
- [ ] `routes/report.py`:
  - Accepts full `canvasState` with analysis results
  - Pydantic models for request and response
  - Builds prompt from `report.md` template
  - Returns structured report object
- [ ] "Generate Report" button in action bar — only enabled after Analyse has been run
- [ ] `report.js`:
  - Reads `canvasState` from `sessionStorage`
  - POST to `/report`
  - Renders each report section into `report.html`
- [ ] `report.html` sections:
  - Header: Process name, date, context type
  - Executive Summary
  - Process Overview (step count, context)
  - Step-by-Step Analysis table (all steps × all dimensions)
  - Key Risks (aggregated from risk_flagging results)
  - Recommendations (from Claude)
  - Trust Summary
- [ ] `report.css`: Clean, print-friendly layout. Professional look — this is a client-deliverable artifact.

**Test:** Complete canvas with 3+ analysed steps → Generate Report → all sections render with correct data  
**Git commit:** `[Phase 5] Report generation, report preview page`

---

### Phase 6 — PDF Export
**Goal:** Export button downloads a properly formatted PDF

**Tasks:**
- [ ] `services/pdf.py`:
  - Accepts report data + canvas state
  - Uses WeasyPrint to render an HTML template to PDF
  - HTML template styled for print (A4, proper margins, no screen-only elements)
  - Returns PDF bytes
- [ ] `routes/export.py`:
  - Accepts canvas + report data
  - Calls `pdf.py` service
  - Returns `StreamingResponse` with `application/pdf` and `Content-Disposition: attachment`
  - Filename: `hai-canvas-[slugified-process-name]-[YYYY-MM-DD].pdf`
- [ ] `export.js`:
  - POST to `/export` with full state
  - Triggers browser download via blob URL
  - Loading state on Export button
- [ ] PDF content: title page, process meta, step analysis table, risks, recommendations

**Test:** Full canvas → Generate Report → Export PDF → file downloads, opens in PDF viewer, all content present and readable  
**Git commit:** `[Phase 6] PDF export via WeasyPrint`

---

### Phase 7 — Polish & Facilitated Mode
**Goal:** Facilitated mode fully functional, UI polished, responsive

**Tasks:**
- [ ] Facilitated mode: step-by-step guided panels with facilitator instructions
- [ ] Progress indicator bar (Step N of Total)
- [ ] Facilitated intro screen: context setter explaining the exercise to workshop participants
- [ ] Responsive layout: works on tablet (min 768px) for workshop projection
- [ ] Keyboard accessibility: all interactive elements reachable via Tab, Enter/Space to activate
- [ ] Empty state: illustrated empty canvas with "Add your first step" prompt
- [ ] Toast notification system (success, error, info)
- [ ] Final visual QA: spacing, colour consistency, typography scale
- [ ] Confirm all prompts are in `.md` files, no strings in code

**Test:** Full facilitated mode run end-to-end → PDF exported cleanly → no console errors  
**Git commit:** `[Phase 7] Polish, facilitated mode, accessibility`

---

## Prompt File Responsibilities

### `prompts/analyse.md`
- Receives: process name, context description, context type, steps (with titles, descriptions, ownership), and dimension definitions from config
- Must output: valid JSON only, no preamble, no markdown fences
- JSON structure must match the `/analyse` response contract exactly
- Claude should reason about each step in the context of the full process — not step by step in isolation

### `prompts/report.md`
- Receives: full analysed canvas state
- Must output: valid JSON only with all report sections
- Tone: professional, consultant-grade, suitable for client delivery
- Recommendations should be specific and actionable, not generic

---

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
```

Only this key is needed. Never commit `.env`.

---

## startup.sh Behaviour

```bash
#!/bin/bash
# Kill anything on port 8731
echo "Killing port 8731..."
lsof -ti:8731 | xargs kill -9 2>/dev/null || true

# Activate venv if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Load environment
export $(cat .env | grep -v '^#' | xargs)

# Start server
echo "Starting HAI Canvas on port 8731..."
uvicorn backend.main:app --host 0.0.0.0 --port 8731 --reload
```

---

## Git Strategy

- Commit at the end of every phase with format: `[Phase N] description`
- Never commit `.env`
- Work on `main` branch throughout
- Each phase commit should leave the app in a working, testable state

---

## Model Configuration

- **Model:** `claude-sonnet-4-20250514`
- **Max tokens — analysis:** `4000`
- **Max tokens — report:** `3000`
- **Temperature:** not set (use Claude default)
- **System prompt:** defined in each `.md` prompt file

---

## Visual Design Direction

This is a **portfolio-grade tool** built by a senior design leader. The visual language should reflect that:

- **Not** a generic Bootstrap/Tailwind default look
- Clean, considered, professional — think Notion × Linear × a well-designed consulting deliverable
- Color palette suggestion: deep navy (`#0F1B2D`) + warm amber (`#F59E0B`) + light grey backgrounds + white cards
- Typography: DM Sans or Inter via Google Fonts CDN — clear hierarchy, generous spacing
- Step cards should feel like physical sticky notes on a canvas — tactile, scannable
- Dimension badges should be immediately readable — colour + label, not just colour
- The report preview should look like something you'd send to a client — not a web page

---

## Future Enhancements (post-tonight, do not build now)

- Shareable link via Supabase saved state
- Multi-user facilitated mode via WebSocket
- Context type plugin system (swap `dimensions.json` per industry vertical)
- Notion export
- Miro embed / iframe mode
- Custom facilitator voice/persona
- Dimension weighting (some dimensions more critical than others per context)
- AI confidence scoring per dimension suggestion

---

*Generated: 2026-03-09 | Raphael Moreno / HCC Temus*
