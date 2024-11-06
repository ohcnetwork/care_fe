import React from "react";

import ABGAnalysis from "@/components/LogUpdate/Sections/ABGAnalysis";
import BloodSugar from "@/components/LogUpdate/Sections/BloodSugar";
import Dialysis from "@/components/LogUpdate/Sections/Dialysis";
import IOBalance from "@/components/LogUpdate/Sections/IOBalance";
import NeurologicalMonitoring from "@/components/LogUpdate/Sections/NeurologicalMonitoring";
import NursingCare from "@/components/LogUpdate/Sections/NursingCare";
import PressureSore from "@/components/LogUpdate/Sections/PressureSore/PressureSore";
import RespiratorySupport from "@/components/LogUpdate/Sections/RespiratorySupport";
import Vitals from "@/components/LogUpdate/Sections/Vitals";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";
import { DailyRoundTypes } from "@/components/Patient/models";

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
