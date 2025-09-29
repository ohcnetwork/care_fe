import keyboardShortcuts from "@/config/keyboardShortcuts.json";

type ExtractActionIds<T> = T extends { action: string }[]
  ? T[number]["action"]
  : never;

type FacilityShortcuts = (typeof keyboardShortcuts)["facility"];

export type FacilityActionId = ExtractActionIds<FacilityShortcuts>;

export interface FacilityAction {
  id: FacilityActionId;
  handler: () => void;
  requiresFacility?: boolean;
  permission?: string;
}
