import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { cn } from "@/lib/utils";
import { EncounterTab } from "@/pages/Encounters/EncounterNavigation";

interface EncounterSectionPickerProps {
  visibleTabs: [string, EncounterTab][];
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function EncounterSectionPicker({
  visibleTabs,
  currentTab,
  onTabChange,
}: EncounterSectionPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selectedRowRef = useRef<HTMLButtonElement>(null);
  const currentEntry =
    visibleTabs.find(([key]) => key === currentTab) ?? visibleTabs[0];

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  if (!currentEntry) return null;

  const [, currentSection] = currentEntry;
  const CurrentIcon = currentSection.icon;

  return (
    <div className="lg:hidden">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger
          render={
            <Button
              variant="outline"
              className="h-auto min-h-[56px] w-full justify-start gap-3 px-3 py-2 text-left whitespace-normal"
              aria-label={t("encounter_section_current", {
                section: currentSection.label,
              })}
            >
              <CurrentIcon
                aria-hidden="true"
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs leading-4 font-normal text-muted-foreground">
                  {t("encounter_section")}
                </span>
                <span className="block text-sm leading-5 font-semibold break-words text-foreground">
                  {currentSection.label}
                </span>
              </span>
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
          }
        />
        <DrawerContent
          initialFocus={selectedRowRef}
          aria-describedby={undefined}
          className="max-h-[85dvh]"
        >
          <DrawerHeader showCloseButton className="border-b border-border">
            <DrawerTitle className="text-lg leading-6 font-semibold">
              {t("encounter_sections")}
            </DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <nav
              aria-label={t("encounter_sections")}
              className="flex min-w-0 flex-col gap-1"
            >
              {visibleTabs.map(([key, { label, icon: Icon }]) => {
                const selected = key === currentTab;
                return (
                  <DrawerClose
                    key={key}
                    render={
                      <Button
                        ref={selected ? selectedRowRef : undefined}
                        variant="ghost"
                        aria-current={selected ? "page" : undefined}
                        className={cn(
                          "h-auto min-h-[48px] w-full justify-start gap-3 px-3 py-3 text-left text-sm whitespace-normal",
                          selected && "bg-muted text-primary",
                        )}
                        onClick={() => onTabChange(key)}
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-5 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                        <span className="min-w-0 flex-1 break-words">
                          {label}
                        </span>
                        {selected && (
                          <Check aria-hidden="true" className="size-4" />
                        )}
                      </Button>
                    }
                  />
                );
              })}
            </nav>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
