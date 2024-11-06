import React from "react";
import ABGAnalysis from "./ABGAnalysis";
import BloodSugar from "./BloodSugar";
import Dialysis from "./Dialysis";
import IOBalance from "./IOBalance";
import NeurologicalMonitoring from "./NeurologicalMonitoring";
import NursingCare from "./NursingCare";
import PressureSore from "./PressureSore/PressureSore";
import RespiratorySupport from "./RespiratorySupport";
import Vitals from "./Vitals";
import { LogUpdateSectionMeta, LogUpdateSectionProps } from "../utils";
import { DailyRoundTypes } from "../../Patient/models";

const LogUpdateSections = {
  Vitals,
  NeurologicalMonitoring,
  RespiratorySupport,
  ABGAnalysis,
  BloodSugar,
  IOBalance,
  Dialysis,
  PressureSore,
  NursingCare,
} as const satisfies Record<
  string,
  React.FC<LogUpdateSectionProps> & { meta: LogUpdateSectionMeta }
>;

export default LogUpdateSections;

export const RoundTypeSections = {
  NORMAL: [],
  AUTOMATED: [],
  TELEMEDICINE: [],
  VENTILATOR: [
    "Vitals",
    "NeurologicalMonitoring",
    "RespiratorySupport",
    "ABGAnalysis",
    "BloodSugar",
    "IOBalance",
    "Dialysis",
    "PressureSore",
    "NursingCare",
  ],
  DOCTORS_LOG: ["NeurologicalMonitoring", "RespiratorySupport"],
  COMMUNITY_NURSES_LOG: [],
} as const satisfies Record<
  (typeof DailyRoundTypes)[number],
  (keyof typeof LogUpdateSections)[]
>;
