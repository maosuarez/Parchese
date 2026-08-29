import { formatPlanStart, type PublicPlan, usePublicPlanFeed } from "@/features/demo-plan-feed";
import { cn } from "@/lib/utils";

function SmallPlanNote({ plan, isLatest }: { plan: PublicPlan; isLatest: boolean }) {
  return (
    <article
      className={cn("parchese-note", isLatest && "parchese-note-new")}
      aria-label={`${plan.title}, ${plan.zone}, ${plan.goingCount} personas ya van`}
    >
      <p className="parchese-note-topline">{isLatest ? "Recién se armó" : "Plan formado"}</p>
      <h3>{plan.title}</h3>
      <p className="parchese-note-details">
        {plan.zone} · Ya van {plan.goingCount}
      </p>
    </article>
  );
}

export function LivePlanBoard() {
  const feed = usePublicPlanFeed();
  const featuredPlan = feed.plans.find((plan) => plan.featured) ?? feed.plans[0];
  const supportingPlans = feed.plans.filter((plan) => plan.id !== featuredPlan?.id).slice(0, 2);
  const latestPlan = feed.latestId
    ? feed.plans.find((plan) => plan.id === feed.latestId)
    : undefined;

  if (!featuredPlan) return null;

  return (
    <main className="parchese-stage">
      <div className="parchese-paper-grain" aria-hidden="true" />
      <div className="parchese-shell">
        <header className="parchese-header">
          <div className="parchese-brand-lockup">
            <span className="parchese-wordmark">Parchese</span>
            <span className="parchese-brand-dot" aria-hidden="true" />
          </div>
        </header>

        <section className="parchese-content" aria-label="Planes formados en Bogotá">
          <article
            key={`${featuredPlan.id}-${featuredPlan.id === feed.latestId ? "new" : "steady"}`}
            className={cn(
              "parchese-invitation",
              featuredPlan.id === feed.latestId && "parchese-invitation-new",
            )}
            aria-labelledby="parchese-goal"
          >
            <span className="parchese-tape" aria-hidden="true" />
            <div className="parchese-invitation-copy">
              <h1 id="parchese-goal">Que hacer plan en Bogotá vuelva a sentirse fácil.</h1>
              <h2 id="featured-plan-title">{featuredPlan.title}</h2>
              <p className="parchese-plan-meta" suppressHydrationWarning>
                {featuredPlan.zone} · hoy{" "}
                {formatPlanStart(feed.baseTime, featuredPlan.startsInMinutes)} ·{" "}
                {featuredPlan.durationMinutes} min
              </p>

              <p className="parchese-join-line">
                Ya van {featuredPlan.goingCount}. <span>Puedes sumarte.</span>
              </p>
            </div>

            <figure className="parchese-illustration">
              <img
                src="/images/parchese-parques-table.png"
                alt="Ilustración de dos manos anónimas jugando parqués alrededor de una mesa de café"
                width="1448"
                height="1086"
                decoding="async"
                fetchPriority="high"
              />
            </figure>
          </article>

          <aside className="parchese-side-notes" aria-labelledby="other-plans-title">
            <h2 id="other-plans-title" className="parchese-visually-hidden">
              Otros planes ya listos
            </h2>

            <div className="parchese-notes-stack">
              {supportingPlans.map((plan) => (
                <SmallPlanNote key={plan.id} plan={plan} isLatest={plan.id === feed.latestId} />
              ))}
            </div>

            <p className="parchese-live-announcement" aria-live="polite">
              {latestPlan ? `Nuevo plan formado: ${latestPlan.title}, ${latestPlan.zone}.` : ""}
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
