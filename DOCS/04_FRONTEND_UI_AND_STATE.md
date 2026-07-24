# Frontend UI and State Management

Humor Genome Studio features a modular, single-page UI built with React 18, Tailwind CSS, shadcn UI components, and Recharts.

## 1. Global Settings State (`SettingsProvider`)

The settings state context defined in `app/src/lib/settings.tsx` manages all API credentials, model configurations, sampling hyperparameters, and prompt overrides.

- **Persistence**: Automatically syncs state changes to browser `localStorage` under key `hgs-settings-v1`.
- **System Prompt Resolution (`resolveSystemPrompt`)**: Computes the effective system prompt for a module by stacking the global prompt prefix on top of the module's default system prompt or user override.
- **Model Presets**: Pre-configures model recommendations (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemma-3-27b-it`, `gemma-3-12b-it`, etc.).

## 2. Pipeline Execution Hook (`usePipelineRunner`)

The custom hook in `app/src/hooks/usePipelineRunner.ts` connects studio module definitions to the 6 stage AI execution engine.

- **State Management**: Tracks current stage status (`pending`, `active`, `done`, `error`, `skipped`), overall execution status (`running`), error messages, and completed `PipelineRun` results.
- **Request Cancellation**: Manages an `AbortController` handle so users can stop stuck or in-flight generation requests instantly.

## 3. UI Component Hierarchy

```
App.tsx (Router & SettingsProvider)
└── StudioLayout (Sidebar & Top Navigation Header)
    ├── SettingsSheet (Modal drawer for Key, Model, Sampling, and Safety)
    └── Pages
        ├── Home (Landing page with module cards & track overview)
        ├── CopilotPage (Joke Copilot interface)
        ├── ExplainerPage (Explanation Engine interface)
        ├── TranslatorPage (Cultural Translator interface)
        ├── ImprovPage (Improv Partner interface)
        ├── Tight5Page (Tight 5 Generator interface)
        └── LabPage (Genome Lab interface)
```

## 4. Shared Visualization Components

### Humor Genome Radar (`GenomeRadar.tsx`)
Rendered using Recharts `RadarChart`. Displays an 8-axis polygon mapping the specimen's scores:
- `SUR`: Surprise
- `INC`: Incongruity
- `SUP`: Superiority
- `REL`: Relief
- `ABS`: Absurdity
- `WRM`: Warmth
- `EDG`: Edge
- `WRD`: Wordplay

### Humor Genome Barcode (`GenomeBarcode.tsx`)
A compact horizontal strip showing relative height bars for each of the 8 genome dimensions. Includes hover tooltips and gradient transitions.

### Pipeline Status Indicator (`PipelineStatus.tsx`)
Displays a live 6 stage progress bar at the top of active module views, giving real-time feedback during prompt assembly, API generation, schema validation, auto-repair, and critic passes.
