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

import {
  LocationAssociationRead,
  LocationAssociationStatus,
} from "@/types/location/association";

interface LocationActionButtonsProps {
  status: LocationAssociationStatus;
  location: LocationAssociationRead;
  onMove: () => void;
  onComplete?: (location: LocationAssociationRead) => void;
  onCancel: () => void;
  onAssignNow?: () => void;
  onUpdateTime?: (location: LocationAssociationRead) => void;
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
    variant: "outline" | "primary" | "link" | "destructive";
    className?: string;
  };

  const buttons: ActionButton[] = [];

  if (status !== "reserved") {
    buttons.push({
      label: t("move_to_another_bed"),
      onClick: onMove,
      variant: "outline",
      className: "border-gray-400 shadow-sm",
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
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant}
          onClick={button.onClick}
          className={cn("sm:w-auto w-full", button.className)}
        >
          {button.label}
        </Button>
      ))}
      {onUpdateTime && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === "reserved" && onComplete && (
              <DropdownMenuItem onClick={() => onComplete(location)}>
                {t("complete_bed_stay")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onCancel()}>
              {status === "planned" ? t("cancel_plan") : t("mark_as_error")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTime(location)}>
              {t("update_time")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
