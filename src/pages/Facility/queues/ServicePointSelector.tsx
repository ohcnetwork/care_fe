import { SubQueuePickerDialog } from "@/pages/Facility/queues/SubQueuePickerDialog";
import { useUpdateToken } from "@/pages/Facility/queues/utils";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
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

  const { mutate: updateToken, isPending } = useUpdateToken(facilityId, token, {
    onSuccess: () => {
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

  return (
    <SubQueuePickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(title)}
      description={t(description)}
      subQueues={subQueues}
      value={selectedSubQueueId}
      onValueChange={handleSelect}
      disabled={isPending}
    />
  );
};
