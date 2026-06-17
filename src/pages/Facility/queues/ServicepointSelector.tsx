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

export type ServicepointSelectorAction =
  | "serve"
  | "move_to_up_next"
  | "change_service_point";

const ACTION_TO_STATUS: Record<ServicepointSelectorAction, TokenStatus> = {
  serve: TokenStatus.IN_PROGRESS,
  move_to_up_next: TokenStatus.CREATED,
  change_service_point: TokenStatus.IN_PROGRESS,
};

export const ServicepointSelector = ({
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
  action: ServicepointSelectorAction;
}) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const queryClient = useQueryClient();

  const title = t(
    action === "serve"
      ? "serve_token"
      : action === "move_to_up_next"
        ? "move_to_up_next"
        : "change_service_point",
  );
  const description = t(`${action}_confirmation`);
  const targetStatus = ACTION_TO_STATUS[action];

  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setSelectedSubQueueId("");
      return;
    }
    setSelectedSubQueueId(
      token.status === targetStatus ? (token.sub_queue?.id ?? "") : "",
    );
  }, [open, token.sub_queue?.id]);

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
        queryKey: ["tokens", token?.patient?.id, facilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, token.queue.id],
      });
      onOpenChange(false);
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
            <DrawerTitle className="text-base text-left">{title}</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-600 text-left">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          {subQueues.length === 0 ? (
            <div className="text-sm text-gray-500 italic pb-3 pl-4">
              {t("no_service_points")}
            </div>
          ) : (
            <div className="p-3 pb-6">
              <RadioInput
                options={subQueues.map((sub) => ({
                  label: sub.name,
                  value: sub.id,
                }))}
                onValueChange={handleSelect}
                value={selectedSubQueueId}
                required
                className="flex flex-col gap-3"
                classNameInput="p-2"
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        {subQueues.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            {t("no_service_points")}
          </div>
        ) : (
          <RadioInput
            options={subQueues.map((sub) => ({
              label: sub.name,
              value: sub.id,
            }))}
            required
            onValueChange={handleSelect}
            value={selectedSubQueueId}
            className="flex flex-col gap-3"
            classNameInput="p-2"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
