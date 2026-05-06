import { CaretSortIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import BodySiteSelector3D from "@/components/BodySite/BodySiteSelector3D";

import { Code } from "@/types/base/code/code";

interface Props {
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
  className?: string;
}

export default function BodySiteSelector({
  value,
  onSelect,
  placeholder,
  disabled,
  closeOnSelect = true,
  className,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleSelect = (code: Code) => {
    onSelect(code);
    if (closeOnSelect) {
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="white"
          role="combobox"
          disabled={disabled}
          className={cn(
            "flex w-full justify-between truncate font-normal border-gray-300 shadow-xs",
            !value?.display && "text-gray-500 hover:bg-white",
            className,
          )}
        >
          <span className="truncate">
            {value?.display || placeholder || t("select_body_site")}
          </span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("select_body_site")}</SheetTitle>
          <SheetDescription>
            {t("body_site_selector_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 px-1">
          <BodySiteSelector3D
            value={value}
            onSelect={handleSelect}
            height={560}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
