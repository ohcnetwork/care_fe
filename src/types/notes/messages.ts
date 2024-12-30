import { UserBase } from "@/types/user/user";

export interface Message {
  id: string;
  message: string;
  message_history: Record<string, unknown>;
  created_by: UserBase;
  updated_by: UserBase;
}

export interface MessagesResponse {
  count: number;
  results: Message[];
}
