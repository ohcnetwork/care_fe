import { NoteMessageRevision, NoteRead } from "@/types/notes/messages";
import { UserReadMinimal } from "@/types/user/user";

export type ReferralMessageRevision = NoteMessageRevision;
export type ReferralConversationMessage = NoteRead;

export interface ReferralConversationThread {
  id: string;
  title: string;
  thread_type: "referral";
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
  created_date: string;
  modified_date: string;
}
