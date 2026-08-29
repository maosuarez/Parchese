import { createFileRoute } from "@tanstack/react-router";
import { Flame, Zap } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SectionTitle } from "@/components/pulse/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePulse } from "@/features/pulse-store";
import { pulsePointRules, rewards } from "@/mock/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — Canjea Pulse Points en beneficios sociales | Parchese" },
      {
        name: "description",
        content:
          "Convierte tus Pulse Points en cafés 2×1, day passes de cowork, yoga +1 y almuerzos compartidos con partners locales.",
      },
      { property: "og:title", content: "Rewards — Beneficios sociales con Pulse Points" },
      {
        property: "og:description",
        content: "Premiamos consistencia, movimiento y conexiones reales. Nunca likes ni followers.",
      },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const pulse = usePulse();

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-4xl border border-border bg-panel p-6">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-yellow/15 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Tus Pulse Points
            </p>
            <p className="mt-1 flex items-center gap-2 text-4xl font-semibold">
              <Zap className="size-7 text-yellow" />
              {pulse.points}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-violet/12 px-3 py-1 text-violet">
                Nivel {pulse.level} · {pulse.levelName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-pink/12 px-3 py-1 text-pink">
                <Flame className="size-3" /> {pulse.streak} días
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>XP</span>
                <span>
                  {pulse.xp} / {pulse.xpGoal}
                </span>
              </div>
              <Progress value={(pulse.xp / pulse.xpGoal) * 100} className="h-2" />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="Social rewards" title="Beneficios para compartir" />
          <div className="grid gap-3 sm:grid-cols-2">
            {rewards.map((reward) => {
              const owned = pulse.redeemed.includes(reward.id);
              const affordable = pulse.points >= reward.cost;
              return (
                <div
                  key={reward.id}
                  className={cn(
                    "panel-surface flex flex-col rounded-3xl p-4 transition-all duration-300",
                    owned && "border-mint/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">{reward.emoji}</span>
                    <span className="rounded-full bg-panel-2/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {reward.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{reward.title}</p>
                  <p className="text-[11px] text-muted-foreground">{reward.partner}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow">
                      <Zap className="size-3.5" /> {reward.cost}
                    </span>
                    <Button
                      size="sm"
                      variant={owned ? "secondary" : affordable ? "default" : "ghost"}
                      disabled={owned}
                      onClick={() => pulse.redeem(reward.id)}
                    >
                      {owned ? "Desbloqueado 🎁" : "Canjear"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle eyebrow="Cómo se ganan" title="Premiamos hábitos, no popularidad" />
          <div className="grid gap-2 sm:grid-cols-2">
            {pulsePointRules.map((rule) => (
              <div
                key={rule.label}
                className="flex items-center justify-between rounded-2xl bg-panel-2/50 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{rule.label}</span>
                <span className="text-xs font-semibold text-yellow">+{rule.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            No premiamos followers, likes, popularidad ni número de mensajes.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
