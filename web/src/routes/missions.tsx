import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, QrCode, Send, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { RouteViewer } from "@/components/maps/RouteViewer";
import { EventCard } from "@/components/pulse/EventCard";
import { MetaPill, SectionTitle, UserAvatar } from "@/components/pulse/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePulse } from "@/features/pulse-store";
import { icebreakers, missionBonuses, personById } from "@/mock/data";
import { cn } from "@/lib/utils";
import type { TransportMode } from "@/types";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Planes | Parchese" },
      {
        name: "description",
        content:
          "Sigue tu misión activa: grupo compatible, icebreakers, ruta paso a paso, check-in en lugar público y Pulse Points al completar.",
      },
      { property: "og:title", content: "Misiones — Tu grupo, tu ruta, tu check-in" },
      {
        property: "og:description",
        content: "Parchese muestra planes públicos que ya tienen un grupo formado.",
      },
    ],
  }),
  component: MissionsPage,
});

const statusLabel: Record<string, string> = {
  confirmed: "✓ Confirmada",
  on_the_way: "· En camino",
  checked_in: "✓ Check-in",
  registered: "· Registrada",
  completed: "✓ Completada",
  cancelled: "· Canceló",
};

function MissionsPage() {
  const navigate = useNavigate();
  const pulse = usePulse();
  const [mode, setMode] = useState<TransportMode>("walk");
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState("");

  const roster = useMemo(() => Object.keys(pulse.participantStatus), [pulse.participantStatus]);
  const others = roster.filter((id) => id !== "u-eli");
  const podEvent = pulse.events.find((e) => e.is_pod);
  const yesVotes = Object.entries(pulse.againVotes).filter(([, v]) => v === "yes");

  if (!pulse.mission || !pulse.joined) {
    return (
      <AppShell>
        <div className="panel-surface rounded-4xl p-6 text-center">
          <p className="text-lg font-semibold">Aún no tienes una misión activa 🌙</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Dinos qué necesita tu día y encontramos una experiencia presencial con un grupo pequeño
            cerca de ti.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={() => navigate({ to: "/" })}>✨ Break Me Out</Button>
            <Button variant="secondary" onClick={() => navigate({ to: "/map" })}>
              Ver Pulse Map
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { mission } = pulse;
  const checkedCount = roster.filter((id) => pulse.participantStatus[id] === "checked_in").length;

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="panel-surface rounded-4xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan">
            Misión activa
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {mission.emoji} {mission.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mission.event.when_label} · {mission.event.duration_min} min · +
            {mission.event.pulse_points} ⚡
          </p>
          <Progress
            value={pulse.completed ? 100 : pulse.checkedIn ? 75 : 40}
            className="mt-4 h-1.5"
          />
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Unido</span>
            <span>En camino</span>
            <span>Check-in</span>
            <span>Completada</span>
          </div>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle eyebrow="Matching social" title="Tu grupo" />
          <div className="space-y-2.5">
            {roster.map((id) => {
              const person = personById(id);
              const status = pulse.participantStatus[id]!;
              return (
                <div key={id} className="flex items-center gap-3">
                  <UserAvatar user={person} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {person.name}{" "}
                      {id === "u-eli" && <span className="text-muted-foreground">· Tú</span>}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{person.role}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px]",
                      status === "checked_in" || status === "confirmed"
                        ? "text-mint"
                        : "text-muted-foreground",
                    )}
                  >
                    {statusLabel[status]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-3xl border border-border bg-background/40 p-4">
            <p className="text-sm font-semibold text-mint">78% compatibilidad social</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Todos trabajan remoto. Tres tienen intereses en tecnología y creatividad. Nadie se
              conoce todavía.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <MetaPill>Zona compartida</MetaPill>
              <MetaPill>Horario compatible</MetaPill>
              <MetaPill>Social Battery similar</MetaPill>
            </div>
          </div>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">
            Facilitación de Parchese
          </p>
          <p className="mt-2 text-sm leading-relaxed">“{icebreakers[0]}”</p>
          <div className="mt-3 space-y-1.5">
            {icebreakers.slice(1).map((q) => (
              <p key={q} className="text-xs text-muted-foreground">
                · {q}
              </p>
            ))}
          </div>
        </section>

        <section>
          <RouteViewer event={mission.event} mode={mode} onModeChange={setMode} />
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle eyebrow="Chat de misión" title="Solo para este encuentro" />
          <div className="space-y-2">
            {pulse.chat.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  m.system
                    ? "mx-auto bg-mint/10 text-mint"
                    : m.authorId === "u-eli"
                      ? "ml-auto bg-cyan/12 text-foreground"
                      : "bg-panel-2/70 text-foreground",
                )}
              >
                {!m.system && (
                  <span className="mr-1 font-semibold">
                    {m.authorId === "u-eli" ? "Tú" : personById(m.authorId).name}:
                  </span>
                )}
                {m.text}
              </div>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              pulse.sendMessage(draft.trim());
              setDraft("");
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe al grupo…"
            />
            <Button type="submit" size="icon" aria-label="Enviar">
              <Send className="size-4" />
            </Button>
          </form>
        </section>

        <section className="panel-surface rounded-4xl p-5">
          <SectionTitle
            eyebrow="Check-in"
            title={`${checkedCount} / ${roster.length} en el lugar`}
          />
          {!pulse.checkedIn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-3xl border border-border bg-background/40 p-4">
                <QrCode className="size-9 text-cyan" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">Escanea el QR del lugar</p>
                  <p className="text-[11px] text-muted-foreground">
                    O ingresa el código del grupo: <span className="text-cyan">PULSE24</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PULSE24"
                />
                <Button onClick={pulse.checkIn}>Hacer check-in</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint">
                <Check className="size-4" /> Check-in confirmado
              </p>
              <div className="rounded-3xl border border-yellow/25 bg-yellow/8 p-4">
                <p className="text-xs font-semibold text-yellow">🎯 Bonus de misión</p>
                <p className="mt-1 text-xs text-muted-foreground">{missionBonuses[0]}</p>
              </div>
              {!pulse.completed ? (
                <Button className="w-full" size="lg" onClick={pulse.completeMission}>
                  Completar misión · +{mission.event.pulse_points} ⚡
                </Button>
              ) : (
                <div className="animate-rise rounded-3xl border border-mint/30 bg-mint/10 p-5 text-center">
                  <p className="text-3xl">🎉</p>
                  <p className="mt-1 text-lg font-semibold text-mint">
                    +{mission.event.pulse_points} Pulse Points
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nuevo saldo: {pulse.points} ⚡ · Racha {pulse.streak} días 🔥
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {pulse.completed && (
          <section className="panel-surface animate-rise rounded-4xl p-5">
            <SectionTitle eyebrow="Post-mission" title="¿Te gustaría coincidir nuevamente?" />
            <p className="mb-3 text-[11px] text-muted-foreground">
              Tus respuestas son privadas. Nadie verá lo que elijas.
            </p>
            <div className="space-y-2">
              {others.map((id) => {
                const person = personById(id);
                const vote = pulse.againVotes[id];
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-3xl border border-border bg-background/40 p-3"
                  >
                    <UserAvatar user={person} size="sm" />
                    <span className="flex-1 text-sm">{person.name}</span>
                    {(["yes", "neutral", "no"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => pulse.voteAgain(id, v)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-sm transition-colors",
                          vote === v ? "bg-cyan/20" : "bg-panel-2/60 hover:bg-panel-2",
                        )}
                        aria-label={v}
                      >
                        {v === "yes" ? "❤️" : v === "neutral" ? "🙂" : "🚫"}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {yesVotes.length >= 2 && (
              <div className="animate-rise mt-4 rounded-3xl border border-cyan/30 bg-cyan/8 p-5">
                <p className="text-sm font-semibold text-cyan">⚡ Encontraste tu Pulse Pod</p>
                <div className="mt-3 flex items-center gap-2">
                  <UserAvatar user={personById("u-eli")} size="sm" />
                  {yesVotes.map(([id]) => (
                    <UserAvatar key={id} user={personById(id)} size="sm" />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Una amistad necesita más de una oportunidad.
                </p>
                {!pulse.podCreated ? (
                  <Button className="mt-4 w-full" onClick={pulse.createPod}>
                    Crear Pulse Pod
                  </Button>
                ) : (
                  podEvent && (
                    <div className="mt-4">
                      <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-mint">
                        <Sparkles className="size-3" /> Siguiente misión sugerida para tu Pod
                      </p>
                      <EventCard event={podEvent} onSelect={() => navigate({ to: "/rewards" })} />
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
