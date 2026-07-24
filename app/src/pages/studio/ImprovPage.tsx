import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clapperboard, Drama, Lightbulb, Loader2, Play, RotateCcw, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractJson, friendlyError, generate, generateStream, GeminiError, type ChatMessage } from '@/lib/gemini';
import { getModule, IMPROV_SUGGEST_INSTRUCTIONS } from '@/lib/moduleDefs';
import { runPipeline, type PipelineRun } from '@/lib/pipeline';
import { parseFallbackModels, parseSeed, parseStopSequences, resolveSystemPrompt, useSettings } from '@/lib/settings';
import { ChipSelect, Field, SliderField, TrackBadge } from '@/components/controls';
import { KeyGateBanner } from '@/components/ModuleScaffold';
import { EmptyState, RawJsonViewer } from '@/components/misc';
import { cn } from '@/lib/utils';

const mod = getModule('improv');

const STYLES = ['grounded scene', 'absurd escalation', 'character-driven', 'genre parody', 'musical-adjacent chaos'];

interface Debrief {
  gameOfScene: string;
  highlights: string[];
  suggestions: string[];
  rating: number;
}

export default function ImprovPage() {
  const { settings, hasKey } = useSettings();
  const [setting, setSetting] = useState('');
  const [relationship, setRelationship] = useState('');
  const [unusual, setUnusual] = useState('');
  const [style, setStyle] = useState('grounded scene');
  const [spice, setSpice] = useState(2);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [debrief, setDebrief] = useState<PipelineRun<Debrief> | null>(null);
  const [debriefBusy, setDebriefBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamText]);

  const sceneBrief = () =>
    `SCENE SETUP\n- Setting: ${setting || 'a place the audience suggests'}\n- Relationship: ${relationship || 'two people who know each other well'}\n- First unusual thing: ${unusual || 'discover it in the first exchange'}\n- Style: ${style}\n- Spice level: ${spice}/5`;

  const genConfig = () => ({
    temperature: settings.temperature,
    topP: settings.topP,
    topK: settings.topK,
    maxOutputTokens: Math.min(settings.maxOutputTokens, 1024),
    seed: parseSeed(settings.seed),
    stopSequences: parseStopSequences(settings.stopSequences),
  });

  const callModel = async (contents: ChatMessage[], stream: boolean): Promise<string> => {
    const system = resolveSystemPrompt(settings, mod.id, mod.defaultSystem);
    const models = [settings.model.trim(), ...parseFallbackModels(settings.fallbackModels)].filter(Boolean);
    let lastErr: unknown = null;
    for (const model of models) {
      for (let attempt = 0; attempt < Math.max(1, Math.min(settings.maxRetries, 3)); attempt++) {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          if (stream) {
            setStreamText('');
            const res = await generateStream({
              apiKey: settings.apiKey,
              model,
              systemInstruction: system,
              contents,
              config: genConfig(),
              safetyThreshold: settings.safetyThreshold,
              timeoutMs: settings.timeoutSec * 1000,
              signal: controller.signal,
              onChunk: (acc) => setStreamText(acc),
            });
            setUsedModel(model);
            return res.text;
          }
          const res = await generate({
            apiKey: settings.apiKey,
            model,
            systemInstruction: system,
            contents,
            config: genConfig(),
            safetyThreshold: settings.safetyThreshold,
            timeoutMs: settings.timeoutSec * 1000,
            signal: controller.signal,
          });
          setUsedModel(model);
          return res.text;
        } catch (err) {
          lastErr = err;
          const e = err as GeminiError;
          if (e.code === 'MODEL_NOT_FOUND' || e.code === 'INVALID_KEY') break; // next model
          if (!e.retryable || attempt + 1 >= Math.max(1, Math.min(settings.maxRetries, 3))) break;
          await new Promise((r) => setTimeout(r, 700 * 2 ** attempt));
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('All models failed');
  };

  const startScene = async () => {
    setBusy(true);
    setError(null);
    setDebrief(null);
    setSuggestions([]);
    try {
      const kickoff: ChatMessage = {
        role: 'user',
        text: `${sceneBrief()}\n\nBegin the scene NOW with a strong opening offer. Stay in character. 1-3 sentences only.`,
      };
      const reply = await callModel([kickoff], settings.streaming);
      setMessages([kickoff, { role: 'model', text: reply }]);
      setStarted(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
      setStreamText('');
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSuggestions([]);
    const next: ChatMessage[] = [...messages, { role: 'user', text: text.trim() }];
    setMessages(next);
    setInput('');
    try {
      const reply = await callModel(next, settings.streaming);
      setMessages([...next, { role: 'model', text: reply }]);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
      setStreamText('');
    }
  };

  const suggest = async () => {
    setSuggestBusy(true);
    setError(null);
    try {
      const transcript = messages.map((m) => `${m.role === 'model' ? 'AI PARTNER' : 'YOU'}: ${m.text}`).join('\n');
      const raw = await callModel(
        [...messages, { role: 'user', text: `${IMPROV_SUGGEST_INSTRUCTIONS}\n\nScene so far:\n${transcript}` }],
        false,
      );
      const parsed = extractJson(raw);
      if (Array.isArray(parsed)) setSuggestions(parsed.map(String).slice(0, 3));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSuggestBusy(false);
    }
  };

  const runDebrief = async () => {
    setDebriefBusy(true);
    setError(null);
    try {
      const transcript = messages.map((m) => `${m.role === 'model' ? 'AI PARTNER' : 'HUMAN'}: ${m.text}`).join('\n');
      const res = await runPipeline<Debrief>({
        settings,
        moduleId: mod.id,
        defaultSystem:
          'You are an improv coach reviewing a taped scene. Be specific, quote lines, and coach kindly but directly. ' +
          'Return only valid JSON.',
        userPrompt: `${sceneBrief()}\n\nSCENE TRANSCRIPT:\n${transcript}\n\nDebrief this scene: identify the game of the scene, quote the 3 strongest moments as highlights, give 2-3 coaching suggestions, and rate the scene 0-10.`,
        schema: mod.schema,
        validate: mod.validate,
        onStages: () => {},
      });
      setDebrief(res);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setDebriefBusy(false);
    }
  };

  const resetScene = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStarted(false);
    setDebrief(null);
    setSuggestions([]);
    setError(null);
    setStreamText('');
  };

  const visibleMessages = messages.filter((_, i) => i > 0); // hide kickoff prompt

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
      {/* Controls */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card/60 p-5 card-glow">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">{mod.name}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{mod.description}</p>
            </div>
            <TrackBadge track={mod.track} />
          </div>
          <div className="space-y-4">
            <Field label="Setting">
              <Input value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="a submarine gift shop…" className="border-border bg-secondary/30 text-sm" />
            </Field>
            <Field label="Relationship">
              <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="estranged siblings, co-magicians…" className="border-border bg-secondary/30 text-sm" />
            </Field>
            <Field label="First unusual thing (optional)" hint="The seed of the game — or let the AI discover it.">
              <Input value={unusual} onChange={(e) => setUnusual(e.target.value)} placeholder="one of you can hear the other's thoughts…" className="border-border bg-secondary/30 text-sm" />
            </Field>
            <Field label="Style">
              <ChipSelect options={STYLES} value={style} onChange={setStyle} />
            </Field>
            <SliderField label="Spice" value={spice} onChange={setSpice} min={1} max={5} format={(v) => `${v}/5`} />
            <div className="flex gap-2">
              {!started ? (
                <Button onClick={startScene} disabled={busy || !hasKey} className="flex-1 bg-gold font-display text-sm font-bold text-background hover:bg-gold/90 shadow-[0_0_24px_-6px_hsl(42_96%_55%/0.7)] disabled:opacity-40">
                  {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Clapperboard className="mr-2 h-3.5 w-3.5" />}
                  Lights up
                </Button>
              ) : (
                <>
                  <Button onClick={() => void runDebrief()} disabled={debriefBusy || messages.length < 4} className="flex-1 bg-neon-violet font-display text-sm font-bold text-background hover:bg-neon-violet/90 disabled:opacity-40">
                    {debriefBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Drama className="mr-2 h-3.5 w-3.5" />}
                    End & debrief
                  </Button>
                  <Button onClick={resetScene} variant="outline" size="icon" className="border-border" title="Reset scene">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            {usedModel && started && (
              <p className="text-center font-mono text-[10px] text-muted-foreground/60">scene partner: {usedModel}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stage */}
      <div className="min-w-0 space-y-4">
        {!hasKey && <KeyGateBanner />}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-red-200/80">{error}</p>
          </div>
        )}

        {!started && !busy && (
          <EmptyState
            icon={<Drama className="h-6 w-6" />}
            title="The stage is dark"
            body="Set the scene on the left and hit “Lights up”. Your AI partner will make the opening offer — then it's yes, and… all the way down. Enable streaming in Controls for a live stage feel."
          />
        )}

        {(started || busy) && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card/50 card-glow">
            <div className="flex items-center justify-between border-b border-border/60 bg-secondary/20 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">Live scene</span>
              {busy && (
                <button type="button" onClick={() => abortRef.current?.abort()} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-300">
                  <Square className="h-3 w-3" /> cut
                </button>
              )}
            </div>
            <div ref={scrollRef} className="max-h-[52vh] min-h-[280px] space-y-4 overflow-y-auto p-4 sm:p-5">
              {visibleMessages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-sm bg-gold/15 text-foreground border border-gold/25'
                        : 'rounded-bl-sm border border-neon-violet/25 bg-neon-violet/10 text-foreground/95',
                    )}
                  >
                    <p className={cn('mb-1 font-mono text-[9px] uppercase tracking-[0.2em]', m.role === 'user' ? 'text-gold/70' : 'text-neon-violet/70')}>
                      {m.role === 'user' ? 'You' : 'Partner'}
                    </p>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-neon-violet/25 bg-neon-violet/10 px-4 py-3 text-sm leading-relaxed text-foreground/95">
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-neon-violet/70">Partner</p>
                    {streamText || <Loader2 className="h-4 w-4 animate-spin text-neon-violet/70" />}
                  </div>
                </div>
              )}
            </div>
            {started && (
              <div className="border-t border-border/60 p-3">
                {suggestions.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-left text-[11px] text-gold/90 transition-colors hover:bg-gold/15"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send(input);
                      }
                    }}
                    rows={1}
                    placeholder="Yes, and…"
                    className="min-h-[42px] flex-1 resize-none border-border bg-secondary/30 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Suggest 3 offers"
                    disabled={suggestBusy || busy}
                    onClick={() => void suggest()}
                    className="h-[42px] w-[42px] border-gold/30 text-gold hover:bg-gold/10"
                  >
                    {suggestBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => void send(input)}
                    disabled={!input.trim() || busy}
                    className="h-[42px] bg-gold px-4 font-display font-bold text-background hover:bg-gold/90 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {debrief && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-neon-violet/30 bg-neon-violet/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-violet">Coach's debrief</p>
                <span className="rounded-lg border border-neon-violet/40 bg-neon-violet/10 px-2.5 py-1 font-display text-sm font-bold text-neon-violet">
                  {debrief.data.rating.toFixed(0)}/10
                </span>
              </div>
              <p className="mt-2 font-display text-sm font-semibold text-foreground/90">
                Game of the scene: <span className="text-gold">{debrief.data.gameOfScene}</span>
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Strongest moments</p>
                  <ul className="mt-2 space-y-1.5">
                    {debrief.data.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/85">
                        <Play className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Coaching notes</p>
                  <ul className="mt-2 space-y-1.5">
                    {debrief.data.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/85">
                        <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <RawJsonViewer data={debrief.data} label="Raw debrief output" />
          </div>
        )}
      </div>
    </div>
  );
}
