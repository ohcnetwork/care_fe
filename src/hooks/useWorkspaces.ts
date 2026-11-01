import { useQuery } from "@tanstack/react-query";

import useAuthUser from "@/hooks/useAuthUser";
import { normalizeWorkspaceTemplate } from "@/types/workspace/encounterWorkspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import query from "@/Utils/request/query";

export function useWorkspaceList() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["workspaces", user.id, "active"],
    queryFn: async ({ signal }) => {
      const response = await query.paginated(workspaceApi.list, {
        queryParams: { status: "active" },
        silent: true,
      })({ signal });
      return response.results.map((workspace) => ({
        ...workspace,
        template: normalizeWorkspaceTemplate(workspace.template),
      }));
    },
    retry: false,
    // The header and content share this read. Remounting an observer must
    // preserve a failed result until the user explicitly chooses Try Again.
    retryOnMount: false,
  });
}
