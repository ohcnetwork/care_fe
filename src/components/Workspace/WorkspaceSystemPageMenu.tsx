import { Check, LockKeyhole, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { systemPageLabel, type WorkspacePage } from "./workspaceEditorUtils";

interface WorkspaceSystemPageMenuProps {
  pages: WorkspacePage[];
  systemKeys: string[];
  disabled: boolean;
  className?: string;
  onAdd: (page: WorkspacePage) => void;
}

export function WorkspaceSystemPageMenu({
  pages,
  systemKeys,
  disabled,
  className,
  onAdd,
}: WorkspaceSystemPageMenuProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("shadow-none", className)}
          disabled={disabled}
        >
          <Plus className="size-3.5" />
          {t("workspace_builder_add_system_page")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-64 overflow-y-auto"
      >
        {systemKeys.map((key) => {
          const added = pages.some((page) => page.key === key);
          return (
            <DropdownMenuItem
              key={key}
              disabled={added}
              onSelect={() => onAdd({ kind: "system", key })}
            >
              <LockKeyhole className="size-4 text-gray-400" />
              <span className="flex-1">{systemPageLabel(key, t)}</span>
              {added && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
