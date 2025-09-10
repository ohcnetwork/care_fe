import { Button, type ButtonVariant } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NonEmptyArray } from "@/Utils/types";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

interface SelectActionOption<T = string> {
  value: T;
  child: React.ReactNode;
  variant?: "default" | "destructive";
}

interface SelectActionButtonProps<T = string> {
  options: NonEmptyArray<SelectActionOption<T>>;
  onAction: (value: T) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: "xs" | "sm" | "default" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  persistKey?: string;
  fallbackText?: string;
}

const selectActionButtonAtom = atomWithStorage<Record<string, unknown>>(
  "select-action-button",
  {},
  undefined,
  { getOnInit: true },
);

function SelectActionButton<T = string>({
  options,
  onAction,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "default",
  className,
  children,
  persistKey,
  fallbackText = "Select action",
}: SelectActionButtonProps<T>) {
  const { t } = useTranslation();

  const [selectActionButtonDefaults, setSelectActionButtonDefaults] = useAtom(
    selectActionButtonAtom,
  );

  const [selectedValue, setSelectedValue] = React.useState<T | undefined>(
    () => {
      if (persistKey) {
        if (selectActionButtonDefaults[persistKey] !== undefined) {
          return selectActionButtonDefaults[persistKey] as T;
        }
      }
      return options[0].value;
    },
  );
  const currentOption =
    options.find((o) => o.value === selectedValue) || options[0];

  const handleAction = () => {
    if (currentOption !== undefined) {
      onAction(currentOption.value);
    }
  };

  const handleOptionSelect = (value: T) => {
    setSelectedValue(value);
    if (persistKey) {
      setSelectActionButtonDefaults({
        ...selectActionButtonDefaults,
        [persistKey]: value,
      });
    }
  };

  console.log("current option", currentOption);
  console.log(selectedValue, "selectedValue");
  console.log(persistKey, "persist");

  // If there's only one option, render a simple button
  if (options.length === 1) {
    const option = options[0];

    return (
      <Button
        variant={option.variant === "destructive" ? "destructive" : variant}
        size={size}
        disabled={disabled || loading}
        onClick={() => onAction(option.value)}
        className={className}
      >
        {children || t(option.value as string)}
      </Button>
    );
  }

  return (
    <div className={cn("flex", className)}>
      {/* Main action button */}
      <Button
        variant={
          currentOption?.variant === "destructive" ? "destructive" : variant
        }
        size={size}
        disabled={disabled || loading || selectedValue === undefined}
        onClick={handleAction}
        className="rounded-r-none border-r-0"
      >
        {children || t(currentOption?.value as string) || fallbackText}
      </Button>

      {/* Dropdown trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={
              currentOption?.variant === "destructive" ? "destructive" : variant
            }
            size={size}
            disabled={disabled || loading}
            className="rounded-l-none px-2"
          >
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;

            return (
              <React.Fragment key={index}>
                <DropdownMenuItem
                  onClick={() => {
                    onAction(option.value);
                    handleOptionSelect(option.value);
                  }}
                  variant={option.variant}
                  className={cn(
                    "flex flex-row gap-2",
                    isSelected && "bg-gray-100 dark:bg-gray-800",
                  )}
                >
                  <CheckIcon
                    className={cn("size-4", !isSelected && "invisible")}
                  />
                  {option.child}
                </DropdownMenuItem>
                {index < options.length - 1 &&
                  option.variant === "destructive" &&
                  options[index + 1]?.variant !== "destructive" && (
                    <DropdownMenuSeparator />
                  )}
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export {
  SelectActionButton,
  type SelectActionButtonProps,
  type SelectActionOption,
};
