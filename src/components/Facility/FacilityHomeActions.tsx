import { ChevronDown, ImageIcon, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PLUGIN_Component } from "@/PluginEngine";
import EditFacilitySheet from "@/pages/Organization/components/EditFacilitySheet";
import type { FacilityRead } from "@/types/facility/facility";

import PrintTemplateSheet from "./PrintTemplateSheet";

interface FacilityHomeActionsProps {
  facility: FacilityRead;
  isSettings: boolean;
  buttonClassName?: string;
  onEditCoverImage: () => void;
}

export function FacilityHomeActions({
  facility: facilityData,
  isSettings,
  buttonClassName,
  onEditCoverImage,
}: FacilityHomeActionsProps) {
  const { t } = useTranslation();
  const editAction = (
    <EditFacilitySheet
      facilityId={facilityData.id}
      trigger={
        <Button
          className={cn(
            "cursor-pointer font-semibold",
            isSettings && buttonClassName,
            isSettings &&
              "col-span-2 border-emerald-950 bg-emerald-800 text-white hover:bg-emerald-900 hover:text-white sm:col-span-1",
          )}
          variant="outline"
          size="sm"
        >
          <CareIcon icon="l-pen" />
          {t("edit_facility_details")}
        </Button>
      }
    />
  );
  const configurationAction = (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "cursor-pointer font-semibold",
            isSettings && buttonClassName,
          )}
          aria-label={t(isSettings ? "configurations" : "more_options")}
          type="button"
        >
          {t("configurations")}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-full min-w-48",
          isSettings && "rounded-lg border-neutral-200 shadow-md",
        )}
      >
        <DropdownMenuGroup className="flex flex-col gap-1">
          <PrintTemplateSheet
            facility={facilityData}
            trigger={
              <button
                type="button"
                className={cn(
                  "hover:bg-gray-100 hover:text-gray-900 flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                  isSettings &&
                    "min-h-12 text-neutral-950 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-indigo-500 md:min-h-10",
                )}
              >
                <Printer className="size-4 text-gray-500" />
                {t("print_templates")}
              </button>
            }
          />
          <PLUGIN_Component
            __name="FacilityHomeActions"
            facility={facilityData}
            className="flex justify-start items-center border border-gray-200 rounded-md p-2 shadow-sm"
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <>
      {isSettings && editAction}
      {isSettings && (
        <Button
          variant="outline"
          className={buttonClassName}
          onClick={onEditCoverImage}
        >
          <ImageIcon className="size-5" />
          {t("edit_cover_photo")}
        </Button>
      )}
      {configurationAction}
      {!isSettings && editAction}
    </>
  );
}
