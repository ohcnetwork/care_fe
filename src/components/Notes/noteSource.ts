import { QueryKey } from "@tanstack/react-query";

import { NoteRead } from "@/types/notes/messages";
import { PaginatedResponse } from "@/Utils/request/types";

/** The conversation UI never chooses a patient or referral API itself. */
export interface NoteThreadSource {
  key: string;
  queryKey: QueryKey;
  title: string;
  canRename: boolean;
  listMessages: (options: {
    offset: number;
    limit: number;
    signal: AbortSignal;
  }) => Promise<PaginatedResponse<NoteRead>>;
  /** Establish a lazy thread before the message POST, without sending a message. */
  prepareSend?: () => Promise<void>;
  sendMessage: (message: string) => Promise<NoteRead>;
  getMessage: (messageId: string) => Promise<NoteRead>;
  updateMessage: (messageId: string, message: string) => Promise<NoteRead>;
  renameThread: (title: string) => Promise<unknown>;
  onRefresh: () => void;
}
