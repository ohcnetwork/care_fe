import { useQuery } from "@tanstack/react-query";

import useAuthUser from "@/hooks/useAuthUser";
import { useWorkspaceList } from "@/hooks/useWorkspaces";

import { EncounterClass } from "@/types/emr/encounter/encounter";
import workspaceApi from "@/types/workspace/workspaceApi";
import query from "@/Utils/request/query";

import { findPreferredWorkspaceId } from "./workspacePreferences";

/**
 * The user's one workspace choice, shared by encounters and clinical history.
 * The backend owns access and only active workspaces are offered, so choices
 * for draft, archived or revoked workspaces fall back to the standard screens.
 * Pass the encounter class to also honour legacy per-class choices.
 */
export function useEncounterWorkspaces(encounterClass?: EncounterClass) {
  const user = useAuthUser();
  const defaults = useQuery({
    queryKey: ["workspace-user-defaults", user.id],
    queryFn: query(workspaceApi.getUserDefaultAttributes, { silent: true }),
    retry: false,
    // The header and content share these reads. Remounting an observer must
    // preserve a failed result until the user explicitly chooses Try Again.
    retryOnMount: false,
  });
  const list = useWorkspaceList();
  const accessibleWorkspaces = new Map(
    (list.data ?? []).map((workspace) => [workspace.id, workspace]),
  );
  const workspaceId =
    defaults.isError || list.isError
      ? undefined
      : findPreferredWorkspaceId(
          defaults.data?.results ?? [],
          new Set(accessibleWorkspaces.keys()),
          encounterClass,
        );

  return {
    defaults,
    list,
    workspace: workspaceId ? accessibleWorkspaces.get(workspaceId) : undefined,
  };
}
