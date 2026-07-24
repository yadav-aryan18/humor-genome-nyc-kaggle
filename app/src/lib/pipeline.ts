import {
  extractJson,
  friendlyError,
  generate,
  GeminiError,
  type ChatMessage,
  type GenerationConfig,
  type GenerateResult,
} from './gemini';
import {
  parseFallbackModels,
  parseSeed,
  parseStopSequences,
  resolveSystemPrompt,
  type Settings,
} from './settings';

/**
 * Status of an individual pipeline stage in the self-healing process.
 */
export type StageStatus = 'pending' | 'active' | 'done' | 'error' | 'skipped';

/**
 * Representation of a pipeline execution stage for real-time UI status tracking.
 */
export interface Stage {
  id: 'assemble' | 'generate' | 'validate' | 'repair' | 'critique' | 'render';
  label: string;
  status: StageStatus;
  detail?: string;
}

/**
 * Initial set of pipeline stages initialized at the start of every module execution.
 */
export const INITIAL_STAGES: Stage[] = [
  { id: 'assemble', label: 'Assemble prompt', status: 'pending' },
  { id: 'generate', label: 'Generate', status: 'pending' },
  { id: 'validate', label: 'Validate schema', status: 'pending' },
  { id: 'repair', label: 'Auto-repair', status: 'pending' },
  { id: 'critique', label: 'Critic pass', status: 'pending' },
  { id: 'render', label: 'Render', status: 'pending' },
];

/**
 * Outcome of schema validation and field level coercion checks.
 */
export interface ValidationResult<T = unknown> {
  ok: boolean;
  errors: string[];
  data?: T;
}

/**
 * Final execution result returned after all pipeline stages complete.
 */
export interface PipelineRun<T> {
  data: T;
  raw: unknown;
  text: string;
  model: string;
  attempts: number;
  repairs: number;
  usage?: GenerateResult['usage'];
  changelog: string[];
}

interface RunParams<T> {
  settings: Settings;
  moduleId: string;
  defaultSystem: string;
  userPrompt: string;
  schema?: Record<string, unknown>;
  validate: (data: unknown) => ValidationResult<T>;
  onStages: (stages: Stage[]) => void;
  signal?: AbortSignal;
}

function setStage(stages: Stage[], id: Stage['id'], patch: Partial<Stage>): Stage[] {
  return stages.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new GeminiError('UNKNOWN', 'Request cancelled'));
    });
  });
}

const CRITIC_INSTRUCTIONS = `You are a ruthless but constructive comedy critic and script doctor.
You will receive a JSON payload produced by another AI. Your job:
1. Identify weak spots — flat punchlines, fuzzy wording, cultural mismatches, factual errors, anything that breaks the original brief.
2. Rewrite the payload so every field is noticeably stronger while preserving the exact same JSON shape and field names.

Return ONLY a JSON object of the form:
{
  "changelog": ["short bullet describing each concrete improvement you made"],
  "improved": { ...the full improved payload, same schema as the input... }
}`;

const REPAIR_INSTRUCTIONS = `The previous output failed schema validation. Fix it.
Rules:
- Return ONLY the corrected JSON object — no markdown fences, no commentary.
- Preserve everything that was already valid.
- Ensure every required field exists with the correct type.`;

/**
 * The robust humor pipeline.
 * assemble → generate (structured, retries + backoff + model fallback) →
 * validate → auto-repair loop → optional critic pass → render.
 */
export async function runPipeline<T>(params: RunParams<T>): Promise<PipelineRun<T>> {
  const { settings, schema, validate, onStages } = params;
  let stages: Stage[] = INITIAL_STAGES.map((s) => ({ ...s, status: 'pending' as StageStatus, detail: undefined }));
  const emit = () => onStages(stages.map((s) => ({ ...s })));

  if (!settings.apiKey.trim()) {
    stages = setStage(stages, 'generate', { status: 'error', detail: 'No API key — add one in Settings' });
    emit();
    throw new GeminiError('INVALID_KEY', 'Add your Google AI Studio API key in Settings (top-right) to run the pipeline.');
  }

  // ---- 1. ASSEMBLE ----
  stages = setStage(stages, 'assemble', { status: 'active' });
  emit();
  const system = resolveSystemPrompt(settings, params.moduleId, params.defaultSystem);
  const config: GenerationConfig = {
    temperature: settings.temperature,
    topP: settings.topP,
    topK: settings.topK,
    maxOutputTokens: settings.maxOutputTokens,
    seed: parseSeed(settings.seed),
    stopSequences: parseStopSequences(settings.stopSequences),
  };
  if (settings.jsonMode && schema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = schema;
  }
  stages = setStage(stages, 'assemble', {
    status: 'done',
    detail: `${system.length + params.userPrompt.length} chars · ${settings.jsonMode && schema ? 'structured JSON mode' : 'free-text mode'}`,
  });
  emit();

  // ---- 2. GENERATE (retry + fallback models) ----
  stages = setStage(stages, 'generate', { status: 'active', detail: `model: ${settings.model}` });
  emit();

  const modelsToTry = [settings.model.trim(), ...parseFallbackModels(settings.fallbackModels)].filter(Boolean);
  let result: GenerateResult | null = null;
  let usedModel = modelsToTry[0];
  let attempts = 0;
  let lastError: unknown = null;
  let jsonModeDisabledByModel = false;

  outer: for (const model of modelsToTry) {
    usedModel = model;
    for (let attempt = 1; attempt <= Math.max(1, settings.maxRetries); attempt++) {
      attempts++;
      try {
        const effectiveConfig = { ...config };
        if (jsonModeDisabledByModel) {
          delete effectiveConfig.responseMimeType;
          delete effectiveConfig.responseSchema;
        }
        result = await generate({
          apiKey: settings.apiKey,
          model,
          systemInstruction: system,
          contents: [{ role: 'user', text: params.userPrompt }],
          config: effectiveConfig,
          safetyThreshold: settings.safetyThreshold,
          timeoutMs: settings.timeoutSec * 1000,
          signal: params.signal,
        });
        stages = setStage(stages, 'generate', {
          status: 'done',
          detail: `${model} · attempt ${attempt}${jsonModeDisabledByModel ? ' · JSON mode off (model fallback)' : ''}`,
        });
        emit();
        break outer;
      } catch (err) {
        lastError = err;
        const e = err as GeminiError;
        // Model doesn't exist → jump straight to next fallback model
        if (e.code === 'MODEL_NOT_FOUND' || e.code === 'INVALID_KEY' || e.code === 'SAFETY_BLOCK') {
          stages = setStage(stages, 'generate', { status: 'active', detail: `${model}: ${e.code} → trying next model` });
          emit();
          continue outer;
        }
        // Model rejects responseSchema → drop JSON mode and retry same model
        if (e.code === 'BAD_REQUEST' && /responseSchema|response_schema|JSON/i.test(e.message) && config.responseSchema) {
          jsonModeDisabledByModel = true;
          stages = setStage(stages, 'generate', { status: 'active', detail: `${model} rejected schema → free-text JSON mode` });
          emit();
          continue;
        }
        if (e.retryable && attempt < settings.maxRetries) {
          const wait = Math.min(8000, 700 * 2 ** (attempt - 1));
          stages = setStage(stages, 'generate', {
            status: 'active',
            detail: `${model} · attempt ${attempt} failed (${e.code}) → retrying in ${(wait / 1000).toFixed(1)}s`,
          });
          emit();
          await sleep(wait, params.signal);
          continue;
        }
        // Exhausted retries for this model → next fallback
        stages = setStage(stages, 'generate', { status: 'active', detail: `${model} exhausted → next fallback` });
        emit();
        continue outer;
      }
    }
  }

  if (!result) {
    stages = setStage(stages, 'generate', { status: 'error', detail: friendlyError(lastError) });
    emit();
    throw lastError instanceof Error ? lastError : new Error('Generation failed');
  }

  // If JSON mode was off by choice or schema missing → return raw text wrapped
  if (!schema) {
    stages = setStage(stages, 'validate', { status: 'skipped', detail: 'no schema (free-text module)' });
    stages = setStage(stages, 'repair', { status: 'skipped' });
    stages = setStage(stages, 'critique', { status: settings.critiquePass ? 'skipped' : 'skipped', detail: 'n/a for free-text' });
    stages = setStage(stages, 'render', { status: 'done' });
    emit();
    return {
      data: result.text as T,
      raw: result.raw,
      text: result.text,
      model: usedModel,
      attempts,
      repairs: 0,
      usage: result.usage,
      changelog: [],
    };
  }

  // ---- 3. VALIDATE ----
  stages = setStage(stages, 'validate', { status: 'active' });
  emit();
  let parsed: unknown = null;
  let validation: ValidationResult<T> = { ok: false, errors: ['not parsed'] };
  let repairs = 0;
  try {
    parsed = extractJson(result.text);
    validation = validate(parsed);
  } catch (err: any) {
    validation = { ok: false, errors: [`JSON extraction failed: ${err?.message ?? 'unknown'}`] };
  }

  // ---- 4. AUTO-REPAIR LOOP ----
  let currentText = result.text;
  while (!validation.ok && repairs < settings.repairAttempts) {
    repairs++;
    stages = setStage(stages, 'validate', {
      status: 'error',
      detail: validation.errors.slice(0, 2).join(' · '),
    });
    stages = setStage(stages, 'repair', { status: 'active', detail: `repair pass ${repairs}/${settings.repairAttempts}` });
    emit();

    const repairMessages: ChatMessage[] = [
      { role: 'user', text: params.userPrompt },
      { role: 'model', text: currentText.slice(0, 12000) },
      {
        role: 'user',
        text: `${REPAIR_INSTRUCTIONS}\n\nValidation errors:\n${validation.errors.map((e) => `- ${e}`).join('\n')}`,
      },
    ];
    try {
      const repaired = await generate({
        apiKey: settings.apiKey,
        model: usedModel,
        systemInstruction: system,
        contents: repairMessages,
        config: { ...config, responseMimeType: 'application/json', responseSchema: schema },
        safetyThreshold: settings.safetyThreshold,
        timeoutMs: settings.timeoutSec * 1000,
        signal: params.signal,
      });
      currentText = repaired.text;
      const reparsed = extractJson(currentText);
      validation = validate(reparsed);
      if (validation.ok) {
        parsed = reparsed;
        result = repaired;
        stages = setStage(stages, 'repair', { status: 'done', detail: `fixed after ${repairs} pass${repairs > 1 ? 'es' : ''}` });
      }
    } catch (err) {
      lastError = err;
      stages = setStage(stages, 'repair', { status: 'active', detail: `repair pass ${repairs} failed — ${friendlyError(err)}` });
      emit();
    }
  }

  if (!validation.ok) {
    stages = setStage(stages, 'validate', { status: 'error', detail: validation.errors.slice(0, 2).join(' · ') });
    if (repairs === 0) stages = setStage(stages, 'repair', { status: 'skipped', detail: 'repair disabled' });
    else stages = setStage(stages, 'repair', { status: 'error', detail: 'could not fully repair' });
    emit();
    throw new GeminiError(
      'BAD_REQUEST',
      `The model output never matched the required schema.\n${validation.errors.map((e) => `• ${e}`).join('\n')}\nTry lowering temperature, switching model, or enabling JSON mode.`,
    );
  }

  stages = setStage(stages, 'validate', { status: 'done', detail: 'schema OK' });
  if (repairs === 0) stages = setStage(stages, 'repair', { status: 'skipped', detail: 'not needed' });
  emit();

  // ---- 5. CRITIC PASS (optional) ----
  let finalData = validation.data as T;
  let changelog: string[] = [];
  if (settings.critiquePass) {
    stages = setStage(stages, 'critique', { status: 'active', detail: 'critic is reviewing…' });
    emit();
    const criticSchema = {
      type: 'OBJECT',
      properties: {
        changelog: { type: 'ARRAY', items: { type: 'STRING' } },
        improved: schema,
      },
      required: ['changelog', 'improved'],
    };
    try {
      const crit = await generate({
        apiKey: settings.apiKey,
        model: usedModel,
        systemInstruction: CRITIC_INSTRUCTIONS,
        contents: [
          {
            role: 'user',
            text: `Original brief:\n${params.userPrompt}\n\nPayload to critique and improve:\n${JSON.stringify(finalData, null, 2)}`,
          },
        ],
        config: { ...config, responseMimeType: 'application/json', responseSchema: criticSchema },
        safetyThreshold: settings.safetyThreshold,
        timeoutMs: settings.timeoutSec * 1000,
        signal: params.signal,
      });
      const critParsed: any = extractJson(crit.text);
      const improvedValidation = validate(critParsed?.improved);
      if (improvedValidation.ok) {
        finalData = improvedValidation.data as T;
        changelog = Array.isArray(critParsed.changelog) ? critParsed.changelog.map(String) : [];
        stages = setStage(stages, 'critique', { status: 'done', detail: `${changelog.length} improvements applied` });
      } else {
        stages = setStage(stages, 'critique', { status: 'done', detail: 'critic output invalid — kept original' });
      }
    } catch (err) {
      stages = setStage(stages, 'critique', { status: 'done', detail: `critic failed (${friendlyError(err)}) — kept original` });
    }
    emit();
  } else {
    stages = setStage(stages, 'critique', { status: 'skipped', detail: 'disabled in Settings' });
    emit();
  }

  // ---- 6. RENDER ----
  stages = setStage(stages, 'render', { status: 'done', detail: 'ready' });
  emit();

  return {
    data: finalData,
    raw: result.raw,
    text: currentText,
    model: usedModel,
    attempts,
    repairs,
    usage: result.usage,
    changelog,
  };
}
