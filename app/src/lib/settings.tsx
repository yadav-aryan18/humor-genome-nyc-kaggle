import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface Settings {
  /** Connection */
  apiKey: string;
  model: string;
  fallbackModels: string; // comma-separated fallbacks tried in order
  /** Sampling */
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  seed: string; // '' = unset
  stopSequences: string; // comma-separated
  /** Pipeline behavior */
  jsonMode: boolean;
  streaming: boolean;
  critiquePass: boolean;
  maxRetries: number;
  repairAttempts: number;
  timeoutSec: number;
  safetyThreshold: string; // 'DEFAULT' | BLOCK_* values
  /** Prompts */
  globalSystemPrompt: string;
  promptOverrides: Record<string, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemma-4-31b-it',
  fallbackModels: 'gemma-4-26b-a4b-it, gemini-3.5-flash-lite',
  temperature: 1.0,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  seed: '',
  stopSequences: '',
  jsonMode: true,
  streaming: false,
  critiquePass: false,
  maxRetries: 3,
  repairAttempts: 2,
  timeoutSec: 90,
  safetyThreshold: 'DEFAULT',
  globalSystemPrompt: '',
  promptOverrides: {},
};

export const MODEL_PRESETS = [
  { id: 'gemma-4-31b-it', label: 'Gemma 4 31B IT', hint: 'open weights, hackathon star, default' },
  { id: 'gemma-4-26b-a4b-it', label: 'Gemma 4 26B A4B IT', hint: 'lighter open model' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', hint: 'fast + smart' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', hint: 'previous-gen fast + quick' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', hint: 'deepest reasoning' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', hint: 'tiny + quick' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'edge-size' },
];

export const SAFETY_OPTIONS = [
  { id: 'DEFAULT', label: 'API default' },
  { id: 'BLOCK_LOW_AND_ABOVE', label: 'Strict — block low & above' },
  { id: 'BLOCK_MEDIUM_AND_ABOVE', label: 'Balanced — block medium & above' },
  { id: 'BLOCK_ONLY_HIGH', label: 'Loose — block only high' },
  { id: 'BLOCK_NONE', label: 'Off — block nothing (edgy comedy)' },
];

const STORAGE_KEY = 'hgs-settings-v1';

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  setOverride: (moduleId: string, prompt: string) => void;
  resetAll: () => void;
  hasKey: boolean;
}

const Ctx = createContext<SettingsCtx | null>(null);

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, promptOverrides: parsed.promptOverrides ?? {} };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage full / private mode — ignore */
    }
  }, [settings]);

  const value = useMemo<SettingsCtx>(
    () => ({
      settings,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      setOverride: (moduleId, prompt) =>
        setSettings((s) => ({ ...s, promptOverrides: { ...s.promptOverrides, [moduleId]: prompt } })),
      resetAll: () => setSettings(DEFAULT_SETTINGS),
      hasKey: settings.apiKey.trim().length > 0,
    }),
    [settings],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

/** Resolve the effective system prompt for a module (override > global prefix + default). */
export function resolveSystemPrompt(settings: Settings, moduleId: string, defaultSystem: string): string {
  const override = settings.promptOverrides[moduleId];
  const base = override && override.trim() ? override : defaultSystem;
  const global = settings.globalSystemPrompt.trim();
  return global ? `${global}\n\n${base}` : base;
}

export function parseStopSequences(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function parseFallbackModels(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseSeed(raw: string): number | undefined {
  const n = parseInt(raw, 10);
  return raw.trim() && !Number.isNaN(n) ? n : undefined;
}
