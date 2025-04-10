import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationSearch } from "@/components/Location/LocationSearch";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { DeviceLocationTimelineCard } from "@/pages/Facility/settings/devices/components/DeviceLocationTimelineCard";
import { DeviceDetail } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";
import { LocationList } from "@/types/location/location";

interface Props {
  facilityId: string;
  device: DeviceDetail;
  children?: React.ReactNode;
}

export default function ManageLocationSheet({
  facilityId,
  device,
  children,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["deviceLocationHistory", facilityId, device.id],
    queryFn: query(deviceApi.locationHistory, {
      pathParams: {
        facilityId,
        id: device.id,
      },
    }),
    enabled: open,
  });

  const { mutate: associateLocation, isPending } = useMutation({
    mutationFn: mutate(deviceApi.associateLocation, {
      pathParams: { facility_id: facilityId, id: device.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device", facilityId, device.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["deviceLocationHistory", facilityId, device.id],
      });
      toast.success(
        selectedLocation
          ? t("location_associated_successfully")
          : t("location_disassociated_successfully"),
      );
      setSelectedLocation(null);
    },
  });

  const handleSubmit = () => {
    associateLocation({ location: selectedLocation?.id ?? null });
  };

  const handleDisassociate = () => {
    associateLocation({ location: null });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-auto">
        <SheetHeader>
          <SheetTitle>{t("associate_location")}</SheetTitle>
          <SheetDescription>
            {t("associate_location_description")}
          </SheetDescription>
        </SheetHeader>

        {device?.current_location ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {t("current_location")}
                </div>
                <Link
                  href={`/location/${device.current_location.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                >
                  {device.current_location.name}
                  <CareIcon
                    icon="l-external-link-alt"
                    className="size-3 opacity-50"
                  />
                </Link>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisassociate}
                disabled={isPending}
              >
                {isPending ? t("disassociating") : t("disassociate")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <LocationSearch
              facilityId={facilityId}
              onSelect={setSelectedLocation}
              value={selectedLocation}
            />
            <Button
              onClick={handleSubmit}
              disabled={!selectedLocation || isPending}
              className="w-full mt-4"
            >
              {isPending ? t("associating") : t("associate")}
            </Button>
          </div>
        )}

        <Separator className="my-6" />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">{t("location_history")}</h4>

          {isLoading ? (
            <div className="grid gap-4">
              <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
            </div>
          ) : (
            <div>
              {locationsData?.results?.length === 0 ? (
                <div className="p-2">
                  <div className="h-full space-y-2 rounded-lg bg-white px-4 py-8 border border-secondary-300">
                    <div className="flex w-full items-center justify-center">
                      <span className="text-sm text-gray-500">
                        {t("no_locations_found")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4">
                  {locationsData?.results?.map((locationData) => (
                    <li key={locationData.id} className="group">
                      <DeviceLocationTimelineCard locationData={locationData} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
