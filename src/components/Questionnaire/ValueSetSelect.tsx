import { CaretSortIcon } from "@radix-ui/react-icons";
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

import { Code } from "@/types/base/code/code";

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
  asSheet?: boolean;
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
  asSheet = false,
}: Props) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [isClearingFavourites, setIsClearingFavourites] = useState(false);
  const [favouriteToRemove, setFavouriteToRemove] = useState<Code | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refs to access mutation functions from ValueSetSearchContent
  const removeFavouriteRef = useRef<((favourite: Code) => void) | null>(null);
  const clearFavouritesRef = useRef<(() => void) | null>(null);

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

  // Individual favourite removal dialog
  const individualFavouriteAlert = (
    <AlertDialog
      open={!!favouriteToRemove}
      onOpenChange={(open) => {
        if (!open) {
          setFavouriteToRemove(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("are_you_sure_want_to_clear_favourite", {
              name: favouriteToRemove?.display,
            })}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setFavouriteToRemove(null);
            }}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              if (favouriteToRemove && removeFavouriteRef.current) {
                removeFavouriteRef.current(favouriteToRemove);
              }
              setFavouriteToRemove(null);
            }}
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Bulk clear favourites dialog
  const bulkClearAlert = (
    <AlertDialog
      open={isClearingFavourites}
      onOpenChange={(open) => {
        if (!open) {
          setIsClearingFavourites(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("are_you_sure_clear_starred")}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setIsClearingFavourites(false);
            }}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              if (clearFavouritesRef.current) {
                clearFavouritesRef.current();
              }
              setIsClearingFavourites(false);
            }}
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile && !hideTrigger && asSheet) {
    return (
      <>
        <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
          <SheetTrigger asChild>
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
          </SheetTrigger>
          <SheetContent side="bottom" className="px-0 pt-2 pb-0 rounded-t-3xl">
            <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
            <div className="mt-6 h-full">
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
                onFavouriteRemove={(favourite) =>
                  setFavouriteToRemove(favourite)
                }
                onClearAllFavourites={() => setIsClearingFavourites(true)}
                removeFavouriteRef={removeFavouriteRef}
                clearFavouritesRef={clearFavouritesRef}
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
        {individualFavouriteAlert}
        {bulkClearAlert}
      </>
    );
  }

  if (isMobile && !hideTrigger) {
    return (
      <>
        <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
          <SheetTrigger asChild>
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
                  if (closeOnSelect) {
                    setInternalOpen(false);
                  } else {
                    inputRef.current?.focus();
                  }
                }}
                onFavouriteRemove={(favourite) =>
                  setFavouriteToRemove(favourite)
                }
                onClearAllFavourites={() => setIsClearingFavourites(true)}
                removeFavouriteRef={removeFavouriteRef}
                clearFavouritesRef={clearFavouritesRef}
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
        {individualFavouriteAlert}
        {bulkClearAlert}
      </>
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
            <div className="w-full">
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
            </div>
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
            onFavouriteRemove={(favourite) => setFavouriteToRemove(favourite)}
            onClearAllFavourites={() => setIsClearingFavourites(true)}
            removeFavouriteRef={removeFavouriteRef}
            clearFavouritesRef={clearFavouritesRef}
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
              onFavouriteRemove={(favourite) => setFavouriteToRemove(favourite)}
              onClearAllFavourites={() => setIsClearingFavourites(true)}
              removeFavouriteRef={removeFavouriteRef}
              clearFavouritesRef={clearFavouritesRef}
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
      {individualFavouriteAlert}
      {bulkClearAlert}
    </>
  );
}
