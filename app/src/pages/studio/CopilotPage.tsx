import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FlaskConical, Lightbulb, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getModule } from '@/lib/moduleDefs';
import { usePipelineRunner } from '@/hooks/usePipelineRunner';
import { ModuleScaffold } from '@/components/ModuleScaffold';
import { ChipSelect, Field, ScoreBar, SliderField } from '@/components/controls';
import { CopyButton, EmptyState } from '@/components/misc';

const mod = getModule('copilot');

const STYLES = ['observational', 'deadpan', 'absurd', 'dark', 'wholesome', 'wordplay', 'self-deprecating', 'satire', 'surreal'];
const STRUCTURES = ['setup → punchline', 'one-liner', 'rule of three', 'misdirection', 'story joke', 'roast', 'crowd-work question'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Portuguese'];

interface Joke {
  setup: string;
  punchline: string;
  mechanism: string;
  tags: string[];
  scores?: { surprise: number; incongruity: number; warmth: number; edge: number };
}

export default function CopilotPage() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('observational');
  const [structure, setStructure] = useState('setup → punchline');
  const [audience, setAudience] = useState('');
  const [spice, setSpice] = useState(3);
  const [variants, setVariants] = useState(3);
  const [language, setLanguage] = useState('English');
  const [notes, setNotes] = useState('');
  const runner = usePipelineRunner<{ jokes: Joke[] }>(mod);
  const navigate = useNavigate();

  const spiceLabel = ['', 'squeaky clean', 'mild', 'club standard', 'edgy', 'no apologies'][spice];

  return (
    <ModuleScaffold
      module={mod}
      stages={runner.stages}
      error={runner.error}
      meta={runner.result ? { model: runner.result.model, attempts: runner.result.attempts, repairs: runner.result.repairs, changelog: runner.result.changelog, raw: runner.result.data } : undefined}
      controls={
        <>
          <Field label="Topic / premise">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="airports, therapy, my landlord…"
              className="border-border bg-secondary/30 text-sm"
            />
          </Field>
          <Field label="Style">
            <ChipSelect options={STYLES} value={style} onChange={setStyle} />
          </Field>
          <Field label="Structure">
            <ChipSelect options={STRUCTURES} value={structure} onChange={setStructure} />
          </Field>
          <Field label="Audience">
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="tech startup employees, dads over 50…"
              className="border-border bg-secondary/30 text-sm"
            />
          </Field>
          <SliderField label="Spice level" value={spice} onChange={setSpice} min={1} max={5} format={(v) => `${v}/5`} marks={['clean', 'feral']} hint={spiceLabel} />
          <div className="grid grid-cols-2 gap-3">
            <SliderField label="Variants" value={variants} onChange={setVariants} min={1} max={5} />
            <Field label="Language">
              <Input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English"
                className="h-8 border-border bg-secondary/30 text-xs"
                list="copilot-langs"
              />
              <datalist id="copilot-langs">
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="Writer's notes" hint="Anything else: banned topics, a comic's voice to channel, a required word…">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="border-border bg-secondary/30 text-xs" placeholder="channel Mitch Hedberg energy, avoid politics…" />
          </Field>
          <Button
            onClick={() => (runner.running ? runner.stop() : runner.run({ topic, style, structure, audience, spice, variants, language, notes }))}
            className="w-full bg-gold font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_24px_-6px_hsl(42_96%_55%/0.7)]"
          >
            {runner.running ? (
              <>
                <Square className="mr-2 h-3.5 w-3.5" /> Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-3.5 w-3.5" /> Generate jokes
              </>
            )}
          </Button>
        </>
      }
      resultSlot={
        runner.result ? (
          <div className="space-y-3">
            {runner.result.data.jokes.map((j, i) => (
              <div key={i} className="group rounded-2xl border border-border bg-card/60 p-5 transition-all hover:border-gold/30 card-glow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {j.setup && <p className="text-sm leading-relaxed text-foreground/90">{j.setup}</p>}
                    <p className={`font-display text-base font-semibold leading-snug text-gold ${j.setup ? 'mt-2' : ''}`}>
                      {j.punchline}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-border bg-secondary/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    #{i + 1}
                  </span>
                </div>
                <p className="mt-3 border-l-2 border-neon-violet/40 pl-3 text-[11px] italic leading-relaxed text-muted-foreground">
                  {j.mechanism}
                </p>
                {j.scores && (
                  <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <ScoreBar label="surprise" value={j.scores.surprise} />
                    <ScoreBar label="incongruity" value={j.scores.incongruity} color="violet" />
                    <ScoreBar label="warmth" value={j.scores.warmth} color="cyan" />
                    <ScoreBar label="edge" value={j.scores.edge} color="magenta" />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {j.tags.map((t) => (
                    <span key={t} className="rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  <span className="flex-1" />
                  <CopyButton text={j.setup ? `${j.setup} ${j.punchline}` : j.punchline} />
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('hgs-handoff-explain', j.setup ? `${j.setup} ${j.punchline}` : j.punchline);
                      navigate('/studio/explain');
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-neon-violet/40 bg-neon-violet/10 px-2 py-1 text-[11px] text-neon-violet transition-colors hover:bg-neon-violet/20"
                  >
                    <FlaskConical className="h-3 w-3" /> dissect
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !runner.running && (
            <EmptyState
              icon={<Lightbulb className="h-6 w-6" />}
              title="The writers' room is open"
              body="Set your brief on the left — topic, style, structure, spice — and the pipeline will generate schema-validated jokes, auto-repairing any malformed output along the way."
            />
          )
        )
      }
    />
  );
}
