import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ---------- Field wrapper ---------- */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

/* ---------- Chip multi/single select with custom option ---------- */
export function ChipSelect({
  options,
  value,
  onChange,
  allowCustom = true,
  customPlaceholder = 'or type your own…',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) {
  const [custom, setCustom] = useState('');
  const isPreset = options.includes(value);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              value === opt
                ? 'border-gold/70 bg-gold/15 text-gold shadow-[0_0_12px_-2px_hsl(42_96%_55%/0.4)]'
                : 'border-border bg-secondary/40 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {allowCustom && (
        <Input
          value={isPreset ? '' : value || custom}
          placeholder={customPlaceholder}
          onChange={(e) => {
            setCustom(e.target.value);
            onChange(e.target.value);
          }}
          className="h-8 border-border bg-secondary/30 text-xs placeholder:text-muted-foreground/50"
        />
      )}
    </div>
  );
}

/* ---------- Slider with live value ---------- */
export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  hint,
  marks,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  hint?: string;
  marks?: [string, string];
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="flex-1 [&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
        />
        <span className="w-16 shrink-0 rounded-md border border-border bg-secondary/40 px-2 py-1 text-center font-mono text-xs text-gold">
          {format ? format(value) : value}
        </span>
      </div>
      {marks && (
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>{marks[0]}</span>
          <span>{marks[1]}</span>
        </div>
      )}
    </Field>
  );
}

/* ---------- Horizontal score bar ---------- */
export function ScoreBar({ label, value, color = 'gold' }: { label: string; value: number; color?: 'gold' | 'violet' | 'magenta' | 'cyan' }) {
  const colors: Record<string, string> = {
    gold: 'bg-gold',
    violet: 'bg-neon-violet',
    magenta: 'bg-neon-magenta',
    cyan: 'bg-neon-cyan',
  };
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] capitalize text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-700', colors[color])}
          style={{ width: `${Math.max(0, Math.min(100, value * 10))}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-[11px] text-foreground/80">{value.toFixed(1)}</span>
    </div>
  );
}

/* ---------- Track badge ---------- */
export function TrackBadge({ track }: { track: 'creation' | 'understanding' | 'performance' }) {
  const map = {
    creation: { label: 'Creation', cls: 'border-gold/40 bg-gold/10 text-gold' },
    understanding: { label: 'Understanding', cls: 'border-neon-violet/40 bg-neon-violet/10 text-neon-violet' },
    performance: { label: 'Performance', cls: 'border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta' },
  } as const;
  const m = map[track];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest', m.cls)}>
      {m.label}
    </span>
  );
}
