# 🎵 Raga Finder AI

An intelligent Indian Classical Music (**Carnatic & Hindustani**) Raga discovery and analysis platform powered by **OpenAI**, designed for zero-config deployment on **Vercel**.

Featuring an **Admin Musicologist Teaching & Ground-Truth Correction System**, administrators can teach OpenAI specific disambiguation rules and correct mistakes in real time, ensuring high-accuracy raga identification without hallucinations.

---

## 🌟 Key Features

1. **Multi-Modal Raga Discovery**:
   - **Interactive Swara Keyboard**: Select Carnatic swaras (`S, R1, R2, R3, G1, G2, G3, M1, M2, P, D1, D2, D3, N1, N2, N3`) or Hindustani notes with real-time audio pitch audition.
   - **Song / Kriti Search**: Identify the raga behind any classical Kriti, Hindustani Bandish, or cinema song (e.g. *Vatapi Ganapatim*, *Albela Sajan*, *Krishna Nee Begane*).
   - **Western Scale & Free-form Description**: Analyze Western note sequences (e.g. `C D E F# G A B`) or descriptions (e.g. *"Evening raga with teevra ma and komal ni expressing romance"*).
2. **Web Audio Swara Synthesizer**:
   - Play back Arohana and Avarohana scales note-by-note with warm harmonic tones directly in the browser.
3. **OpenAI Musicology Engine with Dynamic Prompt Augmentation**:
   - System prompt dynamically injects all verified **Admin Ground-Truth Rules** into OpenAI context with highest priority.
   - Low-temperature deterministic inference strictly differentiates subtle ragas (e.g., *Keeravani vs Simhendramadhyamam*, *Mohanam vs Bhoopali*, *Carnatic Hanumatodi vs Hindustani Miyan ki Todi*).
4. **Admin Teaching & Mistake Correction Portal (`/admin`)**:
   - **Report Mistake**: Users or admins can flag any incorrect identification on the result card and submit the correct raga and swaras.
   - **Review & Convert**: Admin reviews flagged mistakes in the queue with 1-click conversion into permanent ground-truth rules.
   - **Live Prompt Playground**: Test test queries and verify how OpenAI responds with active taught rules.
   - **Backup & Export**: Download all taught rules as `rules.json` or import existing knowledge bases.
5. **72 Melakarta Interactive Directory (`/melakarta`)**:
   - Browse all 72 Janaka ragas organized into 12 Chakras with swara formulas and instant audio previews.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```ini
# OpenAI API Key (Required for live AI queries)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: OpenAI model (defaults to gpt-4o-mini, supports gpt-4o)
OPENAI_MODEL=gpt-4o-mini

# Admin Secret Key (Used to enter /admin portal)
ADMIN_SECRET_KEY=ragamaster2026
```

> **Note**: Even if `OPENAI_API_KEY` is not provided initially, the application includes a smart offline knowledge database and rules engine so the app can be previewed immediately.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Raga Finder, and [http://localhost:3000/admin](http://localhost:3000/admin) for the Admin Teaching Console.

---

## 🛠️ How Admin Teaching Works

When mistakes are discovered, administrators have direct control to eliminate them:

1. **User / Admin Flags an Inaccuracy**:
   On any raga result card, click **"Teach AI / Report Mistake"**. Enter the correct raga name and explain the musicology nuance (e.g. *"The query has Prati Madhyamam M2, so it cannot be Keeravani"*).
2. **Review in Admin Console (`/admin`)**:
   Log in using your `ADMIN_SECRET_KEY`. Go to the **Reported Mistakes Queue** and click **"Approve & Teach AI"**.
3. **Dynamic Few-Shot Ground-Truth Injection**:
   The approved correction is stored in the active rules database. Every subsequent request to OpenAI injects this rule under `### VERIFIED GROUND-TRUTH RULES TAUGHT BY MUSICOLOGIST ADMIN`, compelling OpenAI to adhere to the rule with 100% priority.

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the project.
3. In **Project Settings -> Environment Variables**, add:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `OPENAI_MODEL`: `gpt-4o-mini` (or `gpt-4o`)
   - `ADMIN_SECRET_KEY`: Your private admin passphrase
4. Click **Deploy**. Vercel will automatically build the Next.js application.

---

## 📂 Project Structure

```text
raga-finder/
├── data/                       # Dynamic runtime storage for admin rules & reports
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── reports/    # Admin report management endpoint
│   │   │   │   ├── rules/      # Admin rule CRUD endpoint
│   │   │   │   └── verify/     # Admin secret key authentication
│   │   │   ├── identify-raga/  # Core raga identification API
│   │   │   └── report-mistake/ # User mistake reporting endpoint
│   │   ├── admin/              # Admin teaching & rule management portal
│   │   ├── melakarta/          # 72 Melakarta guide & reference table
│   │   ├── globals.css         # Tailwind & custom styling
│   │   ├── layout.tsx          # Root layout with Navbar & Footer
│   │   └── page.tsx            # Main Raga Finder interface
│   ├── components/
│   │   ├── Footer.tsx          # Brand footer
│   │   ├── Navbar.tsx          # Header with navigation
│   │   ├── RagaResultCard.tsx  # Result card with audio playback & mistake reporting
│   │   ├── ReportMistakeModal.tsx # Correction submission modal
│   │   └── SwaraKeyboard.tsx   # Interactive note keyboard & presets
│   ├── data/
│   │   ├── seed_admin_rules.json # Pre-seeded disambiguation ground-truth rules
│   │   └── seed_ragas.json     # Reference dataset of Carnatic & Hindustani ragas
│   ├── lib/
│   │   ├── audioSynth.ts       # Web Audio API swara synthesizer
│   │   ├── openai.ts           # OpenAI client & dynamic prompt injector
│   │   └── storage.ts          # Storage adapter for rules & reports
│   └── types/
│       └── raga.ts             # TypeScript definitions
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## 📜 License
MIT License. Built for classical musicians, students, and music researchers.
