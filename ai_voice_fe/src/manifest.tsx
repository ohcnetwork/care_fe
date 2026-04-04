import { lazy } from "react";

const VoiceTranscriptionTab = lazy(
  () => import("@/components/VoiceTranscriptionTab")
);
const EncounterActions = lazy(
  () => import("@/components/EncounterQuickAction")
);

export const manifest = {
  plugin: "ai_voice_fe",
  routes: {},
  components: {
    EncounterActions,
  },
  encounterTabs: {
    ai_voice: VoiceTranscriptionTab,
  },
  navItems: [],
  extends: [],
};
