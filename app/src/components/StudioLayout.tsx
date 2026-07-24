import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Dna, KeyRound, Menu, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MODULES } from '@/lib/moduleDefs';
import { useSettings } from '@/lib/settings';
import { SettingsSheet } from './SettingsSheet';
import { cn } from '@/lib/utils';

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {MODULES.map((m) => (
        <NavLink
          key={m.id}
          to={m.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all',
              isActive
                ? 'border-gold/30 bg-gold/10 text-foreground card-glow-gold'
                : 'border-transparent text-muted-foreground hover:border-border hover:bg-secondary/40 hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <m.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-gold' : 'text-muted-foreground group-hover:text-gold/70')} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{m.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground/70">{m.tagline}</span>
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate, onOpenSettings }: { onNavigate?: () => void; onOpenSettings: () => void }) {
  const { hasKey, settings } = useSettings();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-1 pt-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-background shadow-[0_0_20px_-4px_hsl(42_96%_55%/0.7)]">
          <Dna className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-display text-sm font-bold leading-none tracking-tight">Humor Genome</div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.25em] text-gold/80">Studio</div>
        </div>
      </Link>

      <div className="space-y-1">
        <p className="px-1 pb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/60">Modules</p>
        <NavItems onNavigate={onNavigate} />
      </div>

      <div className="mt-auto space-y-3">
        {!hasKey && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2.5 text-left text-xs text-gold transition-colors hover:bg-gold/15"
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="block font-semibold">API key required</span>
              <span className="block text-[10px] text-gold/70">Tap to connect Google AI Studio</span>
            </span>
          </button>
        )}
        <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 rounded-full', hasKey ? 'bg-emerald-400 pulse-dot' : 'bg-red-400')} />
            <span className="font-mono text-[10px] text-muted-foreground">
              {hasKey ? `armed · ${settings.model}` : 'no key'}
            </span>
          </div>
        </div>
        <p className="px-1 text-[9px] leading-relaxed text-muted-foreground/50">
          Built for Humor Genome NYC · powered by Gemma & Gemini via Google AI Studio
        </p>
      </div>
    </div>
  );
}

export function StudioLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { settings, hasKey } = useSettings();
  const location = useLocation();
  const current = MODULES.find((m) => location.pathname.startsWith(m.path));

  return (
    <div className="flex min-h-screen bg-background spotlight-bg noise-bg relative">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar-background/80 backdrop-blur lg:block">
        <SidebarBody onOpenSettings={() => setSettingsOpen(true)} />
      </aside>

      {/* Mobile nav */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 border-r-border bg-sidebar-background p-0">
          <SidebarBody onNavigate={() => setMobileNavOpen(false)} onOpenSettings={() => { setMobileNavOpen(false); setSettingsOpen(true); }} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-md sm:px-6">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-sm font-semibold sm:text-base">
              {current?.name ?? 'Studio'}
            </h1>
            <p className="truncate text-[11px] text-muted-foreground">{current?.tagline ?? 'AI humor workbench'}</p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold sm:flex"
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', hasKey ? 'bg-emerald-400' : 'bg-red-400')} />
            {settings.model}
          </button>
          <Button
            onClick={() => setSettingsOpen(true)}
            size="sm"
            className={cn(
              'gap-1.5 font-display text-xs font-semibold',
              hasKey
                ? 'bg-secondary text-foreground hover:bg-secondary/70'
                : 'bg-gold text-background hover:bg-gold/90 shadow-[0_0_18px_-4px_hsl(42_96%_55%/0.6)]',
            )}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {hasKey ? 'Controls' : 'Add API key'}
          </Button>
        </header>

        <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet context={{ openSettings: () => setSettingsOpen(true) }} />
        </main>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
