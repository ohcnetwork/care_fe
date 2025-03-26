import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  };

  const buttons: ActionButton[] = [];

  if (status === "planned" && onCancel) {
    buttons.push({
      label: t("cancel_plan"),
      onClick: onCancel,
      variant: "link",
      className: "underline underline-offset-2",
    });
  }

  buttons.push({
    label: t("move_to_another_bed"),
    onClick: onMove,
    variant: "outline",
    className: "border-gray-400 shadow",
  });

  if (status === "active" && onComplete) {
    buttons.push({
      label: t("complete_bed_stay"),
      onClick: () => onComplete(location),
      variant: "outline",
      className: "border-gray-400 shadow",
    });
  }

  if (status === "planned" && onAssignNow) {
    buttons.push({
      label: t("assign_bed_now"),
      onClick: onAssignNow,
      variant: "primary",
      className: "shadow",
    });
  }

  return (
    <div className="flex gap-2">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant}
          onClick={button.onClick}
          className={button.className}
        >
          {button.label}
        </Button>
      ))}
      {onUpdateTime && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
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
