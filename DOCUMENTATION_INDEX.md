# Humor Genome Studio Documentation Index

Welcome to the technical documentation suite for Humor Genome Studio, a modular AI humor workbench designed for creating, analyzing, adapting, and performing comedy using Gemini and Gemma models.

This documentation is structured into five focused guides covering architecture, AI engine mechanics, module definitions, frontend component hierarchy, and setup instructions.

## Documentation Structure

### 1. Architectural Overview
[Read Guide](DOCS/01_ARCHITECTURAL_OVERVIEW.md)
Covers system design goals, zero backend client model, track classification (Creation, Understanding, Performance), state persistence, and technology stack choices.

### 2. Pipeline and AI Engine
[Read Guide](DOCS/02_PIPELINE_AND_AI_ENGINE.md)
Detailed breakdown of the 6-stage self-healing execution pipeline in `pipeline.ts` and REST client mechanics in `gemini.ts`. Explains structured decoding, JSON schema validation, auto-repair loops, fallback model chains, exponential backoff, and SSE streaming.

### 3. Module Specifications and JSON Schemas
[Read Guide](DOCS/03_MODULE_SPECIFICATIONS_AND_SCHEMAS.md)
Complete specifications for all six studio instruments: Joke Copilot, Explanation Engine, Cultural Translator, Improv Partner, Tight 5 Generator, and Genome Lab. Details system prompts, JSON schemas, and field level coercion rules.

### 4. Frontend UI and State Management
[Read Guide](DOCS/04_FRONTEND_UI_AND_STATE.md)
Walkthrough of React components, UI scaffold layout, `usePipelineRunner` custom hook, settings context provider, and genome visualization charts (radar and barcode).

### 5. Usage and Setup Guide
[Read Guide](DOCS/05_USAGE_AND_SETUP_GUIDE.md)
Step by step instructions for local setup, Google AI Studio key configuration, sampling parameter adjustments, safety threshold selection, prompt overriding, and production deployment notes.

---

## Code Base Quick Reference

- Core Pipeline Orchestrator: [pipeline.ts](app/src/lib/pipeline.ts)
- Google AI Studio REST Client: [gemini.ts](app/src/lib/gemini.ts)
- Module & Schema Definitions: [moduleDefs.ts](app/src/lib/moduleDefs.ts)
- Global Settings Provider: [settings.tsx](app/src/lib/settings.tsx)
- Pipeline Runner React Hook: [usePipelineRunner.ts](app/src/hooks/usePipelineRunner.ts)
- Humor Genome Radar Chart: [GenomeRadar.tsx](app/src/components/GenomeRadar.tsx)
- Package Requirements & Installation: [requirements.txt](requirements.txt)
- Main Project Overview: [README.md](README.md)
