import { HttpMethod, Type } from "@/Utils/request/api";
import { CareTeamRequest } from "@/types/careTeam/careTeam";
import { EncounterRead } from "@/types/emr/encounter/encounter";

export default {
  setCareTeam: {
    method: HttpMethod.POST,
    path: "/api/v1/encounter/{encounterId}/set_care_team_members/",
    TRes: Type<EncounterRead>(),
    TBody: Type<CareTeamRequest>(),
  },
};
