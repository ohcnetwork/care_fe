import { NoteMessageRevision, NoteRead } from "@/types/notes/messages";
import { UserSpec } from "@/types/user/user";

export type ReferralMessageRevision = NoteMessageRevision;
export type ReferralConversationMessage = NoteRead;

export interface ReferralConversationThread {
  id: string;
  title: string;
  thread_type: "referral";
  created_by: UserSpec | null;
  updated_by: UserSpec | null;
  created_date: string;
  modified_date: string;
}
