import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LocationHistory } from "@/types/emr/encounter";
import { LocationAssociationStatus } from "@/types/location/association";

interface LocationActionButtonsProps {
  status: LocationAssociationStatus;
  location: LocationHistory;
  onMove: () => void;
  onComplete?: (location: LocationHistory) => void;
  onCancel?: () => void;
  onAssignNow?: () => void;
  onUpdateTime?: (location: LocationHistory) => void;
}

export function LocationActionButtons({
  status,
  location,
  onMove,
  onComplete,
  onCancel,
  onAssignNow,
  onUpdateTime,
}: LocationActionButtonsProps) {
  const { t } = useTranslation();

  type ActionButton = {
    label: string;
    onClick: () => void;
    variant: "outline" | "primary" | "link";
    className?: string;
    "data-cy"?: string;
  };

  const buttons: ActionButton[] = [];

  if (status === "planned" && onCancel) {
    buttons.push({
      label: t("cancel_plan"),
      onClick: onCancel,
      variant: "link",
      className: "underline underline-offset-2",
      "data-cy": "cancel-bed-plan-button",
    });
  }

  buttons.push({
    label: t("move_to_another_bed"),
    onClick: onMove,
    variant: "outline",
    className: "border-gray-400 shadow-sm",
    "data-cy": "move-to-another-bed-button",
  });

  if (status === "active" && onComplete) {
    buttons.push({
      label: t("complete_bed_stay"),
      onClick: () => onComplete(location),
      variant: "outline",
      className: "border-gray-400 shadow-sm",
      "data-cy": "complete-bed-stay-button",
    });
  }

  if (status === "planned" && onAssignNow) {
    buttons.push({
      label: t("assign_bed_now"),
      onClick: onAssignNow,
      variant: "primary",
      className: "shadow-sm",
    });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex flex-wrap gap-2 flex-1">
        {buttons.map((button, index) => (
          <Button
            key={index}
            variant={button.variant}
            onClick={button.onClick}
            className={cn("sm:w-auto w-full", button.className)}
            data-cy={button["data-cy"]}
          >
            {button.label}
          </Button>
        ))}
      </div>
      {onUpdateTime && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onUpdateTime(location)}>
              {t("update_time")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
