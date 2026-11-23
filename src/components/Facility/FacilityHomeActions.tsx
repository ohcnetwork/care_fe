import { ChevronDown, SquarePen, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import FacilityDeleteDialog from "@/components/Facility/FacilityDeleteDialog";

import { PLUGIN_Component } from "@/PluginEngine";
import EditFacilitySheet from "@/pages/Organization/components/EditFacilitySheet";
import type { FacilityRead } from "@/types/facility/facility";

interface FacilityHomeActionsProps {
  facility: FacilityRead;
  isSettings: boolean;
  canDelete: boolean;
}

export function FacilityHomeActions({
  facility: facilityData,
  isSettings,
  canDelete,
}: FacilityHomeActionsProps) {
  const { t } = useTranslation();
  // The sheet and dialog live outside the menu so closing the menu does not unmount them.
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
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
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <SquarePen
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("edit_facility_details")}
            </DropdownMenuItem>
            <PLUGIN_Component
              __name="FacilityHomeActions"
              facility={facilityData}
              className="flex justify-start items-center border border-border rounded-md p-2 shadow-sm"
            />
          </DropdownMenuGroup>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                {t("delete_facility")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <EditFacilitySheet
        facilityId={facilityData.id}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {canDelete && (
        <FacilityDeleteDialog
          facility={facilityData}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}
