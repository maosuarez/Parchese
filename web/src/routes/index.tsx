import { createFileRoute } from "@tanstack/react-router";

import { LivePlanBoard } from "@/components/pulse/LivePlanBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parchese | Hacer plan en Bogotá, fácil" },
      {
        name: "description",
        content:
          "Parchese muestra planes públicos que ya se formaron en Bogotá. Una invitación sencilla para sumarse.",
      },
      {
        property: "og:title",
        content: "Parchese | Hacer plan debería sentirse fácil",
      },
      {
        property: "og:description",
        content: "Una invitación a los planes públicos que ya se armaron en Bogotá.",
      },
    ],
  }),
  component: LivePlanBoard,
});
