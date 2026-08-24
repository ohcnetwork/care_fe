import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useBatchRequest } from "@/Utils/request/batch";

export function useLocationMutations(encounterId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const executeBatch = useBatchRequest({
    onSuccess: () => {
      toast.success(t("bed_assigned_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounterId],
      });
    },
  });

  return {
    executeBatch,
    isPending: executeBatch.isPending,
  };
}
