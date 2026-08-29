import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Parchese — Trabajar remoto sin vivir aislado" },
      {
        name: "description",
        content:
          "Parchese convierte pequeños momentos del día en movimiento, compañía y conexiones reales para quienes trabajan remoto y viven solos.",
      },
      { property: "og:title", content: "Parchese — Trabajar remoto sin vivir aislado" },
      {
        property: "og:description",
        content:
          "Una red social que intenta sacarte de la red social: necesidad, IA, misión, mapa, grupo pequeño y encuentro real.",
      },
    ],
  }),
  component: LandingPage,
});

const problems = [
  { emoji: "🧍", label: "Aislamiento" },
  { emoji: "🪑", label: "Sedentarismo" },
  { emoji: "💬", label: "Falta de interacción espontánea" },
  { emoji: "🏠", label: "Casa = oficina permanente" },
  { emoji: "🌫️", label: "Fatiga mental" },
];

const differentials = [
  { from: "NO FEED", to: "acción" },
  { from: "NO SWIPE", to: "experiencias" },
  { from: "NO LIKES", to: "hábitos" },
  { from: "NO FOLLOWERS", to: "conexiones reales" },
  { from: "NO DMs RANDOM", to: "chat contextual" },
];

const journey = [
  "🏠 Trabajo solo",
  "🔋 Social Battery",
  "✨ IA",
  "🗺 Pulse Map",
  "🎯 Misión",
  "👥 Grupo",
  "🧭 Ruta",
  "📍 Check-in",
  "🤝 Experiencia",
  "⚡ Pulse Points",
  "❤️ Repetir",
  "👥 Pulse Pod",
  "🎁 Social Reward",
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-cyan/15 text-cyan">
            <Zap className="size-4" />
          </span>
          <span className="font-sans text-lg font-semibold">Parchese</span>
        </span>
        <Button asChild size="sm">
          <Link to="/">Probar Parchese</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="py-12 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gradient-pulse">
            Social wellness para remote workers
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Trabajar remoto <span className="text-gradient-pulse">sin vivir aislado</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Parchese convierte pequeños momentos del día en movimiento, compañía y conexiones reales.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/">
                Probar Parchese <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/business">Ver dashboard B2B</Link>
            </Button>
          </div>
          <p className="mt-8 max-w-xl rounded-3xl border border-border bg-panel/60 p-5 text-sm leading-relaxed text-muted-foreground">
            “Parchese es el copiloto social de las personas que trabajan remoto y viven solas. Entiende
            cuándo necesitas moverte, recargar, trabajar acompañado o ver personas y convierte ese
            momento en una misión real con un pequeño grupo compatible cerca de ti.”
          </p>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold">El problema</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {problems.map((p) => (
              <div key={p.label} className="panel-surface rounded-3xl p-4">
                <span className="text-2xl">{p.emoji}</span>
                <p className="mt-2 text-sm font-medium">{p.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="max-w-2xl text-2xl font-semibold">
            No construimos otra red social. Construimos una red que intenta sacarte de la pantalla.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {differentials.map((d) => (
              <div key={d.from} className="panel-surface rounded-3xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {d.from}
                </p>
                <p className="mt-1 text-sm font-semibold text-mint">→ {d.to}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold">El loop</h2>
          <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
            {journey.map((step, i) => (
              <div key={step} className="flex shrink-0 items-center gap-2">
                <span className="rounded-2xl border border-border bg-panel/70 px-3.5 py-2 text-xs">
                  {step}
                </span>
                {i < journey.length - 1 && <span className="text-cyan">→</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="panel-surface mt-8 rounded-4xl p-8 text-center">
          <h2 className="text-2xl font-semibold">Vivir solo no debería significar sentirse solo.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Al completar experiencias ganas Pulse Points que puedes usar en beneficios sociales como
            cafés, coworking, bienestar y actividades.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/">Probar Parchese</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
