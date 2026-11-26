import {
  ArrowBigUp,
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  ListPlus,
} from "lucide-react";
import { RefObject, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import useBreakpoints from "@/hooks/useBreakpoints";

import { TemplateConfig } from "@/types/questionnaire/question";

interface TemplatePickerProps {
  templates: TemplateConfig[];
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Enter inserts and closes; Shift+Enter inserts and keeps the list open. */
  onInsert: (content: string, keepOpen: boolean) => void;
  /** Receives focus after an insert closes the list. */
  returnFocusTo: RefObject<HTMLElement | null>;
}

export function TemplatePicker({
  templates,
  disabled,
  open,
  onOpenChange,
  onInsert,
  returnFocusTo,
}: TemplatePickerProps) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const insertedRef = useRef(false);

  const insert = (content: string, keepOpen: boolean) => {
    insertedRef.current = !keepOpen;
    onInsert(content, keepOpen);
  };

  const handleCloseAutoFocus = (event: Event) => {
    if (!insertedRef.current) return;
    insertedRef.current = false;
    event.preventDefault();
    returnFocusTo.current?.focus();
  };

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      className="w-full justify-start rounded-t-none! rounded-b-[calc(var(--radius-md)-1px)]! text-sm font-medium text-foreground shadow-none! inset-shadow-none! not-in-data-[slot=button-group]:rounded-t-none! not-in-data-[slot=button-group]:rounded-b-[calc(var(--radius-md)-1px)]! focus-visible:-outline-offset-2"
    >
      <ListPlus className="size-4" strokeWidth={1.5} />
      <span className="underline">{t("insert_template")}</span>
    </Button>
  );

  const content = (
    <Command
      onKeyDown={(event) => {
        if (event.key !== "Enter" || !event.shiftKey) return;
        // cmdk keeps focus in the search input, so read the highlighted item.
        const highlighted = event.currentTarget
          .querySelector("[cmdk-item][aria-selected=true]")
          ?.getAttribute("data-value");
        const template = templates[Number.parseInt(highlighted ?? "", 10)];
        if (!template) return;
        // cmdk would otherwise run the plain select (insert and close).
        event.preventDefault();
        insert(template.content, true);
      }}
    >
      <CommandInput
        placeholder={t("search_template")}
        aria-label={t("search_template")}
        wrapperClassName="border-b border-soft-border p-2 shadow-xs md:pt-2"
        className="text-base sm:text-sm"
      />
      <CommandList className="scrollbar-gutter-auto overscroll-contain md:max-h-[30dvh]">
        <CommandEmpty>{t("no_templates_found")}</CommandEmpty>
        <CommandGroup>
          {templates.map((template, index) => (
            <CommandItem
              key={index}
              value={`${index}-${template.name}`}
              keywords={[template.name]}
              onSelect={() => insert(template.content, false)}
            >
              {template.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent
          height="fixed"
          aria-describedby={undefined}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <DrawerTitle className="sr-only">{t("insert_template")}</DrawerTitle>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 gap-0 overflow-hidden p-0"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        {content}
        <div className="flex items-center justify-between gap-2 border-t border-soft-border px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <KbdGroup>
              <Kbd>
                <ArrowUp aria-hidden="true" />
              </Kbd>
              <Kbd>
                <ArrowDown aria-hidden="true" />
              </Kbd>
            </KbdGroup>
            <span>{t("navigate")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <KbdGroup>
              <Kbd>
                <ArrowBigUp aria-hidden="true" />
              </Kbd>
              <Kbd>
                <CornerDownLeft aria-hidden="true" />
              </Kbd>
            </KbdGroup>
            <span>{t("keep_open")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeft aria-hidden="true" />
            </Kbd>
            <span>{t("insert")}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
