import { ChevronDown, Printer, SquarePen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PLUGIN_Component } from "@/PluginEngine";
import PrintTemplateSheet from "@/components/Facility/PrintTemplateSheet";
import EditFacilitySheet from "@/pages/Organization/components/EditFacilitySheet";
import type { FacilityRead } from "@/types/facility/facility";

interface FacilityHomeActionsProps {
  facility: FacilityRead;
  isSettings: boolean;
}

export function FacilityHomeActions({
  facility: facilityData,
  isSettings,
}: FacilityHomeActionsProps) {
  const { t } = useTranslation();
  const [printTemplatesOpen, setPrintTemplatesOpen] = useState(false);
  const editAction = (
    <EditFacilitySheet
      facilityId={facilityData.id}
      trigger={
        <Button variant="outline" size={isSettings ? "default" : "sm"}>
          <SquarePen aria-hidden="true" />
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
          size={isSettings ? "default" : "sm"}
          aria-label={t(isSettings ? "configurations" : "more_options")}
          type="button"
        >
          {t("configurations")}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-full min-w-48">
        <DropdownMenuGroup className="flex flex-col gap-1">
          <DropdownMenuItem
            onSelect={() => setPrintTemplatesOpen(true)}
            className={cn(
              "h-auto w-full justify-start rounded-sm px-2 py-1.5 text-sm whitespace-normal",
              isSettings && "min-h-12 md:min-h-10",
            )}
          >
            <Printer
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {t("print_templates")}
          </DropdownMenuItem>

          <PLUGIN_Component
            __name="FacilityHomeActions"
            facility={facilityData}
            className="flex justify-start items-center border border-border rounded-md p-2 shadow-sm"
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <>
      {configurationAction}
      <PrintTemplateSheet
        facility={facilityData}
        open={printTemplatesOpen}
        onOpenChange={setPrintTemplatesOpen}
      />
      {editAction}
    </>
  );
}
