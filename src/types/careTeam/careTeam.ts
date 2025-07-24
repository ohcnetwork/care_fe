import { Code } from "@/types/base/code/code";
import { UserReadBase } from "@/types/user/user";

export interface CareTeamMember {
  user_id: string;
  role: Code;
}

export interface CareTeamResponse {
  role: Code;
  member: UserReadBase;
}

export interface CareTeamRequest {
  members: CareTeamMember[];
}
