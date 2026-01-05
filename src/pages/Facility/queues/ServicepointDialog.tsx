import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenSubQueueStatus } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const ServicepointDialog = ({
  open,
  onOpenChange,
  facilityId,
  resourceType,
  resourceId,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  token: TokenRead;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>(
    token.sub_queue?.id ?? "",
  );

  useEffect(() => {
    if (open) {
      setSelectedSubQueueId(token.sub_queue?.id ?? "");
    }
  }, [open, token.sub_queue?.id]);

  const { data: subQueues } = useQuery({
    queryKey: ["servicePoints", facilityId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
        status: TokenSubQueueStatus.ACTIVE,
      },
    }),
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
        queryKey: ["tokens", token?.patient?.id, facilityId],
      });
      toast.success(t("token_assigned_to_service_point"));
      onOpenChange(false);
    },
  });

  const handleConfirm = () => {
    if (selectedSubQueueId) {
      updateToken({
        sub_queue: selectedSubQueueId,
        status: TokenStatus.IN_PROGRESS,
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
            {t("choose_service_point_to_call_patient")}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedSubQueueId}
          onValueChange={setSelectedSubQueueId}
        >
          {subQueues?.results.map((subQueue) => (
            <div
              key={subQueue.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors",
              )}
            >
              <RadioGroupItem
                value={subQueue.id}
                id={subQueue.id}
                key={subQueue.id}
              />
              <label
                htmlFor={subQueue.id}
                className="flex-1 text-sm font-medium cursor-pointer"
              >
                {subQueue.name}
              </label>
            </div>
          ))}
          {subQueues?.results.length === 0 && (
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
};
