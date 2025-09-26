import { CaretSortIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ValueSetSearchContent from "@/components/Questionnaire/ValueSetSearchContent";

import useBreakpoints from "@/hooks/useBreakpoints";

import { Code } from "@/types/base/code/code";
import { useTranslation } from "react-i18next";

interface Props {
  system: string;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  showCode?: boolean;
  title?: string;
  closeOnSelect?: boolean;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  disabled,
  count = 10,
  searchPostFix = "",
  hideTrigger = false,
  controlledOpen = false,
  closeOnSelect = true,
  showCode = false,
  title,
}: Props) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (controlledOpen || internalOpen) {
      setSearch("");
    }
  }, [controlledOpen, internalOpen]);

  useEffect(() => {
    if (internalOpen && isMobile) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [internalOpen, isMobile]);

  if (isMobile && !hideTrigger) {
    return (
      <Drawer open={internalOpen} onOpenChange={setInternalOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            onClick={() => setInternalOpen(true)}
            className={cn(
              "w-full justify-between",
              "h-auto md:h-9 whitespace-normal text-left md:truncate",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <span>{value?.display || placeholder}</span>
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg">
          <DrawerTitle className="sr-only">
            {title || t("select_value")}
          </DrawerTitle>
          <div className="pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            <ValueSetSearchContent
              system={system}
              onSelect={(selected) => {
                onSelect(selected);
                if (closeOnSelect) {
                  setInternalOpen(false);
                } else {
                  inputRef.current?.focus();
                }
              }}
              count={count}
              searchPostFix={searchPostFix}
              showCode={showCode}
              search={search}
              onSearchChange={setSearch}
              title={title}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (isMobile && !hideTrigger) {
    return (
      <Drawer open={internalOpen} onOpenChange={setInternalOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between border border-primary rounded-md px-2 h-auto whitespace-normal text-left",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <div className="flex items-center">
              <CareIcon
                icon="l-plus"
                className="mr-2 text-primary-700 font-normal"
              />
              <span className="text-primary-700 flex items-center font-semibold text-wrap text-sm md:text-base">
                {value?.display || placeholder}
                {value?.display && showCode && (
                  <span className="text-xs ml-1">({value?.code})</span>
                )}
              </span>
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg">
          <DrawerTitle className="sr-only">
            {title || t("select_value")}
          </DrawerTitle>
          <div className="pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            <ValueSetSearchContent
              system={system}
              onSelect={(selected) => {
                onSelect(selected);
                if (closeOnSelect) {
                  setInternalOpen(false);
                } else {
                  inputRef.current?.focus();
                }
              }}
              placeholder={placeholder}
              count={count}
              searchPostFix={searchPostFix}
              showCode={showCode}
              search={search}
              onSearchChange={setSearch}
              title={title}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      <Popover
        open={controlledOpen || internalOpen}
        onOpenChange={setInternalOpen}
        modal={true}
      >
        {!hideTrigger && (
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className={cn(
                "justify-between truncate",
                !value?.display && "text-gray-400",
              )}
            >
              <span className="truncate">
                {value?.display || placeholder}
                {value?.display && showCode && (
                  <span className="text-xs ml-1">({value?.code})</span>
                )}
              </span>
              <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        )}

        {hideTrigger ? (
          <ValueSetSearchContent
            system={system}
            onSelect={(selected) => {
              onSelect(selected);
              if (closeOnSelect) {
                setInternalOpen(false);
              } else {
                inputRef.current?.focus();
              }
            }}
            count={count}
            searchPostFix={searchPostFix}
            showCode={showCode}
            search={search}
            onSearchChange={setSearch}
            title={title}
          />
        ) : (
          <PopoverContent className="transition-all w-150 p-0" align="start">
            <ValueSetSearchContent
              system={system}
              onSelect={(selected) => {
                onSelect(selected);
                if (closeOnSelect) {
                  setInternalOpen(false);
                } else {
                  inputRef.current?.focus();
                }
              }}
              placeholder={placeholder}
              count={count}
              searchPostFix={searchPostFix}
              showCode={showCode}
              search={search}
              onSearchChange={setSearch}
              title={title}
            />
          </PopoverContent>
        )}
      </Popover>
    </>
  );
}
