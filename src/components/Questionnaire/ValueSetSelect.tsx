import { CaretSortIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import ValueSetSearchContent from "@/components/Questionnaire/ValueSetSearchContent";

import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import { Code } from "@/types/base/code/code";
import valuesetRoutes from "@/types/valueset/valuesetApi";

interface Props {
  system: string;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  wrapTextForSmallScreen?: boolean;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  showCode?: boolean;
  title?: string;
  asSheet?: boolean;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  disabled,
  count = 10,
  searchPostFix = "",
  wrapTextForSmallScreen = false,
  hideTrigger = false,
  controlledOpen = false,
  showCode = false,
  title,
  asSheet = false,
}: Props) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [isClearingFavourites, setIsClearingFavourites] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const clearFavouritesMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.clearFavourites, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
      setIsClearingFavourites(false);
    },
  });

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

  const alert = (
    <AlertDialog
      open={isClearingFavourites}
      onOpenChange={(open) => setIsClearingFavourites(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("are_you_sure_clear_starred")}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsClearingFavourites(false)}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              clearFavouritesMutation.mutate({});
            }}
          >
            {clearFavouritesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              t("confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile && !hideTrigger && asSheet) {
    return (
      <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            onClick={() => setInternalOpen(true)}
            className={cn(
              "w-full justify-between",
              wrapTextForSmallScreen
                ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
                : "truncate",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <span>{value?.display || placeholder}</span>
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-3xl"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
          <div className="mt-6 h-full">
            <ValueSetSearchContent
              system={system}
              onSelect={(selected) => {
                onSelect(selected);
                setInternalOpen(false);
              }}
              count={count}
              searchPostFix={searchPostFix}
              showCode={showCode}
              search={search}
              onSearchChange={setSearch}
              title={title}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (isMobile && !hideTrigger) {
    return (
      <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between border border-primary rounded-md px-5",
              wrapTextForSmallScreen
                ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
                : "truncate",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <div className="flex items-center">
              <CareIcon
                icon="l-plus"
                className="mr-2 text-5xl text-primary-700 font-normal"
              />
              <span className="text-primary-700 flex items-center font-semibold text-base text-wrap">
                {value?.display || placeholder}
                {value?.display && showCode && (
                  <span className="text-xs ml-1">({value?.code})</span>
                )}
              </span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-3xl"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
          <div className="mt-6 h-full">
            <ValueSetSearchContent
              system={system}
              onSelect={(selected) => {
                onSelect(selected);
                setInternalOpen(false);
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
        </SheetContent>
      </Sheet>
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
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                wrapTextForSmallScreen
                  ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
                  : "truncate",
                !value?.display && "text-gray-400",
              )}
            >
              <span>
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
              setInternalOpen(false);
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
                setInternalOpen(false);
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
      {alert}
    </>
  );
}
