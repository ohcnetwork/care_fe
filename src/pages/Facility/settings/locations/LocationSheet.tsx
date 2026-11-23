import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  type LocationForm as LocationFormType,
  LocationTypeIcons,
} from "@/types/location/location";

import LocationForm from "./LocationForm";
import { LocationManageSections } from "./components/LocationManageSections";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  /** The location to manage. Leave out to add a new one under `parentId`. */
  location?: { id: string; form: LocationFormType };
  parentId?: string;
  onDeleted?: () => void;
}

/**
 * Adds a location, or manages an existing one. For an existing location
 * this is the one place for everything about it: its fields, tags,
 * departments and removal.
 */
export default function SettingsLocationSheet({
  open,
  onOpenChange,
  facilityId,
  location,
  parentId,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const TypeIcon = location && LocationTypeIcons[location.form];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>
            {location ? t("edit_location") : t("add_location")}
          </SheetTitle>
          {location ? (
            // What it is cannot be changed, so it is named here, not in a field.
            <SheetDescription className="flex items-center gap-1.5">
              {TypeIcon && (
                <TypeIcon className="size-4 shrink-0" aria-hidden="true" />
              )}
              {t(`location_form__${location.form}`)}
            </SheetDescription>
          ) : (
            <SheetDescription>{t("add_location_description")}</SheetDescription>
          )}
        </SheetHeader>
        <LocationForm
          facilityId={facilityId}
          locationId={location?.id}
          parentId={parentId}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        >
          {location && (
            <LocationManageSections
              facilityId={facilityId}
              locationId={location.id}
              onDeleted={() => {
                onOpenChange(false);
                onDeleted?.();
              }}
            />
          )}
        </LocationForm>
      </SheetContent>
    </Sheet>
  );
}
