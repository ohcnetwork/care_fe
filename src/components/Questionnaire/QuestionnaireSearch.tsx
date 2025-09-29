import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { conditionalAttribute, isAppleDevice } from "@/Utils/utils";
import type { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  placeholder?: string;
  trigger?: React.ReactNode;
  onSelect?: (questionnaire: QuestionnaireDetail) => void;
  subjectType?: string;
  disabled?: boolean;
  size?: React.ComponentProps<typeof Button>["size"];
}

export function QuestionnaireSearch({
  placeholder,
  trigger,
  size = "default",
  onSelect = (selected) => navigate(`questionnaire/${selected.slug}`),
  subjectType,
  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data: questionnaires, isLoading } = useQuery({
    queryKey: ["questionnaires", "list", search, subjectType],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        title: search,
        ...conditionalAttribute(!!subjectType, {
          subject_type: subjectType,
        }),
        status: "active",
      },
    }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const content = (
    <Command filter={() => 1}>
      <CommandInput
        placeholder={t("search_questionnaires")}
        className="outline-hidden border-none ring-0 shadow-none text-base"
        onValueChange={setSearch}
        autoFocus={!isAppleDevice}
      />
      <CommandList className="overflow-y-auto">
        <CommandEmpty>
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            t("no_questionnaires_found")
          )}
        </CommandEmpty>

        <CommandGroup>
          {(questionnaires?.results ?? []).map((item: QuestionnaireDetail) => (
            <CommandItem
              key={item.id}
              value={item.title}
              onSelect={() => {
                onSelect(item);
                setIsOpen(false);
              }}
            >
              <CareIcon icon="l-file-export" className="mr-2 size-4" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button
              data-cy="add-questionnaire-button"
              variant="outline"
              role="combobox"
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <>
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 size-4 animate-spin"
                  />
                  {t("loading")}
                </>
              ) : (
                <span>{placeholder || t("add_questionnaire")}</span>
              )}
              <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          )}
        </DrawerTrigger>

        <DrawerContent className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg">
          <DrawerTitle className="sr-only">{t("questionnaire")}</DrawerTitle>
          <div className="mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            size={size}
            data-cy="add-questionnaire-button"
            variant="outline"
            role="combobox"
            className="w-full border border-primary-600"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
                {t("loading")}
              </>
            ) : (
              <div className="flex justify-start items-center gap-2 text-primary-800 w-full">
                <Plus className="size-4" />
                <span>{placeholder || t("add_questionnaire")}</span>
              </div>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
}
