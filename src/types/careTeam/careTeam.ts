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

export const toCareTeamMembers = (
  members: CareTeamResponse[],
): CareTeamMember[] =>
  members.map(({ member, role }) => ({ user_id: member.id, role }));

/** A care team row while it is being edited: either half may still be empty. */
export interface CareTeamDraftMember {
  member?: UserReadMinimal;
  role?: Code;
}

export const isCareTeamComplete = (
  rows: CareTeamDraftMember[],
): rows is CareTeamResponse[] => rows.every((row) => row.member && row.role);
