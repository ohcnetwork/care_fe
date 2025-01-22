import { ReactNode } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

interface MultiSelectOptionChipProps {
  label: ReactNode;
  onRemove?: () => void;
}

export const MultiSelectOptionChip = ({
  label,
  onRemove,
}: MultiSelectOptionChipProps) => {
  return (
    <span className="flex items-center gap-2 rounded-full border-secondary-300 bg-secondary-200 px-3 text-xs text-secondary-700">
      <p className="py-1">{label}</p>
      {onRemove && (
        <p
          className="cursor-pointer rounded-full hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <CareIcon icon="l-times" className="text-base" />
        </p>
      )}
    </span>
  );
};

interface OptionRenderPropArg {
  focus: boolean;
  selected: boolean;
  disabled: boolean;
}

export const dropdownOptionClassNames = ({
  focus,
  selected,
  disabled,
}: OptionRenderPropArg) => {
  return classNames(
    "group/option relative w-full cursor-default select-none p-4 text-sm transition-colors duration-75 ease-in-out",
    !disabled && focus && "bg-primary-500 text-white",
    !disabled && !focus && selected && "text-primary-500",
    !disabled && !focus && !selected && "text-secondary-900",
    disabled && "cursor-not-allowed text-secondary-600",
    selected ? "font-semibold" : "font-normal",
  );
};
