import { useQuery } from "@tanstack/react-query";

import useAuthUser from "@/hooks/useAuthUser";

import { EncounterClass } from "@/types/emr/encounter/encounter";
import workspaceApi from "@/types/workspace/workspaceApi";
import query from "@/Utils/request/query";

import { parseEncounterClasses } from "./workspacePreferences";

/**
 * The backend owns access; saved choices apply across facilities by class.
 * Only active workspaces are offered, so saved choices for draft or archived
 * workspaces fall back to the standard encounter.
 */
export function useEncounterWorkspaces(encounterClass?: EncounterClass) {
  const user = useAuthUser();
  const defaults = useQuery({
    queryKey: ["workspace-user-defaults", user.id, "encounter"],
    queryFn: query(workspaceApi.getUserDefaultAttributes, { silent: true }),
    retry: false,
    // The header and content share these reads. Remounting an observer must
    // preserve a failed result until the user explicitly chooses Try Again.
    retryOnMount: false,
  });
  const list = useQuery({
    queryKey: ["workspaces", user.id, "encounter", "active"],
    queryFn: async ({ signal }) => {
      const response = await query.paginated(workspaceApi.list, {
        queryParams: { status: "active" },
        silent: true,
      })({ signal });
      return response.results;
    },
    retry: false,
    retryOnMount: false,
  });
  const accessibleWorkspaces = new Map(
    (list.data ?? []).map((workspace) => [workspace.id, workspace]),
  );
  // Keep the defaults API's order and skip deleted or revoked workspaces.
  const firstMatch = defaults.data?.results.find(
    ({ attribute, value, workspace }) =>
      attribute === "encounter_class" &&
      encounterClass !== undefined &&
      parseEncounterClasses(value).has(encounterClass) &&
      accessibleWorkspaces.has(workspace.id),
  );

  return {
    defaults,
    list,
    workspace:
      !defaults.isError && !list.isError && firstMatch
        ? accessibleWorkspaces.get(firstMatch.workspace.id)
        : undefined,
  };
}
