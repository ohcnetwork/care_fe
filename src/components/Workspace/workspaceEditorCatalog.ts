import type { TFunction } from "i18next";
import {
  Activity,
  BedDouble,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  FileClock,
  FileHeart,
  FileText,
  HeartPulse,
  History,
  Hospital,
  MapPin,
  ShieldAlert,
  Sparkles,
  Star,
  Stethoscope,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceWidgetCatalogItem {
  type: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  group: "clinical" | "workflow" | "details";
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
];

export function workspaceWidgetLabel(type: string, t: TFunction) {
  const item = CORE_WIDGET_CATALOG.find((widget) => widget.type === type);
  return item ? t(item.labelKey) : type;
}
