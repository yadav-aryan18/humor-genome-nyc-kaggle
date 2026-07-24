# Usage and Setup Guide

This guide provides step by step instructions for setting up, running, configuring, and using Humor Genome Studio locally.

## Prerequisites

- **Node.js**: Version 18.0 or higher (Node.js 20 recommended)
- **Package Manager**: npm, pnpm, or yarn
- **Google AI Studio API Key**: A free key from [Google AI Studio](https://aistudio.google.com/)

---

## Installation and Local Running

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## Configuring Google AI Studio API Key

1. Click the **Settings** gear icon in the top right header of the studio.
2. In the settings drawer, locate the **API Key** input field.
3. Paste your Google AI Studio API key.
4. Click **Fetch models** to test the key and dynamically populate the list of models supported by your account.
5. Key setting is automatically persisted to browser `localStorage`.

---

## Sampling and Safety Settings

Inside the Settings drawer, you can adjust model hyperparameters to tune comedy generation:

- **Temperature** (0.0 to 2.0): Higher values (e.g. 1.0 - 1.3) yield punchier, unexpected jokes. Lower values (e.g. 0.3 - 0.7) yield structured, predictable analysis.
- **Top P** (0.0 to 1.0) & **Top K**: Nucleus and top-k sampling parameters.
- **Fallback Models**: Comma separated list of backup models (e.g. `gemma-3-27b-it, gemini-2.0-flash`). If the main model encounters errors or rate limits, the pipeline automatically steps through fallback models.
- **Safety Threshold**:
  - `DEFAULT`: Standard API safety filter thresholds.
  - `BLOCK_NONE`: Disables safety filters to allow edgy, dark, or adult comedy analysis without false positive triggers.
- **Critique Pass**: Toggle to enable an automated secondary LLM call that acts as a comedy critic and rewrites weak punchlines before displaying results.

---

## Building for Production

To create an optimized production bundle:

```bash
cd app
npm run build
```

The compiled static assets will be output to `app/dist/`. This static bundle can be deployed to any static host such as GitHub Pages, Firebase Hosting, Vercel, or Netlify.
