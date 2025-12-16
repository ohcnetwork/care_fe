import { UserReadMinimal } from "@/types/user/user";

export interface ThreadBase {
  title: string;
}

export interface ThreadCreate extends ThreadBase {
  encounter?: string;
}

export interface ThreadRead extends ThreadBase {
  id: string;
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}

export const threadTemplates = [
  "Treatment Plan",
  "Medication Notes",
  "Care Coordination",
  "General Notes",
  "Patient History",
  "Referral Notes",
  "Lab Results Discussion",
] as const;
