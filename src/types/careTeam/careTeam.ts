import { Code } from "@/types/base/code/code";
import { UserReadMinimal } from "@/types/user/user";

export interface CareTeamMember {
  user_id: string;
  role: Code;
}

export interface CareTeamResponse {
  role: Code;
  member: UserReadMinimal;
}

export interface CareTeamRequest {
  members: CareTeamMember[];
}
