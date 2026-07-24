import { useState } from 'react';
import { Dna, ShieldAlert, Square, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getModule } from '@/lib/moduleDefs';
import { usePipelineRunner } from '@/hooks/usePipelineRunner';
import { ModuleScaffold } from '@/components/ModuleScaffold';
import { Field, ScoreBar } from '@/components/controls';
import { CopyButton, EmptyState } from '@/components/misc';
import { GenomeBarcode, GenomeRadar, type Genome } from '@/components/GenomeRadar';

const mod = getModule('lab');

interface LabResult {
  genome: Genome;
  dominantMechanism: string;
  theories: { name: string; fit: number; note: string }[];
  riskAnalysis: { punchDirection: string; targets: string[]; tabooLevel: number; riskyPhrases: string[] };
  audienceMap: { segment: string; fit: number }[];
  rewrites: { angle: string; joke: string }[];
}

const PUNCH_COLORS: Record<string, string> = {
  up: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  self: 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan',
  lateral: 'border-gold/40 bg-gold/10 text-gold',
  down: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export default function LabPage() {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const runner = usePipelineRunner<LabResult>(mod);

  const r = runner.result?.data;

  return (
    <ModuleScaffold
      module={mod}
      stages={runner.stages}
      error={runner.error}
      meta={runner.result ? { model: runner.result.model, attempts: runner.result.attempts, repairs: runner.result.repairs, changelog: runner.result.changelog, raw: runner.result.data } : undefined}
      controls={
        <>
          <Field label="Specimen" hint="Any humor text: a joke, a tweet, a sketch line, a meme caption.">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="My therapist says I have a fear of commitment. Which is rich, coming from someone I pay to hang out with me."
              className="border-border bg-secondary/30 text-sm leading-relaxed"
            />
          </Field>
          <Field label="Context (optional)">
            <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="posted on X, said at a wedding…" className="border-border bg-secondary/30 text-sm" />
          </Field>
          <Button
            onClick={() => (runner.running ? runner.stop() : runner.run({ text, context }))}
            disabled={!runner.running && !text.trim()}
            className="w-full bg-gold font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_24px_-6px_hsl(42_96%_55%/0.7)] disabled:opacity-40"
          >
            {runner.running ? (
              <>
                <Square className="mr-2 h-3.5 w-3.5" /> Stop
              </>
            ) : (
              <>
                <Dna className="mr-2 h-3.5 w-3.5" /> Sequence genome
              </>
            )}
          </Button>
        </>
      }
      resultSlot={
        r ? (
          <div className="space-y-4">
            {/* Genome profile */}
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-gold/25 bg-card/60 p-5 card-glow-gold">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Genome profile</p>
                <GenomeRadar genome={r.genome} size={280} />
                <p className="text-center text-[11px] text-muted-foreground">
                  dominant mechanism: <span className="font-semibold text-gold">{r.dominantMechanism}</span>
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">DNA barcode</p>
                  <div className="mt-3">
                    <GenomeBarcode genome={r.genome} />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {(Object.keys(r.genome) as (keyof Genome)[]).map((k) => (
                      <ScoreBar key={k} label={k} value={r.genome[k]} color={k === 'edge' ? 'magenta' : k === 'warmth' ? 'cyan' : 'gold'} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Theories */}
            <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Theory fit</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {r.theories.map((t, i) => (
                  <div key={i} className="rounded-xl border border-border bg-secondary/20 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/90">{t.name}</span>
                      <span className="font-mono text-[11px] text-neon-violet">{t.fit.toFixed(0)}/10</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-neon-violet transition-all duration-700" style={{ width: `${t.fit * 10}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk + audience */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  <ShieldAlert className="h-3 w-3" /> Risk analysis
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${PUNCH_COLORS[r.riskAnalysis.punchDirection.toLowerCase()] ?? PUNCH_COLORS.lateral}`}>
                    punches {r.riskAnalysis.punchDirection}
                  </span>
                  <span className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-[11px] text-muted-foreground">
                    taboo level <span className="font-mono text-foreground/80">{r.riskAnalysis.tabooLevel.toFixed(0)}/10</span>
                  </span>
                </div>
                {r.riskAnalysis.targets.length > 0 && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground/70">Targets:</span> {r.riskAnalysis.targets.join(', ')}
                  </p>
                )}
                {r.riskAnalysis.riskyPhrases.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {r.riskAnalysis.riskyPhrases.map((p, i) => (
                      <p key={i} className="rounded border border-red-500/20 bg-red-500/5 px-2 py-1 font-mono text-[10px] text-red-300/80">
                        “{p}”
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  <Users className="h-3 w-3" /> Audience fit map
                </p>
                <div className="mt-3 space-y-2">
                  {r.audienceMap.map((a, i) => (
                    <ScoreBar key={i} label={a.segment} value={a.fit} color={a.fit >= 7 ? 'gold' : a.fit >= 4 ? 'violet' : 'magenta'} />
                  ))}
                </div>
              </div>
            </div>

            {/* Rewrites */}
            {r.rewrites.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Genome-shift rewrites</p>
                {r.rewrites.map((rw, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-neon-violet">{rw.angle}</p>
                      <CopyButton text={rw.joke} />
                    </div>
                    <p className="mt-2 font-display text-sm font-medium leading-relaxed text-foreground/90">{rw.joke}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          !runner.running && (
            <EmptyState
              icon={<Dna className="h-6 w-6" />}
              title="The sequencer is warmed up"
              body="Drop in any humor specimen and the Lab will score its 8-dimension genome, test it against the major humor theories, run a punch-direction risk analysis, and propose genome-shifting rewrites."
            />
          )
        )
      }
    />
  );
}
