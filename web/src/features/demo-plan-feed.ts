import { useEffect, useMemo, useState } from "react";

export type PublicPlan = {
  id: string;
  title: string;
  activity: "caminar" | "cafe" | "cowork" | "juego" | "cancha" | "otro";
  zone: string;
  startsInMinutes: number;
  durationMinutes: number;
  goingCount: number;
  status: "formed" | "open" | "expired";
  visibility: "public" | "private";
  origin: "matched" | "seeded";
  featured?: boolean;
};

const demoPlans: PublicPlan[] = [
  {
    id: "demo-parque-93",
    title: "Una vuelta corta antes de que anochezca",
    activity: "caminar",
    zone: "Chapinero",
    startsInMinutes: 45,
    durationMinutes: 45,
    goingCount: 4,
    status: "formed",
    visibility: "public",
    origin: "matched",
  },
  {
    id: "demo-cafe-zona-g",
    title: "Café sin agenda",
    activity: "cafe",
    zone: "Chapinero",
    startsInMinutes: 70,
    durationMinutes: 45,
    goingCount: 3,
    status: "formed",
    visibility: "public",
    origin: "matched",
  },
  {
    id: "demo-cowork-virgilio",
    title: "Lectura compartida, sin afán",
    activity: "otro",
    zone: "Barrios Unidos",
    startsInMinutes: 100,
    durationMinutes: 90,
    goingCount: 5,
    status: "formed",
    visibility: "public",
    origin: "seeded",
  },
  {
    id: "demo-parques-teusaquillo",
    title: "Mesa de parqués al atardecer",
    activity: "juego",
    zone: "Teusaquillo",
    startsInMinutes: 130,
    durationMinutes: 60,
    goingCount: 4,
    status: "formed",
    visibility: "public",
    origin: "matched",
    featured: true,
  },
  {
    id: "demo-penaltis-nacional",
    title: "Penaltis y charla en la cancha",
    activity: "cancha",
    zone: "Santa Fe",
    startsInMinutes: 165,
    durationMinutes: 60,
    goingCount: 6,
    status: "formed",
    visibility: "public",
    origin: "matched",
  },
  {
    id: "demo-croquis-chorro",
    title: "Croquis al aire libre",
    activity: "otro",
    zone: "La Candelaria",
    startsInMinutes: 200,
    durationMinutes: 75,
    goingCount: 5,
    status: "formed",
    visibility: "public",
    origin: "seeded",
  },
];

export function selectPublicFormedPlans(plans: readonly PublicPlan[]) {
  return plans.filter(
    (plan) => plan.status === "formed" && plan.visibility === "public" && plan.goingCount >= 3,
  );
}

const publicFormedPlans = selectPublicFormedPlans(demoPlans);

const INITIAL_PLAN_COUNT = 4;
const REVEALS = [
  { count: 5, delay: 2200 },
  { count: 6, delay: 7200 },
] as const;

export function formatPlanStart(baseTime: number, startsInMinutes: number) {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
  }).format(baseTime + startsInMinutes * 60_000);
}

export function usePublicPlanFeed() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_PLAN_COUNT);
  const [latestId, setLatestId] = useState<string | null>(null);
  const [baseTime, setBaseTime] = useState(() => Date.now());

  useEffect(() => {
    setVisibleCount(INITIAL_PLAN_COUNT);
    setLatestId(null);
    setBaseTime(Date.now());

    const timers: Array<ReturnType<typeof setTimeout>> = [];

    for (const reveal of REVEALS) {
      const planId = publicFormedPlans[reveal.count - 1]?.id ?? null;

      timers.push(
        setTimeout(() => {
          setVisibleCount(reveal.count);
          setLatestId(planId);
        }, reveal.delay),
      );

      timers.push(
        setTimeout(() => {
          setLatestId((current) => (current === planId ? null : current));
        }, reveal.delay + 3800),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  const allVisiblePlans = useMemo(() => publicFormedPlans.slice(0, visibleCount), [visibleCount]);
  const boardPlans = useMemo(() => allVisiblePlans.slice(-4).reverse(), [allVisiblePlans]);
  const confirmations = useMemo(
    () => allVisiblePlans.reduce((total, plan) => total + plan.goingCount, 0),
    [allVisiblePlans],
  );
  const activeZones = useMemo(
    () => new Set(allVisiblePlans.map((plan) => plan.zone)).size,
    [allVisiblePlans],
  );

  return {
    source: "demo" as const,
    plans: boardPlans,
    planCount: visibleCount,
    confirmations,
    activeZones,
    latestId,
    baseTime,
  };
}
