import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { LocationSearch } from "@/components/Location/LocationSearch";

import mutate from "@/Utils/request/mutate";
import deviceApi from "@/types/device/deviceApi";
import { LocationList } from "@/types/location/location";

interface Props {
  facilityId: string;
  deviceId: string;
  children?: React.ReactNode;
}

export default function AssociateLocationSheet({
  facilityId,
  deviceId,
  children,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const { mutate: associateLocation, isPending } = useMutation({
    mutationFn: mutate(deviceApi.associateLocation, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device", facilityId, deviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["deviceLocationHistory", facilityId, deviceId],
      });
      toast.success(t("location_associated_successfully"));
      setOpen(false);
      setSelectedLocation(null);
    },
  });

  const handleSubmit = () => {
    if (!selectedLocation) return;
    associateLocation({ location: selectedLocation.id });
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("associate_location")}</SheetTitle>
          <SheetDescription>
            {t("associate_location_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <LocationSearch
            facilityId={facilityId}
            onSelect={setSelectedLocation}
            value={selectedLocation}
          />
        </div>
        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedLocation || isPending}
          >
            {isPending ? t("associating") : t("associate")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
