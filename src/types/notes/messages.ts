import { UserSpec } from "@/types/user/user";

export interface NoteMessageRevision {
  message: string;
  created_by: { username: string; external_id: string };
  edited_at: string;
  created_at: string;
}

export interface NoteRead {
  id: string;
  message: string; // Markdown
  message_history: { history?: NoteMessageRevision[] };
  created_by: UserSpec | null;
  updated_by: UserSpec | null;
  created_date: string;
  modified_date: string;
}

export interface NoteCreate {
  message: string;
}
