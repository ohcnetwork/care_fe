import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePreferredServicePointCategory } from "./usePreferredServicePointCategory";
import { useQueueServicePoints } from "./useQueueServicePoints";

export function AssignToServicePointDialog({
  open,
  onOpenChange,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
}) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>("");
  const { assignedServicePoints } = useQueueServicePoints();
  const { preferredServicePointCategories } = usePreferredServicePointCategory({
    facilityId,
  });

  const { mutate: updateToken, isPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: token.queue.id,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, token.queue.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token.queue.id],
      });
      toast.success(t("token_assigned_to_service_point"));
      onOpenChange(false);
    },
  });

  const handleConfirm = () => {
    if (selectedSubQueueId) {
      updateToken({
        sub_queue: selectedSubQueueId,
        status: TokenStatus.CREATED,
        note: token.note,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("select_service_point")}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {t("choose_service_point_to_call_patient", {
              patientName: token.patient?.name,
              tokenNumber: renderTokenNumber(token),
            })}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedSubQueueId}
          onValueChange={setSelectedSubQueueId}
        >
          {assignedServicePoints.map((subQueue) => (
            <div
              key={subQueue.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors",
                subQueue.id === token.sub_queue?.id && "hidden",
              )}
            >
              <RadioGroupItem value={subQueue.id} id={subQueue.id} />
              <label
                htmlFor={subQueue.id}
                className="flex-1 text-sm font-medium cursor-pointer"
              >
                {subQueue.name}
              </label>
              <span className="text-sm">
                {preferredServicePointCategories?.[subQueue.id]?.name ??
                  t("all")}
              </span>
            </div>
          ))}
          {assignedServicePoints.length === 0 && (
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="none" id="none" disabled />
              <label
                htmlFor="none"
                className="flex-1 text-sm font-medium cursor-pointer"
              >
                {t("no_service_points_available")}
              </label>
            </div>
          )}
        </RadioGroup>
        <div className="flex">
          <Button
            onClick={handleConfirm}
            className="w-full"
            disabled={!selectedSubQueueId || isPending}
          >
            <UserCheck className="size-4 mr-2" />
            {t("call_patient")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
