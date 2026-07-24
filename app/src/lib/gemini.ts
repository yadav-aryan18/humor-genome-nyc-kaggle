/**
 * Gemini / Gemma REST client (Google AI Studio — generativelanguage API).
 * Plain fetch, no SDK, so every knob of the request is user-tweakable.
 */

/**
 * Standardized error codes categorized for user friendly messaging and retry logic.
 */
export type ErrorCode =
  | 'INVALID_KEY'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMIT'
  | 'SAFETY_BLOCK'
  | 'EMPTY_RESPONSE'
  | 'NETWORK'
  | 'BAD_REQUEST'
  | 'TIMEOUT'
  | 'UNKNOWN';

/**
 * Custom error wrapper around Google AI Studio API responses.
 * Provides HTTP status codes, structured error reasons, and retry flags.
 */
export class GeminiError extends Error {
  code: ErrorCode;
  status?: number;
  retryable: boolean;
  raw?: unknown;

  constructor(code: ErrorCode, message: string, opts?: { status?: number; retryable?: boolean; raw?: unknown }) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.status = opts?.status;
    this.retryable = opts?.retryable ?? false;
    this.raw = opts?.raw;
  }
}

/**
 * Configuration options sent directly to the model decoder.
 */
export interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  seed?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: unknown;
}

/**
 * Simple multi-turn message unit representing user or assistant turns.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GenerateParams {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  contents: ChatMessage[];
  config: GenerationConfig;
  safetyThreshold: string; // 'DEFAULT' or a HarmBlockThreshold value
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface GenerateResult {
  text: string;
  finishReason?: string;
  usage?: { promptTokens?: number; outputTokens?: number; totalTokens?: number };
  raw: unknown;
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

const HARM_CATEGORIES = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
];

function buildBody(params: GenerateParams) {
  const { config, safetyThreshold } = params;
  const generationConfig: Record<string, unknown> = {
    temperature: config.temperature,
    topP: config.topP,
    topK: config.topK,
    maxOutputTokens: config.maxOutputTokens,
  };
  if (config.seed !== undefined && !Number.isNaN(config.seed)) generationConfig.seed = config.seed;
  if (config.stopSequences && config.stopSequences.length > 0) generationConfig.stopSequences = config.stopSequences;
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
  if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;

  const body: Record<string, unknown> = {
    contents: params.contents.map((c) => ({ role: c.role, parts: [{ text: c.text }] })),
    generationConfig,
  };
  if (params.systemInstruction && params.systemInstruction.trim()) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }
  if (safetyThreshold && safetyThreshold !== 'DEFAULT') {
    body.safetySettings = HARM_CATEGORIES.map((category) => ({ category, threshold: safetyThreshold }));
  }
  return body;
}

function mapHttpError(status: number, data: any): GeminiError {
  const msg: string = data?.error?.message ?? `HTTP ${status}`;
  if (status === 400) {
    if (/api key|API_KEY/i.test(msg)) return new GeminiError('INVALID_KEY', msg, { status, raw: data });
    return new GeminiError('BAD_REQUEST', msg, { status, raw: data });
  }
  if (status === 401 || status === 403) return new GeminiError('INVALID_KEY', msg, { status, raw: data });
  if (status === 404) return new GeminiError('MODEL_NOT_FOUND', msg, { status, raw: data });
  if (status === 429) return new GeminiError('RATE_LIMIT', msg, { status, retryable: true, raw: data });
  if (status >= 500) return new GeminiError('NETWORK', msg, { status, retryable: true, raw: data });
  return new GeminiError('UNKNOWN', msg, { status, raw: data });
}

/**
 * Sends a single non-streaming HTTP POST request to Google AI Studio REST endpoint.
 * Handles abort signals, timeout cancellation, HTTP status error mapping, and safety block checking.
 *
 * @param params Generation parameters including model ID, API key, system prompt, and sampling options.
 * @returns GenerateResult containing text, usage metadata, and raw JSON response.
 */
export async function generate(params: GenerateParams): Promise<GenerateResult> {
  const url = `${BASE}/models/${encodeURIComponent(params.model)}:generateContent`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), params.timeoutMs);
  // Link external signal
  const onAbort = () => controller.abort(params.signal?.reason);
  params.signal?.addEventListener('abort', onAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': params.apiKey },
      body: JSON.stringify(buildBody(params)),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    params.signal?.removeEventListener('abort', onAbort);
    if (err?.name === 'TimeoutError' || /timeout/i.test(err?.message ?? '')) {
      throw new GeminiError('TIMEOUT', `Request timed out after ${Math.round(params.timeoutMs / 1000)}s`, { retryable: true });
    }
    if (err?.name === 'AbortError') throw new GeminiError('UNKNOWN', 'Request cancelled');
    throw new GeminiError('NETWORK', err?.message ?? 'Network error', { retryable: true });
  }
  clearTimeout(timeout);
  params.signal?.removeEventListener('abort', onAbort);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw mapHttpError(res.status, data);

  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError(
      'SAFETY_BLOCK',
      `Prompt blocked: ${data.promptFeedback.blockReason}. Adjust safety settings or rephrase.`,
      { raw: data },
    );
  }
  const cand = data?.candidates?.[0];
  if (!cand) throw new GeminiError('EMPTY_RESPONSE', 'Model returned no candidates', { raw: data, retryable: true });
  if (cand.finishReason === 'SAFETY') {
    throw new GeminiError('SAFETY_BLOCK', 'Response blocked by safety filters. Adjust safety settings or rephrase.', { raw: data });
  }
  const text: string = (cand.content?.parts ?? []).map((p: any) => p?.text ?? '').join('');
  if (!text.trim()) {
    throw new GeminiError('EMPTY_RESPONSE', `Model returned empty text (finishReason: ${cand.finishReason ?? 'unknown'})`, {
      raw: data,
      retryable: cand.finishReason === 'MAX_TOKENS' ? false : true,
    });
  }
  return {
    text,
    finishReason: cand.finishReason,
    usage: data?.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          outputTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
    raw: data,
  };
}

export interface StreamParams extends GenerateParams {
  onChunk: (accumulated: string, delta: string) => void;
}

/** SSE streaming via streamGenerateContent?alt=sse */
export async function generateStream(params: StreamParams): Promise<GenerateResult> {
  const url = `${BASE}/models/${encodeURIComponent(params.model)}:streamGenerateContent?alt=sse`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), params.timeoutMs);
  const onAbort = () => controller.abort(params.signal?.reason);
  params.signal?.addEventListener('abort', onAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': params.apiKey },
      body: JSON.stringify(buildBody(params)),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    params.signal?.removeEventListener('abort', onAbort);
    if (err?.name === 'TimeoutError' || /timeout/i.test(err?.message ?? '')) {
      throw new GeminiError('TIMEOUT', `Request timed out after ${Math.round(params.timeoutMs / 1000)}s`, { retryable: true });
    }
    if (err?.name === 'AbortError') throw new GeminiError('UNKNOWN', 'Request cancelled');
    throw new GeminiError('NETWORK', err?.message ?? 'Network error', { retryable: true });
  }

  if (!res.ok || !res.body) {
    clearTimeout(timeout);
    params.signal?.removeEventListener('abort', onAbort);
    const data = await res.json().catch(() => ({}));
    throw mapHttpError(res.status, data);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';
  let lastRaw: unknown = null;
  let finishReason: string | undefined;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          lastRaw = json;
          const cand = json?.candidates?.[0];
          if (cand?.finishReason) finishReason = cand.finishReason;
          const delta = (cand?.content?.parts ?? []).map((p: any) => p?.text ?? '').join('');
          if (delta) {
            accumulated += delta;
            params.onChunk(accumulated, delta);
          }
        } catch {
          // partial JSON line — ignore, SSE will complete it
        }
      }
    }
  } finally {
    clearTimeout(timeout);
    params.signal?.removeEventListener('abort', onAbort);
  }

  if (!accumulated.trim()) {
    throw new GeminiError('EMPTY_RESPONSE', 'Stream finished with no text', { raw: lastRaw, retryable: true });
  }
  return { text: accumulated, finishReason, raw: lastRaw };
}

export interface ModelInfo {
  id: string;
  displayName: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

/** List models available to this API key that support generateContent. */
export async function listModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(`${BASE}/models?pageSize=200`, {
    headers: { 'x-goog-api-key': apiKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw mapHttpError(res.status, data);
  const models: any[] = data?.models ?? [];
  return models
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => ({
      id: String(m.name ?? '').replace(/^models\//, ''),
      displayName: m.displayName ?? m.name,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Best-effort extraction of a JSON object/array from model text output. */
export function extractJson(text: string): unknown {
  let t = text.trim();
  // strip markdown fences
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    /* continue */
  }
  const firstObj = t.indexOf('{');
  const firstArr = t.indexOf('[');
  const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
  if (start === -1) throw new Error('No JSON found in output');
  const isObj = t[start] === '{';
  const e = isObj ? t.lastIndexOf('}') : t.lastIndexOf(']');
  const finalEnd = e === -1 ? t.length : e + 1;
  const candidate = t.slice(start, finalEnd);
  try {
    return JSON.parse(candidate);
  } catch (err: any) {
    throw new Error(`JSON parse failed: ${err?.message ?? 'unknown'}`);
  }
}

export function friendlyError(err: unknown): string {
  if (err instanceof GeminiError) {
    switch (err.code) {
      case 'INVALID_KEY':
        return err.message.startsWith('Add your')
          ? err.message
          : 'API key rejected. Check your Google AI Studio key in Settings.';
      case 'MODEL_NOT_FOUND':
        return 'Model not found for this key. Open Settings and pick a model your key can access (use “Fetch models”).';
      case 'RATE_LIMIT':
        return 'Rate limited by the API. The pipeline will back off and retry — or try again in a moment.';
      case 'SAFETY_BLOCK':
        return err.message;
      case 'TIMEOUT':
        return err.message;
      case 'EMPTY_RESPONSE':
        return err.message;
      default:
        return err.message;
    }
  }
  return err instanceof Error ? err.message : String(err);
}
