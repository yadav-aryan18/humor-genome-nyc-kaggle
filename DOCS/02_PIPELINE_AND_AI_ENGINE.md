# Pipeline and AI Engine Specification

The intelligence layer of Humor Genome Studio is driven by two main modules in `app/src/lib/`:
1. `gemini.ts` — Direct REST client for Google AI Studio API endpoints.
2. `pipeline.ts` — The 6 stage self healing pipeline that turns non-deterministic LLM responses into structured, schema validated UI payloads.

## 1. REST Client Architecture (`gemini.ts`)

The REST client avoids heavy SDK wrappers, using standard browser `fetch` calls directly against the `v1beta` Google Generative Language endpoints.

### Non Streaming Generation (`generate`)
Sends a `POST` request to `/models/{model}:generateContent`.

Key logic handling:
- **Timeout Controller**: Uses `AbortController` linked with `setTimeout` to enforce configured timeouts (default 90s).
- **Safety Threshold Mapping**: Translates user safety choices (`BLOCK_NONE`, `BLOCK_ONLY_HIGH`, etc.) into `safetySettings` array covering harassment, hate speech, explicit content, and dangerous content.
- **Error Normalization**: Maps HTTP status codes to `GeminiError` instances with explicit `retryable` flags:
  - 400 with API key error -> `INVALID_KEY`
  - 404 -> `MODEL_NOT_FOUND`
  - 429 -> `RATE_LIMIT` (retryable)
  - 5xx -> `NETWORK` (retryable)

### Server Sent Events Streaming (`generateStream`)
Sends a `POST` request to `/models/{model}:streamGenerateContent?alt=sse`.

Processes incoming SSE chunks line by line:
- Strips `data:` prefixes.
- Parses incremental candidate JSON payloads.
- Extracts `text` parts and invokes the `onChunk(accumulated, delta)` callback for real time UI updates.

### Model Discovery (`listModels`)
Fetches `/models?pageSize=200` to list all models available to the configured API key that support `generateContent`.

---

## 2. The 6 Stage Self Healing Pipeline (`pipeline.ts`)

Structured AI generation often fails when models return invalid JSON, missing keys, or out of bound values. To prevent application crashes, every module invocation follows a 6 stage pipeline:

```
[1. Assemble] -> [2. Generate] -> [3. Validate] -> [4. Auto-Repair] -> [5. Critic Pass] -> [6. Render]
```

### Stage 1: Assemble
- Resolves system prompt (combines global prefix + default prompt or user override).
- Prepares generation config (temperature, topP, topK, maxTokens, seed, stopSequences).
- If JSON mode is enabled and a module schema exists, attaches `responseMimeType: "application/json"` and `responseSchema`.

### Stage 2: Generate
- Iterates through the model list (`primary model` followed by `fallback models`).
- Executes up to `maxRetries` per model using exponential backoff (e.g. 700ms, 1400ms, 2800ms).
- If a model rejects `responseSchema` (400 Bad Request), the pipeline automatically drops structured JSON mode and retries in free text JSON mode.

### Stage 3: Validate
- Uses `extractJson()` to isolate JSON objects from raw text (stripping markdown code blocks if present).
- Runs the module's custom TypeScript `validate(data)` function.
- Performs field level sanitization and coercion (clamping genome scores to 0-10, normalizing missing arrays).

### Stage 4: Auto-Repair
- If validation fails, the pipeline enters a repair loop (up to `repairAttempts` passes).
- Sends the user prompt, the model's invalid text output, and the specific validation error messages back to the LLM with explicit instruction to return corrected JSON matching the schema.

### Stage 5: Critic Pass (Optional)
- If enabled in settings, passes the validated JSON to a secondary LLM call acting as a "ruthless comedy critic and script doctor".
- The critic evaluates the payload, writes a bulleted `changelog` of improvements, and returns an `improved` payload matching the module schema.
- The improved payload is re-validated. If valid, it replaces the original payload.

### Stage 6: Render
- Emits final typed data payload to the React UI layer.
