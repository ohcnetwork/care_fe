import type { TFunction } from "i18next";
import {
  Activity,
  BedDouble,
  CalendarClock,
  ChartSpline,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileClock,
  FileHeart,
  FileText,
  FlaskConical,
  GitPullRequestArrow,
  HeartPulse,
  History,
  Hospital,
  Layers,
  MapPin,
  PanelsTopLeft,
  PillBottle,
  ShieldAlert,
  Sparkles,
  Star,
  Stethoscope,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { CoreWidgetConfigType } from "@/types/workspace/widgetConfigSchemas";

export interface WorkspaceWidgetCatalogItem {
  type: CoreWidgetConfigType;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  group: "clinical" | "workflow" | "details" | "history";
}

export const CORE_WIDGET_CATALOG: WorkspaceWidgetCatalogItem[] = [
  {
    type: "vitals",
    labelKey: "vitals",
    descriptionKey: "workspace_widget_vitals_description",
    icon: HeartPulse,
    group: "clinical",
  },
  {
    type: "diagnosis",
    labelKey: "diagnoses",
    descriptionKey: "workspace_widget_diagnosis_description",
    icon: Stethoscope,
    group: "clinical",
  },
  {
    type: "symptoms",
    labelKey: "symptoms",
    descriptionKey: "workspace_widget_symptoms_description",
    icon: Activity,
    group: "clinical",
  },
  {
    type: "allergies",
    labelKey: "allergies",
    descriptionKey: "workspace_widget_allergies_description",
    icon: ShieldAlert,
    group: "clinical",
  },
  {
    type: "questionnaire_responses",
    labelKey: "questionnaire_responses",
    descriptionKey: "workspace_widget_responses_description",
    icon: FileText,
    group: "clinical",
  },
  {
    type: "service_requests",
    labelKey: "service_requests",
    descriptionKey: "workspace_widget_requests_description",
    icon: ClipboardList,
    group: "clinical",
  },
  {
    type: "outstanding_orders",
    labelKey: "workspace_outstanding_orders",
    descriptionKey: "workspace_outstanding_orders_description",
    icon: FlaskConical,
    group: "clinical",
  },
  {
    type: "current_medications",
    labelKey: "workspace_current_medications",
    descriptionKey: "workspace_current_medications_description",
    icon: PillBottle,
    group: "clinical",
  },
  {
    type: "recent_encounters",
    labelKey: "workspace_recent_encounters",
    descriptionKey: "workspace_recent_encounters_description",
    icon: CalendarClock,
    group: "history",
  },
  {
    type: "referrals",
    labelKey: "referrals",
    descriptionKey: "workspace_widget_referrals_description",
    icon: GitPullRequestArrow,
    group: "workflow",
  },
  {
    type: "reports",
    labelKey: "reports",
    descriptionKey: "workspace_widget_reports_description",
    icon: FileHeart,
    group: "clinical",
  },
  {
    type: "quick_actions",
    labelKey: "quick_actions",
    descriptionKey: "workspace_widget_quick_actions_description",
    icon: Sparkles,
    group: "workflow",
  },
  {
    type: "favorite_forms",
    labelKey: "favorite_forms",
    descriptionKey: "workspace_widget_favorite_forms_description",
    icon: Star,
    group: "workflow",
  },
  {
    type: "draft_forms",
    labelKey: "draft_forms",
    descriptionKey: "workspace_widget_draft_forms_description",
    icon: FileClock,
    group: "workflow",
  },
  {
    type: "encounter_actions",
    labelKey: "encounter_actions",
    descriptionKey: "workspace_widget_encounter_actions_description",
    icon: ClipboardCheck,
    group: "workflow",
  },
  {
    type: "encounter_tags",
    labelKey: "encounter_tags",
    descriptionKey: "workspace_widget_tags_description",
    icon: Tags,
    group: "details",
  },
  {
    type: "locations",
    labelKey: "locations",
    descriptionKey: "workspace_widget_locations_description",
    icon: MapPin,
    group: "details",
  },
  {
    type: "care_team",
    labelKey: "care_team",
    descriptionKey: "workspace_widget_care_team_description",
    icon: Users,
    group: "details",
  },
  {
    type: "departments",
    labelKey: "departments",
    descriptionKey: "workspace_widget_departments_description",
    icon: Hospital,
    group: "details",
  },
  {
    type: "hospitalization",
    labelKey: "workspace_widget_hospitalization",
    descriptionKey: "workspace_widget_hospitalization_description",
    icon: BedDouble,
    group: "details",
  },
  {
    type: "discharge",
    labelKey: "discharge",
    descriptionKey: "workspace_widget_discharge_description",
    icon: DoorOpen,
    group: "details",
  },
  {
    type: "audit_logs",
    labelKey: "workspace_widget_audit_logs",
    descriptionKey: "workspace_widget_audit_logs_description",
    icon: History,
    group: "details",
  },
  {
    type: "observation_chart",
    labelKey: "workspace_observation_chart",
    descriptionKey: "workspace_observation_chart_description",
    icon: ChartSpline,
    group: "clinical",
  },
  {
    type: "account",
    labelKey: "account",
    descriptionKey: "workspace_account_description",
    icon: CreditCard,
    group: "details",
  },
  {
    type: "encounter_summary",
    labelKey: "workspace_encounter_summary",
    descriptionKey: "workspace_encounter_summary_description",
    icon: PanelsTopLeft,
    group: "details",
  },
  {
    type: "encounter_extensions",
    labelKey: "workspace_encounter_extensions",
    descriptionKey: "workspace_encounter_extensions_description",
    icon: Layers,
    group: "clinical",
  },
];

export function workspaceWidgetLabel(type: string, t: TFunction) {
  const item = CORE_WIDGET_CATALOG.find((widget) => widget.type === type);
  return item ? t(item.labelKey) : type;
}
