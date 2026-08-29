import { Link, useRouterState } from "@tanstack/react-router";
import { Gift, Home, Map, Target, User, Zap } from "lucide-react";

import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { usePulse } from "@/features/pulse-store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Inicio", Icon: Home },
  { to: "/map", label: "Pulse Map", Icon: Map },
  { to: "/missions", label: "Misiones", Icon: Target },
  { to: "/rewards", label: "Rewards", Icon: Gift },
  { to: "/profile", label: "Perfil", Icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { points } = usePulse();

  return (
    <div className="min-h-screen lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-panel/60 px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-cyan/15 text-cyan">
            <Zap className="size-4" />
          </span>
          <span className="font-sans text-lg font-semibold tracking-tight">Parchese</span>
        </Link>
        <nav className="space-y-1">
          {nav.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-cyan/12 text-cyan"
                    : "text-muted-foreground hover:bg-panel-2/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <Link
            to="/business"
            className="block rounded-2xl bg-panel-2/60 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Dashboard B2B
          </Link>
          <Link
            to="/landing"
            className="block rounded-2xl bg-panel-2/60 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Landing pública
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-xl bg-cyan/15 text-cyan">
              <Zap className="size-4" />
            </span>
            <span className="font-sans text-base font-semibold">Parchese</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Copiloto social · {new Date().toLocaleDateString("es-CO", { weekday: "long" })}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow/12 px-3 py-1.5 text-xs font-semibold text-yellow">
              <Zap className="size-3.5" />
              {points}
            </span>
            <NotificationCenter />
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">{children}</div>
        </main>

        {/* mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <div className="glass mx-3 mb-3 flex items-center justify-between rounded-3xl px-2 py-2">
            {nav.map(({ to, label, Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium transition-colors",
                    active ? "text-cyan" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-xl transition-colors",
                      active && "bg-cyan/12",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
