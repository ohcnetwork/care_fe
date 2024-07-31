import { logUpdateSection } from "../utils";
import ABGAnalysis from "./ABGAnalysis";
import BloodSugar from "./BloodSugar";
import Dialysis from "./Dialysis";
import IOBalance from "./IOBalance";
import NeurologicalMonitoring from "./NeurologicalMonitoring";
import NursingCare from "./NursingCare";
import PressureSore from "./PressureSore";
import RespiratorySupport from "./RespiratorySupport";
import Vitals from "./Vitals";

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
} as const satisfies Record<string, ReturnType<typeof logUpdateSection>>;

export default LogUpdateSections;
