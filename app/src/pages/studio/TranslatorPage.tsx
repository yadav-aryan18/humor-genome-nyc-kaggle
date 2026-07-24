import { useState } from 'react';
import { ArrowLeftRight, ArrowRight, Languages, ShieldAlert, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getModule } from '@/lib/moduleDefs';
import { usePipelineRunner } from '@/hooks/usePipelineRunner';
import { ModuleScaffold } from '@/components/ModuleScaffold';
import { ChipSelect, Field } from '@/components/controls';
import { CopyButton, EmptyState } from '@/components/misc';

const mod = getModule('translate');

const CULTURES = [
  'United States',
  'United Kingdom',
  'India',
  'Japan',
  'Germany',
  'France',
  'Brazil',
  'Mexico',
  'Nigeria',
  'China',
  'South Korea',
  'Italy',
  'Egypt',
  'Australia',
];
const STRATEGIES = ['fully localized rewrite', 'reference swap only', 'keep structure, rebuild wordplay', 'faithful but footnoted'];

interface TranslateResult {
  literal: string;
  adaptations: {
    joke: string;
    whyItWorks: string;
    swaps: { from: string; to: string; reason: string }[];
    risk: string;
  }[];
  culturalNotes: string;
  tabooWarnings: string[];
}

export default function TranslatorPage() {
  const [joke, setJoke] = useState('');
  const [sourceCulture, setSourceCulture] = useState('United States');
  const [targetCulture, setTargetCulture] = useState('Japan');
  const [strategy, setStrategy] = useState('fully localized rewrite');
  const [preserveEdge, setPreserveEdge] = useState(true);
  const [context, setContext] = useState('');
  const runner = usePipelineRunner<TranslateResult>(mod);

  const r = runner.result?.data;

  return (
    <ModuleScaffold
      module={mod}
      stages={runner.stages}
      error={runner.error}
      meta={runner.result ? { model: runner.result.model, attempts: runner.result.attempts, repairs: runner.result.repairs, changelog: runner.result.changelog, raw: runner.result.data } : undefined}
      controls={
        <>
          <Field label="The joke">
            <Textarea
              value={joke}
              onChange={(e) => setJoke(e.target.value)}
              rows={4}
              placeholder="Why did the American bring a ladder to the bar? Because he heard the drinks were on the house."
              className="border-border bg-secondary/30 text-sm leading-relaxed"
            />
          </Field>
          <Field label="Source culture / language">
            <ChipSelect options={CULTURES} value={sourceCulture} onChange={setSourceCulture} customPlaceholder="e.g. Turkey, Quebec…" />
          </Field>
          <Field label="Target culture / language">
            <ChipSelect options={CULTURES} value={targetCulture} onChange={setTargetCulture} customPlaceholder="e.g. Kenya, Poland…" />
          </Field>
          <Field label="Adaptation strategy">
            <ChipSelect options={STRATEGIES} value={strategy} onChange={setStrategy} allowCustom={false} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground/85">Preserve edginess</p>
              <p className="text-[10px] text-muted-foreground">Keep the spice, or let local norms soften it</p>
            </div>
            <Switch checked={preserveEdge} onCheckedChange={setPreserveEdge} />
          </div>
          <Field label="Performance context (optional)">
            <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="touring comic in Osaka, office party…" className="border-border bg-secondary/30 text-sm" />
          </Field>
          <Button
            onClick={() => (runner.running ? runner.stop() : runner.run({ joke, sourceCulture, targetCulture, strategy, preserveEdge, context }))}
            disabled={!runner.running && !joke.trim()}
            className="w-full bg-gold font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_24px_-6px_hsl(42_96%_55%/0.7)] disabled:opacity-40"
          >
            {runner.running ? (
              <>
                <Square className="mr-2 h-3.5 w-3.5" /> Stop
              </>
            ) : (
              <>
                <ArrowLeftRight className="mr-2 h-3.5 w-3.5" /> Adapt joke
              </>
            )}
          </Button>
        </>
      }
      resultSlot={
        r ? (
          <div className="space-y-4">
            {/* Literal */}
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Literal translation (the autopsy)</p>
              <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">“{r.literal}”</p>
            </div>

            {/* Adaptations */}
            {r.adaptations.map((a, i) => (
              <div key={i} className="rounded-2xl border border-gold/25 bg-card/60 p-5 card-glow">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Adaptation {i + 1}</p>
                  <CopyButton text={a.joke} />
                </div>
                <p className="mt-2 font-display text-base font-semibold leading-relaxed text-foreground/95">{a.joke}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{a.whyItWorks}</p>

                {a.swaps.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Reference swaps</p>
                    {a.swaps.map((s, j) => (
                      <div key={j} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-[11px]">
                        <span className="text-red-300/80 line-through">{s.from}</span>
                        <ArrowRight className="h-3 w-3 text-gold" />
                        <span className="font-medium text-emerald-300">{s.to}</span>
                        <span className="w-full text-muted-foreground/80 sm:w-auto sm:flex-1 sm:text-right">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
                {a.risk && (
                  <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" />
                    <span>
                      <span className="font-semibold text-foreground/70">Risk:</span> {a.risk}
                    </span>
                  </p>
                )}
              </div>
            ))}

            {/* Cultural notes */}
            <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-violet">Cultural brief — {targetCulture}</p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/85">{r.culturalNotes}</p>
            </div>

            {r.tabooWarnings.length > 0 && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
                  <ShieldAlert className="h-3 w-3" /> Taboo radar
                </p>
                <ul className="mt-2 space-y-1.5">
                  {r.tabooWarnings.map((t, i) => (
                    <li key={i} className="text-xs leading-relaxed text-red-200/80">
                      • {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          !runner.running && (
            <EmptyState
              icon={<Languages className="h-6 w-6" />}
              title="No joke has crossed the border yet"
              body="Humor dies in literal translation. This engine rebuilds the joke for its new culture — swapping references, reconstructing wordplay, and flagging taboos — then shows you exactly what changed and why."
            />
          )
        )
      }
    />
  );
}
