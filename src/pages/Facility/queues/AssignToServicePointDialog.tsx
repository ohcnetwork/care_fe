import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
  TokenUpdate,
} from "@/types/tokens/token/token";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import { UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const AssignToServicePointDialog = ({
  open,
  onOpenChange,
  token,
  preferredServicePointCategories,
  subQueues,
  onUpdate,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  token: TokenRead;
  preferredServicePointCategories?:
    | {
        [k: string]: TokenCategoryRead | undefined;
      }
    | undefined;
  subQueues: TokenSubQueueRead[];
  onUpdate: (data: TokenUpdate) => void;
  isPending: boolean;
}) => {
  const { t } = useTranslation();

  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>(
    token.sub_queue?.id ?? "",
  );

  useEffect(() => {
    if (open) {
      setSelectedSubQueueId(token.sub_queue?.id ?? "");
    }
  }, [open, token.sub_queue?.id]);

  const handleConfirm = () => {
    if (selectedSubQueueId) {
      onUpdate({
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
          {subQueues.map((subQueue) => (
            <div
              key={subQueue.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer",
                subQueue.id === token.sub_queue?.id && "hidden",
              )}
              onClick={() => setSelectedSubQueueId(subQueue.id)}
            >
              <RadioGroupItem
                value={subQueue.id}
                id={subQueue.id}
                key={subQueue.id}
              />
              <Label
                htmlFor={subQueue.id}
                className="flex-1 text-sm font-medium cursor-pointer"
              >
                {subQueue.name}
              </Label>
              {preferredServicePointCategories && (
                <span className="text-sm text-gray-600">
                  {preferredServicePointCategories?.[subQueue.id]?.name ??
                    t("all")}
                </span>
              )}
            </div>
          ))}
          {subQueues.length === 0 && (
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
            {t("mark_as_in_service")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
