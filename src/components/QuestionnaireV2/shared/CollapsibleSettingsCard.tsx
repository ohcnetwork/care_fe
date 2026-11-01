import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CollapsibleSettingsCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  /** Controlled open state — the studio's Actions panel keeps one card
   *  open at a time. Leave both unset for the uncontrolled default. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function CollapsibleSettingsCard({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: CollapsibleSettingsCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label={title}
            className="h-auto min-w-0 flex-1 justify-between whitespace-normal rounded-none p-4 text-left font-normal"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
              {subtitle && (
                <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            <ChevronsUpDown className="size-4 shrink-0" />
          </Button>
        </CollapsibleTrigger>
        {badge && <div className="shrink-0 pr-4">{badge}</div>}
      </div>
      <CollapsibleContent className="border-t border-gray-100 p-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
