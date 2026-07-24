import { Check, CircleDashed, Loader2, Minus, X } from 'lucide-react';
import type { Stage } from '@/lib/pipeline';
import { cn } from '@/lib/utils';

function StageIcon({ status }: { status: Stage['status'] }) {
  switch (status) {
    case 'active':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />;
    case 'done':
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case 'error':
      return <X className="h-3.5 w-3.5 text-red-400" />;
    case 'skipped':
      return <Minus className="h-3.5 w-3.5 text-muted-foreground/50" />;
    default:
      return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/40" />;
  }
}

export function PipelineStatus({ stages, compact = false }: { stages: Stage[]; compact?: boolean }) {
  if (compact) {
    const active = stages.find((s) => s.status === 'active');
    const done = stages.filter((s) => s.status === 'done').length;
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {active ? <Loader2 className="h-3 w-3 animate-spin text-gold" /> : <Check className="h-3 w-3 text-emerald-400" />}
        <span className="font-mono">
          {active ? active.label : `${done}/${stages.length} stages`}
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                s.status === 'active' && 'border-gold/50 bg-gold/10 text-gold',
                s.status === 'done' && 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300/90',
                s.status === 'error' && 'border-red-500/40 bg-red-500/10 text-red-300',
                s.status === 'skipped' && 'border-border bg-secondary/30 text-muted-foreground/50 line-through',
                s.status === 'pending' && 'border-border bg-secondary/20 text-muted-foreground/60',
              )}
            >
              <StageIcon status={s.status} />
              {s.label}
            </div>
            {i < stages.length - 1 && <div className="mx-1 h-px w-3 bg-border" />}
          </div>
        ))}
      </div>
      {stages.some((s) => s.detail) && (
        <div className="mt-2 space-y-0.5 border-t border-border/60 pt-2">
          {stages
            .filter((s) => s.detail && (s.status === 'active' || s.status === 'error' || s.status === 'done'))
            .map((s) => (
              <p key={s.id} className="truncate font-mono text-[10px] text-muted-foreground/80">
                <span className="text-muted-foreground/50">{s.id}:</span> {s.detail}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
