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
  ABGAnalysis,
  BloodSugar,
  Dialysis,
  IOBalance,
  NeurologicalMonitoring,
  NursingCare,
  PressureSore,
  RespiratorySupport,
  Vitals,
} as const satisfies Record<string, ReturnType<typeof logUpdateSection>>;

export default LogUpdateSections;
