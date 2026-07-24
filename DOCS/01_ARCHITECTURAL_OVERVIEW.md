# Architectural Overview — Humor Genome Studio

Humor Genome Studio is a modular, client side web application built to explore humor through artificial intelligence. It provides six specialized instruments across three distinct tracks: Humor Creation, Humor Understanding, and Human + AI Performance.

## Core Architectural Principles

### 1. Zero Backend Client Model
The application operates entirely within the browser. There are no intermediate servers, custom API gateways, or external database dependencies. 

- **Direct REST Communication**: The application issues direct HTTP requests to Google AI Studio REST endpoints (`https://generativelanguage.googleapis.com/v1beta`).
- **Key Isolation**: The user's Google AI Studio API key is stored strictly in `localStorage` (`hgs-settings-v1`) and is sent only to Google's official API endpoints via the `x-goog-api-key` header.
- **Privacy and Portability**: No user prompts, generated jokes, or API keys are logged or transferred to third party servers.

### 2. Model Agnostic Pipeline
The engine is not tied to any single LLM checkpoint. Users can target any compatible Google model (such as `gemini-2.5-flash`, `gemini-2.5-pro`, `gemma-3-27b-it`, `gemma-3-12b-it`, or `gemma-3-4b-it`).

If a target model endpoint is unavailable, rate limited, or returns an error, the execution engine dynamically steps through a user specified fallback model chain (for example, `gemma-3-27b-it, gemini-2.0-flash`).

### 3. Track and Instrument Classification

The studio splits humor engineering into three distinct tracks:

| Track ID | Track Name | Modules Included | Primary Focus |
|---|---|---|---|
| `creation` | Humor Creation | Joke Copilot, Tight 5 Generator | Generating raw comedic material, stand up routines, and persona based sets |
| `understanding` | Humor Understanding | Explanation Engine, Cultural Translator, Genome Lab | Deconstructing mechanisms, cultural adaptation, and 8 dimension DNA profiling |
| `performance` | Human + AI Performance | Improv Partner | Real time interactive scene work, live offer suggestions, and post scene debriefs |

## Technical Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS with custom theme extensions (gold, neon-violet, magenta accents) and shadcn UI primitives
- **Icons**: Lucide React
- **Data Visualization**: Recharts for 8-axis radar charts and custom CSS bar indicators
