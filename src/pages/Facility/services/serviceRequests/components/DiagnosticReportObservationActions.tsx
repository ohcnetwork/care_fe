import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DiagnosticReportObservationActionsProps {
  index: number;
  hasComponents: boolean;
  canDelete: boolean;
  onAdd: () => void;
  onDelete: () => void;
}

export function DiagnosticReportObservationActions({
  index,
  hasComponents,
  canDelete,
  onAdd,
  onDelete,
}: DiagnosticReportObservationActionsProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-10 shrink-0 text-gray-500",
            hasComponents && "-mt-2",
          )}
          aria-label={`${t("result_actions")} ${index + 1}`}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ")
              event.stopPropagation();
          }}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            event.stopPropagation();
        }}
      >
        <DropdownMenuItem onSelect={onAdd}>
          <Plus className="size-4" />
          {t("add_another_result")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={onDelete}
          disabled={!canDelete}
        >
          <Trash2 className="size-4" />
          {t("remove_observation")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
