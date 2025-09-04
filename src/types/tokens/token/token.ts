import { PatientRead } from "@/types/emr/patient/patient";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";

enum TokenStatus {
  CREATED = "created",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface Token {
  id: string;
}

export interface TokenGenerate extends Omit<Token, "id"> {
  patient?: string;
  category: string;
  note?: string;
  sub_queue?: string;
}

export interface TokenGenerateWithQueue extends TokenGenerate {
  resource_type: SchedulableResourceType;
  resource_id: string;
  date: string;
}

export interface TokenUpdate extends Token {
  note: string;
  status: TokenStatus;
  sub_queue?: string;
}

export interface TokenRead extends Token {
  category: TokenCategoryRead;
  sub_queue: TokenSubQueueRead;
  note: string;
  patient: PatientRead;
  number: number;
  status: TokenStatus;
}
