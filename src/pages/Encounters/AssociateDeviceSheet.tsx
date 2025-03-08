import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { DeviceSearch } from "@/pages/Facility/settings/devices/DeviceSearch";
import { DeviceList } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
  encounterId: string;
  children?: React.ReactNode;
}

export default function AssociateDeviceSheet({
  facilityId,
  encounterId,
  children,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<DeviceList | null>(null);
  const [open, setOpen] = useState(false);

  const { mutate: associateDevice, isPending: isPendingAssociation } =
    useMutation({
      mutationFn: mutate(deviceApi.associateEncounter, {
        pathParams: { facilityId, id: selectedDevice?.id },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["devices", facilityId],
        });
        toast.success(t("device_associated_successfully"));
        setOpen(false);
        setSelectedDevice(null);
      },
    });

  const { data: selectedDeviceDetail, isPending: isPendingDevice } = useQuery({
    queryKey: ["device", facilityId, selectedDevice?.id],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: selectedDevice?.id },
    }),
    enabled: !!selectedDevice,
  });

  const handleSubmit = () => {
    if (!selectedDevice) return;
    associateDevice({ encounter: encounterId });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("associate_device")}</SheetTitle>
          <SheetDescription>
            {t("associate_device_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <DeviceSearch
            facilityId={facilityId}
            onSelect={setSelectedDevice}
            value={selectedDevice}
          />
        </div>
        <SheetFooter>
          {selectedDeviceDetail?.current_encounter &&
          selectedDeviceDetail.current_encounter.id != encounterId ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="primary">
                  <CareIcon icon="l-link-add" className="h-4" />
                  {t("associate")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("device_association_exist")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("associate_device_confirmation")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button variant="warning" className="p-2 mr-6">
                    <Link
                      href={`/facility/${facilityId}/patient/${selectedDeviceDetail.current_encounter.patient.id}/encounter/${selectedDeviceDetail.current_encounter.id}/updates`}
                      className="flex gap-1"
                    >
                      <Eye className="w-4 h-4 mt-1" />
                      <span>{t("view_associated_encounter")}</span>
                    </Link>
                  </Button>
                  <AlertDialogCancel>
                    <CareIcon icon="l-cancel" className="h-4" />
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmit}
                    className={cn(buttonVariants({ variant: "primary" }))}
                    disabled={isPendingDevice || isPendingAssociation}
                  >
                    <CareIcon icon="l-link-add" className="h-4" />
                    {isPendingAssociation ? t("associating") : t("proceed")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedDevice || isPendingAssociation || isPendingDevice
              }
            >
              <CareIcon icon="l-link-add" className="h-4" />
              {isPendingAssociation ? t("associating") : t("associate")}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
