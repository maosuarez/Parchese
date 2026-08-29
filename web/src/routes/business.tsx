import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeOff, ShieldCheck } from "lucide-react";

import { ProgressRing } from "@/components/pulse/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Dashboard B2B — Bienestar sin vigilancia | Parchese" },
      {
        name: "description",
        content:
          "Métricas agregadas de participación, misiones, conexiones y recurrencia para equipos remotos. Sin datos individuales ni ubicación.",
      },
      { property: "og:title", content: "Dashboard B2B — Bienestar sin vigilancia" },
      {
        property: "og:description",
        content: "Las empresas ven participación agregada. Nunca ubicación, mensajes ni estado emocional.",
      },
    ],
  }),
  component: BusinessPage,
});

const kpis = [
  { label: "Participación", value: "76%" },
  { label: "Misiones", value: "1.284" },
  { label: "Conexiones", value: "438" },
  { label: "Repetición", value: "42%" },
];

const cannotSee = [
  "Cómo se siente una persona",
  "Ubicación individual",
  "Con quién estuvo",
  "Mensajes del chat",
  "Estado emocional",
];

const canSee = [
  "Participación agregada",
  "Misiones completadas",
  "Conexiones generadas",
  "Recurrencia",
  "Categorías de actividad",
];

function BusinessPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Parchese for Teams</h1>
          <p className="text-xs text-muted-foreground">Demo · datos agregados de un equipo remoto</p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link to="/">Volver a la app</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="panel-surface rounded-3xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section className="panel-surface mt-4 rounded-4xl p-6">
        <h2 className="text-lg font-semibold">Balance de bienestar del equipo</h2>
        <div className="mt-5 flex flex-wrap justify-around gap-5">
          <ProgressRing value={82} label="Move" emoji="🏃" accent="yellow" />
          <ProgressRing value={76} label="Connect" emoji="🤝" accent="cyan" />
          <ProgressRing value={64} label="Recharge" emoji="🌿" accent="green" />
          <ProgressRing value={69} label="Grow" emoji="🧠" accent="violet" />
        </div>
        <div className="mt-6 space-y-3">
          {[
            { label: "Move", value: 82 },
            { label: "Connect", value: 76 },
            { label: "Recharge", value: 64 },
            { label: "Grow", value: 69 },
          ].map((d) => (
            <div key={d.label}>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{d.label}</span>
                <span>{d.value}%</span>
              </div>
              <Progress value={d.value} className="h-1.5" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="panel-surface rounded-4xl p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-destructive">
            <EyeOff className="size-4" /> La empresa NO puede ver
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {cannotSee.map((i) => (
              <li key={i}>· {i}</li>
            ))}
          </ul>
        </div>
        <div className="panel-surface rounded-4xl p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-mint">
            <ShieldCheck className="size-4" /> Sí puede ver
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {canSee.map((i) => (
              <li key={i}>· {i}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-6 text-center text-lg font-semibold text-gradient-pulse">
        Bienestar sin vigilancia.
      </p>
    </div>
  );
}
