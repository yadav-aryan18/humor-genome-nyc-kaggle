# Humor Genome Studio

Humor Genome Studio is a browser-based workbench designed for engineering, dissecting, adapting, and performing comedy using Gemini and Gemma models via Google AI Studio's REST API.

The platform treats humor as a structured discipline, offering six specialized instruments across three core tracks: Humor Creation, Humor Understanding, and Human + AI Performance.

---

## Key Features and Instruments

### 1. Humor Creation Track
- **Joke Copilot**: Generates original jokes with granular control over comedic structure (one-liners, setup-punchline, rule of three, misdirection), topic, target audience, and spice level.
- **Tight 5 Generator**: Assembles persona-driven, 5-minute stand-up routines complete with timed bits, planted callbacks, segues, and concrete stage execution notes.

### 2. Humor Understanding Track
- **Explanation Engine**: Deconstructs jokes into quoted setups, pivots, punchlines, and tags while identifying underlying psychological mechanisms and providing punch-up suggestions.
- **Cultural Translator**: Adapts jokes for target cultures rather than performing literal translation, swapping culture-locked references and explaining local comedic reception.
- **Genome Lab**: Computes an 8-dimension quantitative DNA profile (`surprise`, `incongruity`, `superiority`, `relief`, `absurdity`, `warmth`, `edge`, `wordplay`), tests alignment against major comedy theories, and executes controlled genome-shift rewrites.

### 3. Human + AI Performance Track
- **Improv Partner**: Interactive "yes, and..." scene partner featuring token-level streaming responses, one-tap offer rescue chips, and post-scene debrief coaching.

---

## Technical Architecture

- **Zero Backend Client Model**: Executes entirely in the user's browser using React 18, TypeScript, Vite, and Tailwind CSS. API keys are stored locally in browser `localStorage` and sent directly to Google AI Studio endpoints via HTTPS headers.
- **6-Stage Self-Healing Pipeline**: Every module run passes through a visible, 6-stage pipeline (`Assemble` -> `Generate` -> `Validate` -> `Auto-Repair` -> `Critic Pass` -> `Render`). The pipeline automatically enforces JSON schemas, handles rate-limit retries with exponential backoff, steps through fallback model chains, and repairs malformed LLM outputs.

---

## Repository Structure

```
.
├── DOCUMENTATION_INDEX.md           # Master index for technical documentation
├── requirements.txt                 # Dependency manifest and setup instructions
├── DOCS/                            # Comprehensive architectural and module guides
│   ├── 01_ARCHITECTURAL_OVERVIEW.md
│   ├── 02_PIPELINE_AND_AI_ENGINE.md
│   ├── 03_MODULE_SPECIFICATIONS_AND_SCHEMAS.md
│   ├── 04_FRONTEND_UI_AND_STATE.md
│   └── 05_USAGE_AND_SETUP_GUIDE.md
└── app/                             # Web application source tree
    ├── .gitignore                   # Workspace git ignore specifications
    ├── README.md                    # Frontend template readme
    ├── info.md                      # UI theme component references
    ├── components.json              # UI component settings
    ├── index.html                   # HTML entry point
    ├── package.json                 # Node.js dependencies and script definitions
    ├── package-lock.json            # Locked dependency versions
    ├── postcss.config.js            # PostCSS configuration
    ├── tailwind.config.js           # Tailwind CSS configuration
    ├── tsconfig.json                # Main TypeScript configuration
    ├── tsconfig.app.json            # Application compiler settings
    ├── tsconfig.node.json           # Node environment compiler settings
    ├── vite.config.ts               # Vite bundler configuration
    └── src/                         # Source code directory
        ├── App.css                  # Custom styling rules
        ├── App.tsx                  # Root React router component
        ├── index.css                # Global Tailwind CSS entry
        ├── main.tsx                 # Client rendering entry point
        ├── components/              # UI widgets, radar charts, layout shells
        ├── hooks/                   # Custom hooks (usePipelineRunner, use-mobile)
        ├── lib/                     # AI REST client, pipeline, module schemas, settings
        └── pages/                   # Studio page views (Copilot, Improv, Lab, etc.)
```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher (Node.js 20 recommended)
- **Package Manager**: `npm` (included with Node.js), `pnpm`, or `yarn`
- **Google AI Studio Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

### Quick Start Guide

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.
5. Click the **Settings** gear icon in the top right header, enter your Google AI Studio API key, and select your preferred primary model (such as `gemini-3.5-flash` or `gemma-4-31b-it`).

---

## Documentation Quick Links

For complete technical specifications, review the guides in the `DOCS/` folder:

- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Architectural Overview](DOCS/01_ARCHITECTURAL_OVERVIEW.md)
- [Pipeline and AI Engine](DOCS/02_PIPELINE_AND_AI_ENGINE.md)
- [Module Specifications and JSON Schemas](DOCS/03_MODULE_SPECIFICATIONS_AND_SCHEMAS.md)
- [Frontend UI and State Management](DOCS/04_FRONTEND_UI_AND_STATE.md)
- [Usage and Setup Guide](DOCS/05_USAGE_AND_SETUP_GUIDE.md)
- [Package Requirements](requirements.txt)
