import { UserReadMinimal } from "@/types/user/user";

export interface NoteRead {
  id: string;
  message: string; // Markdown
  message_history: Record<string, unknown>;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  created_date: string;
  modified_date: string;
}

export interface NoteCreate {
  message: string;
}
