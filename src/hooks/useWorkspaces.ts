import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import useAuthUser from "@/hooks/useAuthUser";
import {
  getWorkspaceSurface,
  type WorkspaceSurface,
} from "@/types/workspace/encounterWorkspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import query from "@/Utils/request/query";

export function useWorkspaceList(surface: WorkspaceSurface) {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["workspaces", user.id, "active"],
    queryFn: async ({ signal }) => {
      const response = await query.paginated(workspaceApi.list, {
        queryParams: { status: "active" },
        silent: true,
      })({ signal });
      return response.results;
    },
    select: (workspaces) =>
      workspaces.filter(
        (workspace) => getWorkspaceSurface(workspace.template) === surface,
      ),
    retry: false,
    // The header and content share this read. Remounting an observer must
    // preserve a failed result until the user explicitly chooses Try Again.
    retryOnMount: false,
  });
}

/** History selection is explicitly browser-local; workspace content stays on the server. */
export function useHistoryWorkspace() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const list = useWorkspaceList("patient_history");
  const storageKey = `care:history-workspace:${user.id}`;
  const queryKey = ["history-workspace-selection", user.id];
  const preference = useQuery({
    queryKey,
    queryFn: () => localStorage.getItem(storageKey),
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        queryClient.invalidateQueries({
          queryKey: ["history-workspace-selection", user.id],
        });
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [queryClient, storageKey, user.id]);
  const save = useMutation({
    mutationFn: async (id: string | null) => {
      if (id === null) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, id);
      return id;
    },
    onSuccess: (id) => queryClient.setQueryData(queryKey, id),
  });
  return {
    list,
    preference,
    save,
    workspace: list.data?.find(({ id }) => id === preference.data),
  };
}
