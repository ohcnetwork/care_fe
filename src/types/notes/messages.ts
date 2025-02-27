import { UserBase } from "@/types/user/user";

export interface Message {
  id: string;
  message: string; // Markdown
  message_history: Record<string, unknown>;
  created_by: UserBase;
  updated_by: UserBase;
  created_date: string;
  modified_date: string;
}
