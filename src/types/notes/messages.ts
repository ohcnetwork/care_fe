import { UserReadBase } from "@/types/user/user";

export interface Message {
  id: string;
  message: string; // Markdown
  message_history: Record<string, unknown>;
  created_by: UserReadBase;
  updated_by: UserReadBase;
  created_date: string;
  modified_date: string;
}
