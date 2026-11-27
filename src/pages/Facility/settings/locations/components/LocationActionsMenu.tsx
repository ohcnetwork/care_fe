import {
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpLeft,
  MoreVertical,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LocationActionsMenuProps {
  locationName: string;
  /** Leave a handler out to leave its action out. Up is earlier in the list. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  /** A grid wraps from row to row, so its moves read earlier and later. */
  orientation?: "vertical" | "grid";
  className?: string;
}

/** The less common actions on a location, kept out of the way of the list. */
export function LocationActionsMenu({
  locationName,
  onMoveUp,
  onMoveDown,
  onDelete,
  orientation = "vertical",
  className,
}: LocationActionsMenuProps) {
  const { t } = useTranslation();
  if (!onMoveUp && !onMoveDown && !onDelete) return null;
  const isGrid = orientation === "grid";
  const BackIcon = isGrid ? ArrowUpLeft : ArrowUp;
  const ForwardIcon = isGrid ? ArrowDownRight : ArrowDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("shrink-0", className)}
          aria-label={`${t("more_options")}: ${locationName}`}
        >
          <MoreVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onMoveUp && (
          <DropdownMenuItem onClick={onMoveUp}>
            <BackIcon aria-hidden="true" />
            {t(isGrid ? "move_earlier" : "move_up")}
          </DropdownMenuItem>
        )}
        {onMoveDown && (
          <DropdownMenuItem onClick={onMoveDown}>
            <ForwardIcon aria-hidden="true" />
            {t(isGrid ? "move_later" : "move_down")}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash aria-hidden="true" />
            {t("delete")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
