import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import RadioInput from "@/components/ui/RadioInput";
import useBreakpoints from "@/hooks/useBreakpoints";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ServicePointSelectorAction =
  "serve" | "move_to_up_next" | "change_service_point";

// `change_service_point` intentionally keeps the token's current status (see
// `targetStatus` below), so it is not part of this map.
const ACTION_TO_STATUS: Record<
  Exclude<ServicePointSelectorAction, "change_service_point">,
  TokenStatus
> = {
  serve: TokenStatus.IN_PROGRESS,
  move_to_up_next: TokenStatus.CREATED,
};

const ACTION_TO_CONTENT: Record<
  ServicePointSelectorAction,
  { title: string; description: string; successMessage: string }
> = {
  serve: {
    title: "serve_token",
    description: "serve_confirmation",
    successMessage: "token_now_serving",
  },
  move_to_up_next: {
    title: "move_to_up_next",
    description: "move_to_up_next_description",
    successMessage: "token_moved_to_up_next",
  },
  change_service_point: {
    title: "change_service_point",
    description: "change_service_point_description",
    successMessage: "service_point_changed",
  },
};

export const ServicePointSelector = ({
  open,
  onOpenChange,
  token,
  subQueues,
  facilityId,
  action,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
  subQueues: TokenSubQueueRead[];
  facilityId: string;
  action: ServicePointSelectorAction;
}) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const queryClient = useQueryClient();

  const { title, description, successMessage } = ACTION_TO_CONTENT[action];

  const targetStatus =
    action === "change_service_point" ? token.status : ACTION_TO_STATUS[action];

  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setSelectedSubQueueId("");
      return;
    }
    setSelectedSubQueueId(
      token.status === targetStatus ? (token.sub_queue?.id ?? "") : "",
    );
  }, [open, token.sub_queue?.id, token.status, targetStatus]);

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
      toast.success(t(successMessage));
      onOpenChange(false);
    },
    onError: () => {
      setSelectedSubQueueId(
        token.status === targetStatus ? (token.sub_queue?.id ?? "") : "",
      );
    },
  });

  const handleSelect = (subQueueId: string) => {
    if (
      isPending ||
      (subQueueId === token.sub_queue?.id && token.status === targetStatus)
    ) {
      return;
    }
    setSelectedSubQueueId(subQueueId);
    updateToken({
      sub_queue: subQueueId,
      status: targetStatus,
      note: token.note,
    });
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-base text-left">
              {t(title)}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-gray-600 text-left">
              {t(description)}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[50vh] p-3 pb-6">
            <RadioInput
              options={subQueues.map((subQueue) => ({
                label: subQueue.name,
                value: subQueue.id,
              }))}
              required
              onValueChange={handleSelect}
              value={selectedSubQueueId}
              className="flex flex-col gap-3"
              classNameInput="p-2"
              disabled={isPending}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(title)}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {t(description)}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[50vh] p-3">
          <RadioInput
            options={subQueues.map((subQueue) => ({
              label: subQueue.name,
              value: subQueue.id,
            }))}
            required
            onValueChange={handleSelect}
            value={selectedSubQueueId}
            className="flex flex-col gap-3"
            classNameInput="p-2"
            disabled={isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
