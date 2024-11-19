import { IconName } from "@/CAREUI/icons/CareIcon";

const eventIconMap: Record<string, IconName> = {
  INTERNAL_TRANSFER: "l-exchange-alt",
  CLINICAL: "l-stethoscope",
  DIAGNOSIS: "l-tablets",
  ENCOUNTER_SUMMARY: "l-file-medical-alt",
  HEALTH: "l-heartbeat",
};

export const getEventIcon = (eventType: string): IconName => {
  return eventIconMap[eventType] || "l-robot";
};
