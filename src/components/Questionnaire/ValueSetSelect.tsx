import { CaretSortIcon } from "@radix-ui/react-icons";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

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

type ButtonProps = Omit<React.ComponentProps<typeof Button>, keyof Props>;

interface Props {
  system: string;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  count?: number;
  searchPostFix?: string;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  showCode?: boolean;
  title?: string;
  closeOnSelect?: boolean;
  mobileTrigger?: React.ReactNode;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  count = 10,
  searchPostFix = "",
  hideTrigger = false,
  controlledOpen = false,
  closeOnSelect = true,
  showCode = false,
  title,
  mobileTrigger,
  ...props
}: Props & ButtonProps) {
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
      <Drawer
        open={internalOpen || controlledOpen}
        onOpenChange={setInternalOpen}
      >
        <DrawerTrigger asChild>
          {mobileTrigger ? (
            mobileTrigger
          ) : (
            <Button
              variant="white"
              role="combobox"
              className={cn(
                "w-full flex justify-between h-auto whitespace-normal text-left font-normal border-gray-300 shadow-xs",
                !value?.display && "text-gray-500 hover:bg-white",
              )}
              {...props}
            >
              <span>
                {value?.display || placeholder}
                {value?.display && showCode && (
                  <span className="text-xs ml-1">({value?.code})</span>
                )}
              </span>
              <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="sr-only">
            {title || t("select_value")}
          </DrawerTitle>
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
        </DrawerContent>
      </Drawer>
    );
  }

  if (hideTrigger) {
    return (
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
        placeholder={placeholder}
      />
    );
  }

  return (
    <>
      <Popover
        open={controlledOpen || internalOpen}
        onOpenChange={setInternalOpen}
        modal={true}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="white"
            role="combobox"
            className={cn(
              "flex justify-between truncate font-normal border-gray-300 shadow-xs",
              !value?.display && "text-gray-500 hover:bg-white",
            )}
            {...props}
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
      </Popover>
    </>
  );
}
