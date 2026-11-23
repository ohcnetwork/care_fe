import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";

import { BatchSpecimenCollectionSheet } from "./BatchSpecimenCollectionSheet";
import { type ServiceRequestSelection } from "./useServiceRequestSelection";

export function ServiceRequestSelectionBar({
  facilityId,
  selection,
  className,
}: {
  facilityId: string;
  selection: ServiceRequestSelection;
  className?: string;
}) {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // The sheet keeps the tests it opened with, since a save clears the ticks.
  const [sheetRequests, setSheetRequests] = useState<ServiceRequestReadSpec[]>(
    [],
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-300 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all-service-requests"
            checked={selection.allSelected}
            onCheckedChange={selection.setAllSelected}
          />
          <label
            htmlFor="select-all-service-requests"
            className="text-sm font-medium cursor-pointer"
          >
            {t("select_all")}
          </label>
        </div>
        {selection.selected.length > 0 && (
          <span className="text-sm font-medium">
            {selection.selected.length} {t("items_selected")}
          </span>
        )}
      </div>
      <Button
        variant="outline_primary"
        disabled={!selection.selected.length}
        onClick={() => {
          setSheetRequests(selection.selected);
          setIsSheetOpen(true);
        }}
      >
        {t("collect_specimen")}
        <ArrowRightIcon />
      </Button>
      <BatchSpecimenCollectionSheet
        facilityId={facilityId}
        requests={sheetRequests}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSaved={() => selection.setAllSelected(false)}
      />
    </div>
  );
}
