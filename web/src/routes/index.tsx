import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { Home as HomeIcon, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PulseRadar } from "@/components/maps/PulseRadar";
import { EventCard } from "@/components/pulse/EventCard";
import { MissionCard } from "@/components/pulse/MissionCard";
import { NeedSelector, SocialBatteryPicker, TimeSelector } from "@/components/pulse/break-me-out";
import { SectionTitle } from "@/components/pulse/primitives";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/features/pulse-store";
import { currentUser } from "@/mock/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parchese — Copiloto social para quien trabaja remoto" },
      {
        name: "description",
        content:
          "Parchese convierte tu necesidad de hoy en una misión real: café, caminata o cowork con un grupo pequeño y compatible cerca de ti.",
      },
      { property: "og:title", content: "Parchese — Copiloto social para quien trabaja remoto" },
      {
        property: "og:description",
        content:
          "Vivir solo no debería significar sentirse solo. Elige qué necesitas hoy y Parchese encuentra una experiencia presencial cerca.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const pulse = usePulse();
  const missionRef = useRef<HTMLDivElement>(null);

  const nearby = useMemo(
    () =>
      pulse.events
        .filter((e) => e.distance_m <= pulse.radiusKm * 1000 && !e.is_pod)
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 6),
    [pulse.events, pulse.radiusKm],
  );

  const ready = pulse.need && pulse.battery && pulse.time;

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="animate-rise">
          <p className="text-2xl font-semibold sm:text-3xl">Hola, {currentUser.name} 👋</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tu casa es tu oficina. Hoy no tiene que ser todo tu mundo.
          </p>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-panel/70 px-3 py-1.5 text-xs text-muted-foreground">
            <HomeIcon className="size-3.5 text-cyan" /> 🏠 Remote · Home alone
          </span>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gradient-pulse">
            ✨ Break me out
          </p>
          <h2 className="mt-1 text-xl font-semibold">¿Qué necesita tu día?</h2>
          <div className="mt-4">
            <NeedSelector value={pulse.need} onChange={pulse.setNeed} />
          </div>

          {pulse.need && (
            <div className="animate-rise mt-6">
              <h3 className="text-base font-semibold">¿Cuánta energía social tienes hoy?</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Tu Social Battery cambia todos los días. Ajusta la intensidad, no tu personalidad.
              </p>
              <SocialBatteryPicker value={pulse.battery} onChange={pulse.setBattery} />
            </div>
          )}

          {pulse.battery && (
            <div className="animate-rise mt-6">
              <h3 className="mb-3 text-base font-semibold">¿Cuánto tiempo tienes?</h3>
              <TimeSelector value={pulse.time} onChange={pulse.setTime} />
            </div>
          )}

          {ready && (
            <Button
              className="animate-rise mt-6 w-full"
              size="lg"
              onClick={() => {
                pulse.buildMission();
                requestAnimationFrame(() =>
                  missionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
                );
              }}
            >
              <Sparkles className="mr-1 size-4" /> Encontrar algo para mí
            </Button>
          )}
        </section>

        <div ref={missionRef}>
          {pulse.mission && (
            <MissionCard
              mission={pulse.mission}
              onAccept={() => {
                pulse.acceptMission();
                navigate({ to: "/missions" });
              }}
              onOpenMap={() => navigate({ to: "/map" })}
            />
          )}
        </div>

        <section>
          <SectionTitle
            eyebrow="Cerca de ti"
            title={`${nearby.length} cosas pasando cerca`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/map" })}>
                Ver mapa
              </Button>
            }
          />
          {nearby.length > 0 ? (
            <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {nearby.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact
                  onSelect={() => navigate({ to: "/map" })}
                />
              ))}
            </div>
          ) : (
            <div className="panel-surface rounded-3xl p-5 text-center">
              <p className="text-base font-semibold">Hoy está tranquilo por aquí 🌙</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Podemos ampliar tu radio o crear algo.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => pulse.setRadius(5)}>
                  Ampliar a 5 km
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate({ to: "/map" })}>
                  Crear evento
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-mint">
                4 remote workers están interesados en hacer algo hoy.
              </p>
            </div>
          )}
        </section>

        <PulseRadar events={pulse.events} />
      </div>
    </AppShell>
  );
}
