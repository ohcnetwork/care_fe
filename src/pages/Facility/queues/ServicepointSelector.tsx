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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
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
    }
  }, [open]);

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
          <div className="p-3 pb-6">
            <ServicePointList
              subQueues={subQueues}
              selectedSubQueueId={selectedSubQueueId}
              handleSelect={handleSelect}
              isPending={isPending}
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <ServicePointList
          subQueues={subQueues}
          selectedSubQueueId={selectedSubQueueId}
          handleSelect={handleSelect}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

const ServicePointList = ({
  subQueues,
  selectedSubQueueId,
  handleSelect,
}: {
  subQueues: TokenSubQueueRead[];
  selectedSubQueueId: string;
  handleSelect: (id: string) => void;
  isPending: boolean;
}) => {
  return (
    <RadioGroup
      value={selectedSubQueueId}
      onValueChange={handleSelect}
      className="gap-2"
    >
      {subQueues.map((subQueue) => {
        const isSelected = selectedSubQueueId === subQueue.id;
        return (
          <div
            key={subQueue.id}
            onClick={() => handleSelect(subQueue.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors w-full",
              "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-gray-200",
            )}
          >
            <RadioGroupItem
              value={subQueue.id}
              id={subQueue.id}
              tabIndex={-1}
              className="pointer-events-none"
            />
            <span
              className={cn(
                "flex-1 text-sm font-medium",
                isSelected ? "text-primary-900" : "text-gray-900",
              )}
            >
              {subQueue.name}
            </span>
          </div>
        );
      })}
    </RadioGroup>
  );
};
