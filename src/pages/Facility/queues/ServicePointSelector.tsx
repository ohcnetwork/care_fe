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
import { useUpdateToken } from "@/hooks/useUpdateToken";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type ServicePointSelectorAction =
  | "serve"
  | "move_to_up_next"
  | "change_service_point";

const ACTION_TO_STATUS: Record<ServicePointSelectorAction, TokenStatus> = {
  serve: TokenStatus.IN_PROGRESS,
  move_to_up_next: TokenStatus.CREATED,
  change_service_point: TokenStatus.IN_PROGRESS,
};

const ACTION_TO_CONTENT: Record<
  ServicePointSelectorAction,
  { titleKey: string; descriptionKey: string }
> = {
  serve: {
    titleKey: "serve_token",
    descriptionKey: "serve_confirmation",
  },
  move_to_up_next: {
    titleKey: "move_to_up_next",
    descriptionKey: "move_to_up_next_description",
  },
  change_service_point: {
    titleKey: "change_service_point",
    descriptionKey: "change_service_point_description",
  },
};

export const ServicePointSelector = ({
  open,
  onOpenChange,
  token,
  subQueues,
  facilityId,
  action,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
  subQueues: TokenSubQueueRead[];
  facilityId: string;
  action: ServicePointSelectorAction;
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { updateToken, isUpdating } = useUpdateToken({
    facilityId,
    token,
    onSuccess,
  });

  const { titleKey, descriptionKey } = ACTION_TO_CONTENT[action];
  const title = t(titleKey);
  const description = t(descriptionKey);
  const targetStatus = ACTION_TO_STATUS[action];

  const [selectedSubQueueId, setSelectedSubQueueId] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedSubQueueId("");
      return;
    }
    setSelectedSubQueueId(
      token.status === targetStatus ? (token.sub_queue?.id ?? "") : "",
    );
  }, [open, token.sub_queue?.id, token.status, targetStatus]);

  const handleSelect = (subQueueId: string) => {
    if (
      isUpdating ||
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
            <RadioInput
              options={subQueues.map((subQueue) => ({
                label: subQueue.name,
                value: subQueue.id,
              }))}
              onValueChange={handleSelect}
              value={selectedSubQueueId}
              required
              className="flex flex-col gap-3"
              labelClassName="p-2"
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
        <RadioInput
          options={subQueues.map((subQueue) => ({
            label: subQueue.name,
            value: subQueue.id,
          }))}
          onValueChange={handleSelect}
          value={selectedSubQueueId}
          required
          className="flex flex-col gap-3"
          labelClassName="p-2"
        />
      </DialogContent>
    </Dialog>
  );
};
