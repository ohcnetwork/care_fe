import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { LocationList } from "@/types/location/location";

import LocationForm from "./LocationForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  location?: LocationList;
  parentId?: string;
}

export default function LocationSheet({
  open,
  onOpenChange,
  facilityId,
  location,
  parentId,
}: Props) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {location?.id ? t("edit_location") : t("add_location")}
          </SheetTitle>
          <SheetDescription>
            {location?.id
              ? t("edit_location_description")
              : t("add_location_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <LocationForm
            facilityId={facilityId}
            locationId={location?.id}
            parentId={parentId}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
