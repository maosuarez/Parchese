import { createFileRoute } from "@tanstack/react-router";
import { Flame, ShieldCheck, MapPin, Zap } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ProgressRing, SectionTitle, UserAvatar } from "@/components/pulse/primitives";
import { Switch } from "@/components/ui/switch";
import { usePulse } from "@/features/pulse-store";
import { currentUser } from "@/mock/data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — Move, Connect, Recharge, Grow | Parchese" },
      {
        name: "description",
        content:
          "Tu progreso en las cuatro dimensiones del bienestar remoto, tus Pulse Pods, tu zona frecuente y tus controles de privacidad.",
      },
      { property: "og:title", content: "Perfil — Tu bienestar remoto en Parchese" },
      {
        property: "og:description",
        content: "Zona frecuente en lugar de dirección exacta. Bienestar sin vigilancia.",
      },
    ],
  }),
  component: ProfilePage,
});

const safety = [
  "Perfiles verificados",
  "Teléfono y email confirmados",
  "Encuentros en lugares públicos",
  "Bloquear y reportar",
  "Chat moderable",
  "Check-in en el lugar",
  "Grupos pequeños de 3 a 5",
  "Ubicación aproximada",
];

function ProfilePage() {
  const pulse = usePulse();

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="panel-surface flex items-center gap-4 rounded-4xl p-5">
          <UserAvatar user={currentUser} size="lg" showRing />
          <div className="min-w-0">
            <p className="text-xl font-semibold">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.role}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-violet/12 px-2.5 py-1 text-violet">
                Nivel {pulse.level} · {pulse.levelName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow/12 px-2.5 py-1 text-yellow">
                <Zap className="size-3" /> {pulse.points}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-pink/12 px-2.5 py-1 text-pink">
                <Flame className="size-3" /> {pulse.streak} días
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Misiones", value: pulse.missionsCompleted },
            { label: "Conexiones", value: pulse.connections },
            { label: "Pulse Pods", value: pulse.podCreated ? 2 : 1 },
            { label: "Rewards", value: pulse.redeemed.length },
          ].map((stat) => (
            <div key={stat.label} className="panel-surface rounded-3xl p-4 text-center">
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle eyebrow="Cuatro dimensiones" title="Tu balance de la semana" />
          <div className="flex flex-wrap justify-around gap-4">
            <ProgressRing value={pulse.dimensions.move} label="Move" emoji="🏃" accent="yellow" />
            <ProgressRing value={pulse.dimensions.connect} label="Connect" emoji="🤝" accent="cyan" />
            <ProgressRing
              value={pulse.dimensions.recharge}
              label="Recharge"
              emoji="🌿"
              accent="green"
            />
            <ProgressRing value={pulse.dimensions.grow} label="Grow" emoji="🧠" accent="violet" />
          </div>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle eyebrow="Privacidad geográfica" title="Zona frecuente" />
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-background/40 p-4">
            <MapPin className="size-5 text-cyan" />
            <div>
              <p className="text-sm font-semibold">Chapinero · {pulse.radiusKm} km</p>
              <p className="text-[11px] text-muted-foreground">
                Nunca guardamos tu dirección exacta, tu historial completo ni tu ubicación en vivo.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-3xl border border-border bg-background/40 p-4">
            <div>
              <p className="text-sm font-semibold">🔔 Pulse Alerts</p>
              <p className="text-[11px] text-muted-foreground">
                Avísame cuando aparezca algo cerca (score ≥ 70).
              </p>
            </div>
            <Switch checked={pulse.alertsEnabled} onCheckedChange={pulse.toggleAlerts} />
          </div>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle eyebrow="Trust & Safety" title="Siempre visible" />
          <div className="grid gap-2 sm:grid-cols-2">
            {safety.map((item) => (
              <p key={item} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0 text-mint" /> {item}
              </p>
            ))}
          </div>
          {pulse.blocked.length > 0 && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {pulse.blocked.length} persona(s) no volverán a aparecer en tus grupos.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
