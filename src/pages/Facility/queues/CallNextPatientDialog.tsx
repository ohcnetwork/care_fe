import { SubQueuePickerDialog } from "@/pages/Facility/queues/SubQueuePickerDialog";
import { usePreferredServicePointCategory } from "@/pages/Facility/queues/usePreferredServicePointCategory";
import { TokenRead } from "@/types/tokens/token/token";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Lets staff pick which service point should serve the next waiting patient
export const CallNextPatientDialog = ({
  open,
  onOpenChange,
  subQueues,
  facilityId,
  queueId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subQueues: TokenSubQueueRead[];
  facilityId: string;
  queueId: string;
  onSuccess?: (token: TokenRead) => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { preferredServicePointCategories } = usePreferredServicePointCategory({
    facilityId,
  });

  const [selectedSubQueueId, setSelectedSubQueueId] = useState("");

  const { mutate: callNextPatient, isPending } = useMutation({
    mutationFn: mutate(tokenQueueApi.setNextTokenToSubQueue, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
    onSuccess: (data: TokenRead) => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, queueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
      toast.success(t("token_now_serving"));
      setSelectedSubQueueId("");
      onOpenChange(false);
      onSuccess?.(data);
    },
    onError: () => setSelectedSubQueueId(""),
  });

  const handleSelect = (subQueueId: string) => {
    if (isPending) {
      return;
    }
    setSelectedSubQueueId(subQueueId);
    callNextPatient({
      sub_queue: subQueueId,
      category: preferredServicePointCategories?.[subQueueId]?.id,
    });
  };

  return (
    <SubQueuePickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("call_next_patient")}
      description={t("call_next_patient_description")}
      subQueues={subQueues}
      value={selectedSubQueueId}
      onValueChange={handleSelect}
      disabled={isPending}
    />
  );
};
