import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Cpu,
  Dna,
  KeyRound,
  Layers,
  Mic2,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MODULES, TRACKS } from '@/lib/moduleDefs';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay }} className={className}>
      {children}
    </motion.div>
  );
}

const MARQUEE_ITEMS = [
  'incongruity', 'benign violation', 'rule of three', 'misdirection', 'yes, and…', 'superiority theory',
  'callback', 'deadpan', 'punch up', 'the game of the scene', 'comic timing', 'script opposition',
  'relief theory', 'tight five', 'crowd work', 'observational truth',
];

const PIPELINE_STAGES = [
  {
    icon: Layers,
    title: 'Assemble',
    body: 'Your inputs are compiled into a engineered brief — persona system prompt + structured user prompt, every word overridable by you.',
  },
  {
    icon: Braces,
    title: 'Structured generate',
    body: 'The API call forces responseSchema JSON mode on Gemma/Gemini, so output shape is constrained at the decoder level, not by prayer.',
  },
  {
    icon: ShieldCheck,
    title: 'Validate',
    body: 'Output is parsed and checked field-by-field against the module contract. Scores clamped, arrays coerced, missing punchlines rejected.',
  },
  {
    icon: Wrench,
    title: 'Auto-repair',
    body: 'Malformed output is sent back to the model with its validation errors and fixed — up to 4 passes — before it can ever reach your screen.',
  },
  {
    icon: Sparkles,
    title: 'Critic pass',
    body: 'Optional second call: the model reviews its own work, logs a changelog, and rewrites the weak spots. You see what it improved.',
  },
  {
    icon: RefreshCcw,
    title: 'Fallback chain',
    body: 'Rate limits and timeouts retry with exponential backoff. Dead model? The pipeline walks your fallback list until one answers.',
  },
];

const FREEDOMS = [
  { title: 'Any model, your key', body: 'Type any model ID — gemini-2.5-pro, gemma-3-27b-it, whatever drops next week. Fetch the live list your key can access.' },
  { title: 'Every sampling knob', body: 'Temperature 0–2, topP, topK, seed, max tokens, stop sequences. No hidden defaults.' },
  { title: 'Prompt surgery', body: 'Global system prefix plus full per-module system-prompt overrides. The personas are yours to rewrite.' },
  { title: 'Safety under your hand', body: 'Choose the harm-filter threshold, from strict to off — edgy comedy is a legitimate artistic choice.' },
  { title: 'Pipeline behavior', body: 'Toggle JSON mode, streaming, critic pass. Tune retries, repair passes, and timeouts.' },
  { title: 'Zero lock-in', body: 'No accounts, no proxy, no data leaves your browser except straight to Google\u2019s API. Your key lives in localStorage.' },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background spotlight-bg noise-bg">
      {/* ---------------- NAV ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-background shadow-[0_0_20px_-4px_hsl(42_96%_55%/0.7)]">
              <Dna className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-display text-sm font-bold leading-none tracking-tight">Humor Genome</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.25em] text-gold/80">Studio</div>
            </div>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-xs text-muted-foreground md:flex">
            <a href="#modules" className="transition-colors hover:text-gold">Modules</a>
            <a href="#pipeline" className="transition-colors hover:text-gold">Pipeline</a>
            <a href="#freedom" className="transition-colors hover:text-gold">Freedom</a>
            <a href="#tracks" className="transition-colors hover:text-gold">Tracks</a>
          </nav>
          <Link to="/studio/copilot">
            <Button size="sm" className="gap-1.5 bg-gold font-display text-xs font-bold text-background hover:bg-gold/90 shadow-[0_0_18px_-4px_hsl(42_96%_55%/0.6)]">
              Launch Studio <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section ref={heroRef} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-16">
        <div className="grid-bg absolute inset-0" />
        {/* spotlight cone */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[80vh] w-[120vw] -translate-x-1/2"
          style={{
            background: 'conic-gradient(from 180deg at 50% 0%, transparent 42%, hsl(42 96% 55% / 0.10) 50%, transparent 58%)',
          }}
        />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-[11px] font-medium text-gold"
          >
            <Mic2 className="h-3 w-3" />
            Built for Humor Genome NYC · powered by Gemma & Gemini
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl"
          >
            Sequence the
            <br />
            <span className="text-gold text-glow-gold">genome of funny.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            A modular AI humor workbench: write jokes with a copilot, dissect them with an explanation
            engine, rebuild them across cultures, improvise scenes in real time, and sequence the DNA of
            any specimen — all through your own Google AI Studio key, with every parameter under your hand.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/studio/copilot">
              <Button size="lg" className="gap-2 bg-gold px-7 font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_32px_-6px_hsl(42_96%_55%/0.8)]">
                <Sparkles className="h-4 w-4" /> Start creating
              </Button>
            </Link>
            <a href="#pipeline">
              <Button size="lg" variant="outline" className="gap-2 border-border px-7 font-display text-sm font-semibold text-foreground hover:border-gold/40 hover:text-gold">
                <Cpu className="h-4 w-4" /> The robust pipeline
              </Button>
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[11px] text-muted-foreground/70"
          >
            <span><span className="text-gold">06</span> modules</span>
            <span><span className="text-gold">03</span> tracks</span>
            <span><span className="text-gold">08</span> genome dimensions</span>
            <span><span className="text-gold">∞</span> tweakable parameters</span>
          </motion.div>
        </motion.div>

        {/* floating joke chips */}
        {[
          { text: 'yes, and…', className: 'left-[8%] top-[24%]', rot: '-6deg', delay: '0s' },
          { text: 'rule of three', className: 'right-[9%] top-[30%]', rot: '5deg', delay: '1.2s' },
          { text: '*taps mic*', className: 'left-[12%] bottom-[22%]', rot: '4deg', delay: '2s' },
          { text: 'punch up', className: 'right-[12%] bottom-[26%]', rot: '-5deg', delay: '0.6s' },
        ].map((c) => (
          <div
            key={c.text}
            className={cn('float-slow absolute hidden rounded-full border border-border bg-card/60 px-4 py-2 font-mono text-[11px] text-muted-foreground backdrop-blur lg:block', c.className)}
            style={{ ['--rot' as string]: c.rot, animationDelay: c.delay }}
          >
            {c.text}
          </div>
        ))}
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <div className="relative border-y border-border/60 bg-secondary/10 py-3.5">
        <div className="flex overflow-hidden">
          <div className="marquee-track flex shrink-0 items-center gap-8 pr-8">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-8 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
                {item} <span className="text-gold/50">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- MODULES ---------------- */}
      <section id="modules" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">01 — The workbench</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Six instruments.<br />One comedy laboratory.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.06}>
              <Link
                to={m.path}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 card-glow hover:card-glow-gold"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight">{m.name}</h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gold/70">{m.tagline}</p>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
                <span
                  className={cn(
                    'mt-5 inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest',
                    m.track === 'creation' && 'border-gold/40 bg-gold/10 text-gold',
                    m.track === 'understanding' && 'border-neon-violet/40 bg-neon-violet/10 text-neon-violet',
                    m.track === 'performance' && 'border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta',
                  )}
                >
                  {TRACKS[m.track].label}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- PIPELINE ---------------- */}
      <section id="pipeline" className="relative border-y border-border/60 bg-secondary/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">02 — The engine</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              A pipeline that doesn't let the model be lazy.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              LLMs improvise; pipelines discipline. Every module run passes through a six-stage gauntlet
              that constrains, verifies, repairs and critiques the model's output before it reaches you —
              and every stage reports live in the UI.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE_STAGES.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="relative h-full rounded-2xl border border-border bg-card/50 p-6 card-glow">
                  <span className="absolute right-5 top-4 font-mono text-4xl font-bold text-border/80">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FREEDOM ---------------- */}
      <section id="freedom" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">03 — Absolute control</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Bring your own key.<br />Break every knob off.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Humor Genome Studio is a client, not a gatekeeper. Paste a Google AI Studio key and every
            parameter of every call — model, sampling, prompts, safety, retries — becomes yours.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FREEDOMS.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="h-full rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:border-gold/30">
                <SlidersHorizontal className="h-4 w-4 text-gold/80" />
                <h3 className="mt-3 font-display text-sm font-bold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gold/25 bg-gold/5 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <p className="text-xs leading-relaxed text-foreground/85">
                <span className="font-semibold text-gold">Your key never touches our servers — there are no servers.</span>{' '}
                It lives in your browser's localStorage and talks directly to generativelanguage.googleapis.com.
                Delete it any time by clearing site data.
              </p>
            </div>
            <Link to="/studio/copilot" className="shrink-0">
              <Button className="gap-2 bg-gold font-display text-xs font-bold text-background hover:bg-gold/90">
                Connect & create <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---------------- TRACKS ---------------- */}
      <section id="tracks" className="border-t border-border/60 bg-secondary/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">04 — The forks in the road</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Three tracks.<br />One platform.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              {
                color: 'gold',
                title: 'Humor Creation',
                mods: ['Joke Copilot', 'Tight 5 Generator'],
                body: 'Gemma/Gemini writes with you — constrained by schemas, disciplined by the critic pass, tuned by your spice slider.',
              },
              {
                color: 'violet',
                title: 'Humor Understanding',
                mods: ['Explanation Engine', 'Cultural Translator', 'Genome Lab'],
                body: 'Why do people laugh? Structure maps, mechanism breakdowns, 8-dimension genome scores, cross-cultural autopsies.',
              },
              {
                color: 'magenta',
                title: 'Human + AI Performance',
                mods: ['Improv Partner'],
                body: 'A live scene partner that yes-ands in real time — with streaming tokens, offer suggestions, and a coach\u2019s debrief.',
              },
            ].map((t, i) => (
              <Reveal key={t.title} delay={i * 0.08}>
                <div
                  className={cn(
                    'h-full rounded-2xl border p-6 card-glow',
                    t.color === 'gold' && 'border-gold/25 bg-gold/[0.04]',
                    t.color === 'violet' && 'border-neon-violet/25 bg-neon-violet/[0.04]',
                    t.color === 'magenta' && 'border-neon-magenta/25 bg-neon-magenta/[0.04]',
                  )}
                >
                  <h3
                    className={cn(
                      'font-display text-lg font-bold',
                      t.color === 'gold' && 'text-gold',
                      t.color === 'violet' && 'text-neon-violet',
                      t.color === 'magenta' && 'text-neon-magenta',
                    )}
                  >
                    {t.title}
                  </h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                    {t.mods.join(' · ')}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA + FOOTER ---------------- */}
      <section className="relative overflow-hidden py-28">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[90vw] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(ellipse at center, hsl(42 96% 55% / 0.08), transparent 65%)' }}
        />
        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            The mic is <span className="text-gold text-glow-gold">yours.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Grab a free key from Google AI Studio, pick a model, and find out whether machines can
            actually be funny — or at least die trying, on stage, with dignity.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/studio/copilot">
              <Button size="lg" className="gap-2 bg-gold px-8 font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_36px_-6px_hsl(42_96%_55%/0.9)]">
                <Dna className="h-4 w-4" /> Enter the Studio
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Humor Genome Studio — a Humor Genome NYC project
          </p>
          <p className="text-[10px] text-muted-foreground/50">
            Powered by Gemma & Gemini via Google AI Studio · runs entirely in your browser
          </p>
        </div>
      </footer>
    </div>
  );
}
