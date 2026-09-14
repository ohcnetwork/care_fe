import { Building, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useBreakpoints from "@/hooks/useBreakpoints";

interface OrgSelectorProps {
  title?: string;
  selected: string[];
  onToggle: (orgId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  organizations?: {
    results: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  };
  className?: string;
  triggerClassName?: string;
}

export function OrgSelector({
  title,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  isLoading,
  organizations,
  className,
  triggerClassName,
}: OrgSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const triggerButton = (
    <Button
      // OrgSelector renders inside host <form>s (e.g. the questionnaire
      // detail page) — an untyped button there would submit the form.
      type="button"
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        triggerClassName,
      )}
    >
      <Building className="mr-2 size-4" />
      <span>{title || t("search_organizations")}</span>
    </Button>
  );

  const content = (
    <Command className="rounded-lg" filter={() => 1}>
      <CommandInput
        placeholder={t("search_organizations")}
        value={searchQuery}
        onValueChange={onSearchChange}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
      />
      <CommandList>
        <CommandEmpty>{t("no_organizations_found")}</CommandEmpty>
        <CommandGroup>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            organizations?.results.map((org) => (
              <CommandItem
                key={org.id}
                value={org.id}
                onSelect={() => onToggle(org.id)}
              >
                <div className="flex flex-1 items-center gap-2">
                  <Building className="size-4" />
                  <span>{org.name}</span>
                  {org.description && (
                    <span className="text-xs text-gray-500">
                      - {org.description}
                    </span>
                  )}
                </div>
                {selected.includes(org.id) && <Check className="size-4" />}
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onSearchChange("");
          }
          setOpen(isOpen);
        }}
      >
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[50vh] max-h-[85vh]">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] px-2 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover
      modal={true}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onSearchChange("");
        }
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-[var(--radix-popover-trigger-width)]", className)}
        align="start"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
