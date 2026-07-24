import { useCallback, useRef, useState } from 'react';
import { INITIAL_STAGES, runPipeline, type PipelineRun, type Stage, type ValidationResult } from '@/lib/pipeline';
import { useSettings } from '@/lib/settings';
import { friendlyError } from '@/lib/gemini';
import type { ModuleDef } from '@/lib/moduleDefs';

/**
 * State object returned by the usePipelineRunner hook.
 * Manages active stages, execution state, output results, and abort controller handles.
 */
export interface RunnerState<T> {
  stages: Stage[];
  running: boolean;
  error: string | null;
  result: PipelineRun<T> | null;
  run: (inputs: Record<string, any>, overrides?: { userPrompt?: string }) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

/**
 * Generic custom hook that connects a studio module definition to the robust 6 stage AI pipeline.
 * Tracks live stage progression, manages request cancellation via AbortController, and captures structured error states.
 *
 * @template T The expected schema type for module output.
 * @param mod Module definition containing schemas, prompts, and validator functions.
 * @returns RunnerState containing reactive state values and runner triggers.
 */
export function usePipelineRunner<T>(mod: ModuleDef): RunnerState<T> {
  const { settings } = useSettings();
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineRun<T> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (inputs: Record<string, any>, overrides?: { userPrompt?: string }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setRunning(true);
      setError(null);
      setStages(INITIAL_STAGES.map((s) => ({ ...s })));
      try {
        const res = await runPipeline<T>({
          settings,
          moduleId: mod.id,
          defaultSystem: mod.defaultSystem,
          userPrompt: overrides?.userPrompt ?? mod.buildUserPrompt(inputs),
          schema: mod.schema,
          validate: mod.validate as (d: unknown) => ValidationResult<T>,
          onStages: setStages,
          signal: controller.signal,
        });
        setResult(res);
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setRunning(false);
      }
    },
    [mod, settings],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
    setError(null);
    setResult(null);
    setStages(INITIAL_STAGES.map((s) => ({ ...s })));
  }, []);

  return { stages, running, error, result, run, stop, reset };
}
