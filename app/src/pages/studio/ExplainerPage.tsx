import { useEffect, useState } from 'react';
import { ArrowRight, FlaskConical, Play, Square, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getModule } from '@/lib/moduleDefs';
import { usePipelineRunner } from '@/hooks/usePipelineRunner';
import { ModuleScaffold } from '@/components/ModuleScaffold';
import { Field } from '@/components/controls';
import { EmptyState } from '@/components/misc';
import { GenomeRadar, type Genome } from '@/components/GenomeRadar';

const mod = getModule('explain');

interface ExplainResult {
  summary: string;
  structure: { label: string; text: string; role: string }[];
  mechanisms: { name: string; explanation: string; strength: number }[];
  whyItWorks: string;
  audienceFit: string;
  improvements: string[];
  genome: Genome;
}

const ROLE_COLORS: Record<string, string> = {
  setup: 'border-neon-cyan/50 text-neon-cyan',
  pivot: 'border-gold/50 text-gold',
  turn: 'border-gold/50 text-gold',
  punchline: 'border-neon-magenta/50 text-neon-magenta',
  tag: 'border-neon-violet/50 text-neon-violet',
};

export default function ExplainerPage() {
  const [joke, setJoke] = useState('');
  const [context, setContext] = useState('');
  const runner = usePipelineRunner<ExplainResult>(mod);

  useEffect(() => {
    const handoff = sessionStorage.getItem('hgs-handoff-explain');
    if (handoff) {
      setJoke(handoff);
      sessionStorage.removeItem('hgs-handoff-explain');
    }
  }, []);

  const r = runner.result?.data;

  return (
    <ModuleScaffold
      module={mod}
      stages={runner.stages}
      error={runner.error}
      meta={runner.result ? { model: runner.result.model, attempts: runner.result.attempts, repairs: runner.result.repairs, changelog: runner.result.changelog, raw: runner.result.data } : undefined}
      controls={
        <>
          <Field label="The joke" hint="Paste any joke — yours, a famous one, or one the Copilot just wrote.">
            <Textarea
              value={joke}
              onChange={(e) => setJoke(e.target.value)}
              rows={5}
              placeholder="I told my wife she was drawing her eyebrows too high. She looked surprised."
              className="border-border bg-secondary/30 text-sm leading-relaxed"
            />
          </Field>
          <Field label="Audience / context (optional)">
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="open mic in Berlin, corporate keynote…"
              className="border-border bg-secondary/30 text-sm"
            />
          </Field>
          <Button
            onClick={() => (runner.running ? runner.stop() : runner.run({ joke, context }))}
            disabled={!runner.running && !joke.trim()}
            className="w-full bg-gold font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_24px_-6px_hsl(42_96%_55%/0.7)] disabled:opacity-40"
          >
            {runner.running ? (
              <>
                <Square className="mr-2 h-3.5 w-3.5" /> Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-3.5 w-3.5" /> Dissect joke
              </>
            )}
          </Button>
        </>
      }
      resultSlot={
        r ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Verdict</p>
              <p className="mt-2 font-display text-base font-medium leading-relaxed text-foreground/90">{r.summary}</p>
            </div>

            {/* Structure map */}
            <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Structure map</p>
              <div className="mt-3 space-y-0">
                {r.structure.map((s, i) => {
                  const color = Object.entries(ROLE_COLORS).find(([k]) => s.label.toLowerCase().includes(k))?.[1] ?? 'border-border text-muted-foreground';
                  return (
                    <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < r.structure.length - 1 && <div className="absolute left-[7px] top-5 h-full w-px bg-border" />}
                      <div className={`z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-background ${color.split(' ')[0]}`} />
                      <div className="min-w-0">
                        <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${color.split(' ')[1]}`}>{s.label}</span>
                        <p className="mt-0.5 text-sm italic leading-relaxed text-foreground/90">“{s.text}”</p>
                        {s.role && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{s.role}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {/* Mechanisms */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Mechanisms at work</p>
                <div className="mt-3 space-y-4">
                  {r.mechanisms.map((m, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-neon-violet">{m.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{m.strength.toFixed(0)}/10</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{m.explanation}</p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-neon-violet transition-all duration-700" style={{ width: `${m.strength * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genome */}
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Humor genome</p>
                <GenomeRadar genome={r.genome} size={260} />
              </div>
            </div>

            {/* Why + audience */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Why the laugh happens</p>
                <p className="mt-2 text-xs leading-relaxed text-foreground/85">{r.whyItWorks}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Who laughs, who doesn't</p>
                <p className="mt-2 text-xs leading-relaxed text-foreground/85">{r.audienceFit}</p>
              </div>
            </div>

            {/* Improvements */}
            {r.improvements.length > 0 && (
              <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  <Wrench className="h-3 w-3" /> Punch-up suggestions
                </p>
                <ul className="mt-3 space-y-2">
                  {r.improvements.map((imp, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/85">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          !runner.running && (
            <EmptyState
              icon={<FlaskConical className="h-6 w-6" />}
              title="Specimen tray is empty"
              body="Paste a joke and the Explanation Engine will map its structure, name the mechanisms firing inside it, and score its humor genome — without killing the frog."
            />
          )
        )
      }
    />
  );
}
