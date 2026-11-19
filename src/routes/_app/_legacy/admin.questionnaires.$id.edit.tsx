import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

/** Questionnaire studio (full-screen builder). */
export const Route = createFileRoute(
  "/_app/_legacy/admin/questionnaires/$id/edit",
)({ staticData: fullScreenPage });
