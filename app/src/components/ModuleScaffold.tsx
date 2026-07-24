import type { ReactNode } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useOutletContext } from 'react-router';
import type { ModuleDef } from '@/lib/moduleDefs';
import type { Stage } from '@/lib/pipeline';
import { useSettings } from '@/lib/settings';
import { TrackBadge } from './controls';
import { PipelineStatus } from './PipelineStatus';
import { RawJsonViewer } from './misc';

export function KeyGateBanner() {
  const { openSettings } = useOutletContext<{ openSettings: () => void }>();
  return (
    <button
      type="button"
      onClick={openSettings}
      className="flex w-full items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-left transition-colors hover:bg-gold/15"
    >
      <Sparkles className="h-4 w-4 shrink-0 text-gold" />
      <span className="text-xs text-gold">
        <span className="font-semibold">Connect your Google AI Studio key</span> to run this module — grab one free at
        aistudio.google.com, then tap here.
      </span>
    </button>
  );
}

export function ModuleScaffold({
  module,
  controls,
  stages,
  error,
  resultSlot,
  meta,
}: {
  module: ModuleDef;
  controls: ReactNode;
  stages: Stage[];
  error: string | null;
  resultSlot: ReactNode;
  meta?: { model?: string; attempts?: number; repairs?: number; changelog?: string[]; raw?: unknown };
}) {
  const { hasKey } = useSettings();
  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
      {/* Controls */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">{module.name}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{module.description}</p>
            </div>
            <TrackBadge track={module.track} />
          </div>
          <div className="space-y-4">{controls}</div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4 min-w-0">
        {!hasKey && <KeyGateBanner />}
        <PipelineStatus stages={stages} />
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-300">Pipeline halted</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-red-200/80">{error}</p>
            </div>
          </div>
        )}
        {resultSlot}
        {meta?.changelog && meta.changelog.length > 0 && (
          <div className="rounded-xl border border-neon-violet/30 bg-neon-violet/5 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neon-violet">Critic pass applied</p>
            <ul className="mt-1.5 space-y-1">
              {meta.changelog.map((c, i) => (
                <li key={i} className="text-xs leading-relaxed text-foreground/80">
                  <span className="mr-1.5 text-neon-violet">▸</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {meta && (meta.model || meta.raw !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/70">
            {meta.model && (
              <span className="rounded-full border border-border bg-secondary/30 px-2.5 py-1 font-mono">
                {meta.model} · {meta.attempts ?? 1} attempt{(meta.attempts ?? 1) > 1 ? 's' : ''} · {meta.repairs ?? 0} repairs
              </span>
            )}
          </div>
        )}
        {meta?.raw !== undefined && <RawJsonViewer data={meta.raw} />}
      </div>
    </div>
  );
}
