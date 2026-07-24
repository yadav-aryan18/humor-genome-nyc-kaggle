import { useState } from 'react';
import { Check, ChevronDown, Copy, FileJson2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

export function RawJsonViewer({ data, label = 'Raw pipeline output' }: { data: unknown; label?: string }) {
  const [open, setOpen] = useState(false);
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <div className="rounded-xl border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <FileJson2 className="h-3.5 w-3.5 text-gold/70" />
          {label}
        </span>
        <span className="flex items-center gap-2">
          <CopyButton text={text} />
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && (
        <pre className="max-h-96 overflow-auto border-t border-border/60 p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
          {text}
        </pre>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/20 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5 text-gold/80">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-foreground/90">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
