import { useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  Settings2,
  Unplug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MODEL_PRESETS, SAFETY_OPTIONS, useSettings } from '@/lib/settings';
import { listModels, type ModelInfo } from '@/lib/gemini';
import { MODULES } from '@/lib/moduleDefs';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-foreground/80">{label}</Label>
      </div>
      {children}
      {hint && <p className="text-[10px] leading-snug text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function NumSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
}) {
  return (
    <Row label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="flex-1" />
        <span className="w-14 shrink-0 rounded border border-border bg-secondary/40 px-1.5 py-0.5 text-center font-mono text-[11px] text-gold">
          {value}
        </span>
      </div>
    </Row>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-xs text-foreground/80">{label}</Label>
        {hint && <p className="text-[10px] leading-snug text-muted-foreground/70">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { settings, update, setOverride, resetAll } = useSettings();
  const [showKey, setShowKey] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [overrideModule, setOverrideModule] = useState(MODULES[0].id);

  const fetchModels = async () => {
    setFetching(true);
    setFetchMsg(null);
    try {
      const list = await listModels(settings.apiKey);
      setModels(list);
      setFetchMsg({ ok: true, text: `Connected — ${list.length} models available to this key.` });
    } catch (err: any) {
      setFetchMsg({ ok: false, text: err?.message ?? 'Connection failed' });
    } finally {
      setFetching(false);
    }
  };

  const currentOverride = settings.promptOverrides[overrideModule] ?? '';
  const currentDefault = MODULES.find((m) => m.id === overrideModule)?.defaultSystem ?? '';
  const datalistOptions = models.length
    ? models.map((m) => ({ id: m.id, label: m.displayName }))
    : MODEL_PRESETS.map((p) => ({ id: p.id, label: p.label }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l-border bg-background/95 backdrop-blur sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Settings2 className="h-4 w-4 text-gold" /> Studio Controls
          </SheetTitle>
          <SheetDescription className="text-xs">
            Every knob of the pipeline is yours. Nothing is locked, nothing is hidden.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8 pb-10">
          {/* CONNECTION */}
          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-gold">Connection</h3>
            <Row label="Google AI Studio API key" hint="Stored only in your browser's localStorage — never sent anywhere except Google's API.">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => update({ apiKey: e.target.value.trim() })}
                  placeholder="AIza..."
                  className="border-border bg-secondary/30 pl-9 pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </Row>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchModels}
                disabled={fetching || !settings.apiKey}
                className="border-gold/30 text-xs text-gold hover:bg-gold/10"
              >
                {fetching ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Unplug className="mr-1.5 h-3 w-3" />}
                Test key & fetch models
              </Button>
              {fetchMsg && (
                <span className={`flex items-center gap-1 text-[11px] ${fetchMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fetchMsg.ok && <Check className="h-3 w-3" />}
                  {fetchMsg.text}
                </span>
              )}
            </div>
            <Row label="Model" hint="Free text — any Gemini or Gemma model ID your key can access (e.g. gemini-2.5-flash, gemma-3-27b-it).">
              <Input
                list="hgs-models"
                value={settings.model}
                onChange={(e) => update({ model: e.target.value })}
                className="border-border bg-secondary/30 font-mono text-xs"
                placeholder="gemini-2.5-flash"
              />
              <datalist id="hgs-models">
                {datalistOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </datalist>
              {models.length === 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {MODEL_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => update({ model: p.id })}
                      title={p.hint}
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                        settings.model === p.id
                          ? 'border-gold/60 bg-gold/10 text-gold'
                          : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </Row>
            <Row label="Fallback models" hint="Comma-separated. If the primary model 404s or exhausts retries, the pipeline walks this list.">
              <Input
                value={settings.fallbackModels}
                onChange={(e) => update({ fallbackModels: e.target.value })}
                className="border-border bg-secondary/30 font-mono text-xs"
                placeholder="gemma-3-27b-it, gemini-2.0-flash"
              />
            </Row>
          </section>

          <Separator className="bg-border/60" />

          {/* SAMPLING */}
          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-gold">Sampling</h3>
            <NumSlider label="Temperature" value={settings.temperature} onChange={(v) => update({ temperature: v })} min={0} max={2} step={0.05} hint="0 = deterministic, 2 = chaotic. Comedy likes 0.9–1.3." />
            <NumSlider label="topP (nucleus)" value={settings.topP} onChange={(v) => update({ topP: v })} min={0} max={1} step={0.01} />
            <NumSlider label="topK" value={settings.topK} onChange={(v) => update({ topK: v })} min={1} max={128} step={1} />
            <NumSlider label="Max output tokens" value={settings.maxOutputTokens} onChange={(v) => update({ maxOutputTokens: v })} min={256} max={32768} step={256} />
            <div className="grid grid-cols-2 gap-3">
              <Row label="Seed" hint="Empty = random.">
                <Input value={settings.seed} onChange={(e) => update({ seed: e.target.value })} placeholder="—" className="border-border bg-secondary/30 font-mono text-xs" />
              </Row>
              <Row label="Stop sequences" hint="Comma-separated, max 5.">
                <Input value={settings.stopSequences} onChange={(e) => update({ stopSequences: e.target.value })} placeholder="###, END" className="border-border bg-secondary/30 font-mono text-xs" />
              </Row>
            </div>
          </section>

          <Separator className="bg-border/60" />

          {/* PIPELINE */}
          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-gold">Pipeline Robustness</h3>
            <ToggleRow
              label="Structured JSON mode"
              hint="Forces responseSchema on the API call. If a model rejects it, the pipeline auto-falls back to free-text + repair."
              checked={settings.jsonMode}
              onChange={(v) => update({ jsonMode: v })}
            />
            <ToggleRow
              label="Critic pass"
              hint="A second model call that reviews the output and rewrites weak spots before you see it."
              checked={settings.critiquePass}
              onChange={(v) => update({ critiquePass: v })}
            />
            <ToggleRow
              label="Streaming (improv chat)"
              hint="Stream tokens live in the Improv Partner for a real-time stage feel."
              checked={settings.streaming}
              onChange={(v) => update({ streaming: v })}
            />
            <NumSlider label="Max retries per model" value={settings.maxRetries} onChange={(v) => update({ maxRetries: v })} min={1} max={6} step={1} hint="Exponential backoff on 429/5xx/timeouts." />
            <NumSlider label="Auto-repair passes" value={settings.repairAttempts} onChange={(v) => update({ repairAttempts: v })} min={0} max={4} step={1} hint="If output fails schema validation, the pipeline sends it back for a fix." />
            <NumSlider label="Timeout (seconds)" value={settings.timeoutSec} onChange={(v) => update({ timeoutSec: v })} min={10} max={300} step={5} />
            <Row label="Safety threshold" hint="Applies to all four harm categories. Comedy often needs 'loose' or 'off'.">
              <Select value={settings.safetyThreshold} onValueChange={(v) => update({ safetyThreshold: v })}>
                <SelectTrigger className="border-border bg-secondary/30 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAFETY_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </section>

          <Separator className="bg-border/60" />

          {/* PROMPTS */}
          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-gold">Prompt Control</h3>
            <Row label="Global system prefix" hint="Prepended to every module's system prompt. Your house style.">
              <Textarea
                value={settings.globalSystemPrompt}
                onChange={(e) => update({ globalSystemPrompt: e.target.value })}
                placeholder="e.g. Always favor dry wit over broad humor. Never use puns about cats."
                rows={3}
                className="border-border bg-secondary/30 text-xs"
              />
            </Row>
            <Row label="Per-module system prompt overrides" hint="Replace a module's default persona entirely. Clear the box to restore the default.">
              <Select value={overrideModule} onValueChange={setOverrideModule}>
                <SelectTrigger className="border-border bg-secondary/30 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name}
                      {settings.promptOverrides[m.id]?.trim() ? ' · overridden' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={currentOverride}
                onChange={(e) => setOverride(overrideModule, e.target.value)}
                placeholder={`Default for this module:\n\n${currentDefault.slice(0, 220)}…`}
                rows={7}
                className="border-border bg-secondary/30 font-mono text-[11px] leading-relaxed"
              />
              {currentOverride.trim() && (
                <Button size="sm" variant="ghost" onClick={() => setOverride(overrideModule, '')} className="h-7 text-[11px] text-muted-foreground">
                  <RotateCcw className="mr-1 h-3 w-3" /> restore default
                </Button>
              )}
            </Row>
          </section>

          <Separator className="bg-border/60" />

          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            className="w-full border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <RefreshCw className="mr-1.5 h-3 w-3" /> Reset everything to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
