import {
  Activity,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  PanelsTopLeft,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export const TAB_ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  stethoscope: Stethoscope,
  "clipboard-list": ClipboardList,
  "panels-top-left": PanelsTopLeft,
  activity: Activity,
  "heart-pulse": HeartPulse,
};
