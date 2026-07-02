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
import { ClinicalUseCase } from "@/components/BodySite/bodySiteRegions";

import { Code } from "@/types/base/code/code";

interface CommonProps {
  placeholder?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
  className?: string;
  useCase?: ClinicalUseCase;
}

interface SingleProps extends CommonProps {
  multiple?: false;
  value?: Code | null;
  onSelect: (value: Code) => void;
}

interface MultiProps extends CommonProps {
  multiple: true;
  value?: Code[] | null;
  onSelect: (value: Code[]) => void;
}

type Props = SingleProps | MultiProps;

export default function BodySiteSelector(props: Props) {
  const {
    placeholder,
    disabled,
    closeOnSelect = true,
    className,
    useCase,
  } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const triggerLabel = (() => {
    if (props.multiple) {
      const list = props.value ?? [];
      if (list.length === 0) return placeholder || t("select_body_site");
      if (list.length === 1) return list[0].display;
      return t("selected_count", { count: list.length });
    }
    return props.value?.display || placeholder || t("select_body_site");
  })();

  const isEmpty = props.multiple
    ? (props.value ?? []).length === 0
    : !props.value?.display;

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
            isEmpty && "text-gray-500 hover:bg-white",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{t("select_body_site")}</SheetTitle>
          <SheetDescription>
            {t("body_site_selector_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 px-1">
          {props.multiple ? (
            <BodySiteSelector3D
              multiple
              value={props.value}
              onSelect={props.onSelect}
              useCase={useCase}
              height={620}
            />
          ) : (
            <BodySiteSelector3D
              value={props.value}
              onSelect={(code) => {
                props.onSelect(code);
                if (closeOnSelect) setOpen(false);
              }}
              useCase={useCase}
              height={620}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
