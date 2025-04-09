import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export interface CareTeamMember {
  user_id: string;
  role: Code;
}

export interface CareTeamResponse {
  role: Code;
  member: UserBase;
}

export interface CareTeamRequest {
  members: CareTeamMember[];
}
