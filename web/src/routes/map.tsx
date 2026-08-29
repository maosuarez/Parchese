import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PulseMap } from "@/components/maps/PulseMap";
import { PulseRadar } from "@/components/maps/PulseRadar";
import { CreateEventDialog } from "@/components/pulse/CreateEventDialog";
import { EventBottomSheet } from "@/components/pulse/EventBottomSheet";
import { EventCard } from "@/components/pulse/EventCard";
import {
  EventFilters,
  radiusLabel,
  radiusOptions,
  type CategoryFilter,
  type TimeFilter,
} from "@/components/pulse/EventFilters";
import { Chip, SectionTitle } from "@/components/pulse/primitives";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/features/pulse-store";
import type { PulseEvent } from "@/types";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Pulse Map — Qué está pasando cerca de ti | Parchese" },
      {
        name: "description",
        content:
          "Explora cafés, caminatas, coworks y experiencias reales alrededor de tu zona frecuente, con radio ajustable y Pulse Radar.",
      },
      { property: "og:title", content: "Pulse Map — Qué está pasando cerca de ti" },
      {
        property: "og:description",
        content: "Un mapa vivo de experiencias presenciales para personas que trabajan remoto.",
      },
    ],
  }),
  component: MapPage,
});

function matchesTime(event: PulseEvent, filter: TimeFilter) {
  switch (filter) {
    case "all":
      return true;
    case "now":
      return event.day === "today" && (event.slot === "afternoon" || event.slot === "lunch");
    case "today":
      return event.day === "today";
    case "afternoon":
      return event.day === "today" && event.slot === "afternoon";
    case "evening":
      return event.day === "today" && event.slot === "evening";
    case "tomorrow":
      return event.day === "tomorrow";
    case "weekend":
      return event.day === "weekend";
  }
}

function MapPage() {
  const navigate = useNavigate();
  const pulse = usePulse();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [time, setTime] = useState<TimeFilter>("all");
  const [selected, setSelected] = useState<PulseEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(
    () =>
      pulse.events
        .filter((e) => e.status !== "cancelled")
        .filter((e) => (category === "all" ? true : e.category === category))
        .filter((e) => matchesTime(e, time))
        .filter((e) => e.distance_m <= pulse.radiusKm * 1000)
        .sort((a, b) => b.match_score - a.match_score),
    [pulse.events, category, time, pulse.radiusKm],
  );

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Pulse Map</h1>
            <p className="text-xs text-muted-foreground">
              Chapinero · Bogotá · zona frecuente (nunca tu dirección exacta)
            </p>
          </div>
          <CreateEventDialog
            trigger={
              <Button size="sm" variant="secondary">
                <Plus className="mr-1 size-4" /> Crear experiencia
              </Button>
            }
          />
        </div>

        <EventFilters category={category} onCategory={setCategory} time={time} onTime={setTime} />

        <div>
          <p className="mb-2 text-xs text-muted-foreground">¿Qué tan lejos quieres salir?</p>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {radiusOptions.map((km) => (
              <Chip key={km} active={pulse.radiusKm === km} onClick={() => pulse.setRadius(km)}>
                {radiusLabel(km)}
              </Chip>
            ))}
          </div>
        </div>

        <PulseMap
          events={filtered}
          radiusKm={pulse.radiusKm}
          selectedId={selected?.id ?? null}
          onSelect={(event) => {
            setSelected(event);
            setSheetOpen(true);
          }}
          className="h-[52vh] min-h-[320px] lg:h-[440px]"
        />

        <section className="panel-surface rounded-4xl p-4">
          <SectionTitle
            eyebrow="Bottom sheet"
            title={`${filtered.length} cosas pasando cerca de ti`}
          />
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={(e) => {
                    setSelected(e);
                    setSheetOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-background/40 p-5 text-center">
              <p className="text-base font-semibold">Hoy está tranquilo por aquí 🌙</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Podemos ampliar tu radio o crear algo.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => pulse.setRadius(5)}>
                  Ampliar a 5 km
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate({ to: "/" })}>
                  ✨ Break Me Out
                </Button>
              </div>
            </div>
          )}
        </section>

        <PulseRadar events={pulse.events} />
      </div>

      <EventBottomSheet
        event={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onJoin={(event) => {
          pulse.joinEvent(event);
          navigate({ to: "/missions" });
        }}
      />
    </AppShell>
  );
}
