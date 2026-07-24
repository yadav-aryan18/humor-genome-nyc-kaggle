import { useState } from 'react';
import { ArrowDown, Mic, Play, Repeat, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getModule } from '@/lib/moduleDefs';
import { usePipelineRunner } from '@/hooks/usePipelineRunner';
import { ModuleScaffold } from '@/components/ModuleScaffold';
import { ChipSelect, Field, SliderField } from '@/components/controls';
import { CopyButton, EmptyState } from '@/components/misc';

const mod = getModule('tight5');

const STYLES = ['observational', 'storytelling', 'deadpan one-liners', 'high-energy act-outs', 'dark confessional', 'crowd work heavy'];

interface Tight5 {
  title: string;
  logline: string;
  bits: { title: string; estSeconds: number; setup: string; beats: string[]; punchline: string; callback: string }[];
  openerNote: string;
  closerNote: string;
  transitions: string[];
  performanceNotes: string[];
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Tight5Page() {
  const [persona, setPersona] = useState('');
  const [topics, setTopics] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [crowd, setCrowd] = useState('');
  const [spice, setSpice] = useState(3);
  const [style, setStyle] = useState('observational');
  const runner = usePipelineRunner<Tight5>(mod);

  const r = runner.result?.data;
  const totalSec = r ? r.bits.reduce((a, b) => a + (b.estSeconds || 0), 0) : 0;

  const fullScript = r
    ? [
        `"${r.title}" — ${r.logline}`,
        '',
        `[OPENER] ${r.openerNote}`,
        '',
        ...r.bits.flatMap((b, i) => [
          `=== BIT ${i + 1}: ${b.title} (~${fmtTime(b.estSeconds)}) ===`,
          b.setup,
          ...b.beats.map((bt) => `  • ${bt}`),
          `PUNCHLINE: ${b.punchline}`,
          b.callback ? `CALLBACK: ${b.callback}` : '',
          r.transitions[i] ? `[transition] ${r.transitions[i]}` : '',
          '',
        ]),
        `[CLOSER] ${r.closerNote}`,
        '',
        'PERFORMANCE NOTES:',
        ...r.performanceNotes.map((n) => `  - ${n}`),
      ]
        .filter((l) => l !== '')
        .join('\n')
    : '';

  return (
    <ModuleScaffold
      module={mod}
      stages={runner.stages}
      error={runner.error}
      meta={runner.result ? { model: runner.result.model, attempts: runner.result.attempts, repairs: runner.result.repairs, changelog: runner.result.changelog, raw: runner.result.data } : undefined}
      controls={
        <>
          <Field label="Comedian persona / voice">
            <Input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="deadpan accountant with secret chaos…" className="border-border bg-secondary/30 text-sm" />
          </Field>
          <Field label="Topics to mine" hint="Comma-separated life material.">
            <Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="divorce, peloton cult, my dad's texting…" className="border-border bg-secondary/30 text-sm" />
          </Field>
          <Field label="Style blend">
            <ChipSelect options={STYLES} value={style} onChange={setStyle} />
          </Field>
          <Field label="Crowd">
            <Input value={crowd} onChange={(e) => setCrowd(e.target.value)} placeholder="late show, tourist-heavy…" className="border-border bg-secondary/30 text-sm" />
          </Field>
          <SliderField label="Set length" value={minutes} onChange={setMinutes} min={3} max={10} format={(v) => `${v} min`} />
          <SliderField label="Spice level" value={spice} onChange={setSpice} min={1} max={5} format={(v) => `${v}/5`} marks={['clean', 'feral']} />
          <Button
            onClick={() => (runner.running ? runner.stop() : runner.run({ persona, topics, minutes, crowd, spice, style }))}
            className="w-full bg-gold font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_24px_-6px_hsl(42_96%_55%/0.7)]"
          >
            {runner.running ? (
              <>
                <Square className="mr-2 h-3.5 w-3.5" /> Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-3.5 w-3.5" /> Build my set
              </>
            )}
          </Button>
        </>
      }
      resultSlot={
        r ? (
          <div className="space-y-4">
            {/* Set header */}
            <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 to-transparent p-5 card-glow-gold">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Tonight's set</p>
                  <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">“{r.title}”</h3>
                  <p className="mt-1 text-xs italic text-muted-foreground">{r.logline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 font-mono text-[11px] text-gold">
                    <Timer className="h-3 w-3" /> ~{fmtTime(totalSec)}
                  </span>
                  <CopyButton text={fullScript} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">Walk on</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">{r.openerNote}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-neon-magenta">Get off</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">{r.closerNote}</p>
                </div>
              </div>
            </div>

            {/* Bits */}
            {r.bits.map((b, i) => (
              <div key={i}>
                <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-sm font-bold text-foreground">
                      <span className="mr-2 font-mono text-xs text-gold">0{i + 1}</span>
                      {b.title}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">~{fmtTime(b.estSeconds)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{b.setup}</p>
                  <div className="mt-3 space-y-1.5 border-l-2 border-border pl-4">
                    {b.beats.map((beat, j) => (
                      <p key={j} className="text-xs leading-relaxed text-muted-foreground">
                        <span className="mr-1.5 font-mono text-gold/60">▸</span>
                        {beat}
                      </p>
                    ))}
                  </div>
                  <p className="mt-3 font-display text-sm font-semibold text-gold">{b.punchline}</p>
                  {b.callback && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-neon-violet">
                      <Repeat className="h-3 w-3" /> callback: {b.callback}
                    </p>
                  )}
                </div>
                {r.transitions[i] && i < r.bits.length - 1 && (
                  <div className="flex items-center gap-2 px-5 py-2">
                    <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
                    <p className="text-[11px] italic text-muted-foreground/80">“{r.transitions[i]}”</p>
                  </div>
                )}
              </div>
            ))}

            {/* Performance notes */}
            {r.performanceNotes.length > 0 && (
              <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Stage directions</p>
                <ul className="mt-2 space-y-1.5">
                  {r.performanceNotes.map((n, i) => (
                    <li key={i} className="text-xs leading-relaxed text-foreground/85">
                      <span className="mr-1.5 text-gold">•</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          !runner.running && (
            <EmptyState
              icon={<Mic className="h-6 w-6" />}
              title="No set on the lineup yet"
              body="Feed the generator your persona and your life material — it returns a club-ready set with timed bits, planted callbacks, segues, and stage directions you can rehearse tonight."
            />
          )
        )
      }
    />
  );
}
