import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, ChevronDown, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { DispenseOrderStatus } from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";
import patientApi from "@/types/emr/patient/patientApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import mutate from "@/Utils/request/mutate";
import { toast } from "sonner";
import DispensedMedicationList from "./DispensedMedicationList";

const DISPENSE_ORDER_STATUS_STYLES: Record<
  DispenseOrderStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  [DispenseOrderStatus.draft]: "secondary",
  [DispenseOrderStatus.in_progress]: "yellow",
  [DispenseOrderStatus.completed]: "green",
  [DispenseOrderStatus.abandoned]: "secondary",
  [DispenseOrderStatus.entered_in_error]: "danger",
};

interface Props {
  facilityId: string;
  dispenseOrderId: string;
  status?: MedicationDispenseStatus;
}

export default function DispensesView({
  facilityId,
  dispenseOrderId,
  status = MedicationDispenseStatus.completed,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();
  const queryClient = useQueryClient();

  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
    enabled: !!dispenseOrderId,
  });

  const { mutate: updateDispenseOrder, isPending: isUpdatingDispenseOrder } =
    useMutation({
      mutationFn: mutate(dispenseOrderApi.update, {
        pathParams: { facilityId, id: dispenseOrderId },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
        });
      },
      onError: () => {
        toast.error(t("error_updating_dispense_order"));
      },
    });

  const defaultVisibleStatuses = [
    MedicationDispenseStatus.preparation,
    MedicationDispenseStatus.in_progress,
    MedicationDispenseStatus.completed,
    MedicationDispenseStatus.cancelled,
  ];

  const allStatuses = Object.values(MedicationDispenseStatus);
  const [visibleTabs, setVisibleTabs] = useState<MedicationDispenseStatus[]>(
    defaultVisibleStatuses,
  );
  const [dropdownItems, setDropdownItems] = useState<
    MedicationDispenseStatus[]
  >(allStatuses.filter((status) => !defaultVisibleStatuses.includes(status)));

  const handleDropdownSelect = (value: MedicationDispenseStatus) => {
    const lastVisibleTab = visibleTabs[visibleTabs.length - 1];
    const newVisibleTabs = [...visibleTabs.slice(0, -1), value];
    const newDropdownItems = [
      ...dropdownItems.filter((item) => item !== value),
      lastVisibleTab,
    ];

    setVisibleTabs(newVisibleTabs);
    setDropdownItems(newDropdownItems);
    navigate(
      `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/${value}`,
    );
  };

  const { data: patientData } = useQuery({
    queryKey: ["patient", dispenseOrder?.patient.id],
    queryFn: query(patientApi.get, {
      pathParams: { id: dispenseOrder?.patient.id ?? "" },
    }),
    enabled: !!dispenseOrder?.patient.id,
  });

  if (isLoadingOrder) {
    return <TableSkeleton count={5} />;
  }

  if (!dispenseOrder) {
    return null;
  }

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div>
        <Button
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_dispense/`,
            )
          }
          data-shortcut-id="go-back"
          size="sm"
        >
          <ArrowLeftIcon className="size-4" />
          {t("back_to_dispense_queue")}
        </Button>
      </div>
      {patientData && (
        <Card className="mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader patient={patientData} facilityId={facilityId} />
        </Card>
      )}

      {/* Dispense Order Header */}
      <div className="bg-white border rounded-md p-4 mb-4">
        <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
          <div className="flex flex-row gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {dispenseOrder.name}
            </h2>
            {dispenseOrder.note && (
              <p className="text-sm text-gray-600">{dispenseOrder.note}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <div>
                <span className="text-gray-500">{t("created_at")}:</span>{" "}
                <span className="font-medium">
                  {formatDateTime(dispenseOrder.created_date)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t("location")}:</span>{" "}
                <span className="font-medium">
                  {dispenseOrder.location.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={DISPENSE_ORDER_STATUS_STYLES[dispenseOrder.status]}>
              {t("status")}:{" "}
              {t(`dispense_order_status__${dispenseOrder.status}`)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-400 px-2">
                  <CareIcon icon="l-ellipsis-v" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.values(DispenseOrderStatus)
                  .filter((status) => status !== dispenseOrder.status)
                  .map((status) => (
                    <DropdownMenuItem asChild key={status}>
                      <Button
                        variant="ghost"
                        onClick={() => updateDispenseOrder({ status })}
                        className="w-full flex flex-row justify-stretch items-center"
                        disabled={isUpdatingDispenseOrder}
                      >
                        {t(`mark_as_${status}`)}
                      </Button>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="border-gray-400 font-semibold"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/print`,
                )
              }
            >
              <PrinterIcon className="size-4" />
              {t("print")}
            </Button>
          </div>
        </div>
      </div>
      <Tabs
        value={status}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}/${value}`,
          )
        }
      >
        <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
          {visibleTabs.map((statusValue) => (
            <TabsTrigger
              key={statusValue}
              value={statusValue}
              className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t(statusValue)}
            </TabsTrigger>
          ))}
          {dropdownItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gray-500 font-semibold hover:text-gray-900 hover:bg-transparent pb-2.5 px-2.5"
                >
                  {t("more")}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownItems.map((statusValue) => (
                  <DropdownMenuItem
                    key={statusValue}
                    onClick={() => handleDropdownSelect(statusValue)}
                    className="text-gray-950 font-medium text-sm"
                  >
                    {t(statusValue)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>

        <div>
          {Object.values(MedicationDispenseStatus).map((statusValue) => (
            <TabsContent key={statusValue} value={statusValue} className="p-2">
              <DispensedMedicationList
                facilityId={facilityId}
                patientId={dispenseOrder.patient.id}
                locationId={locationId}
                status={statusValue}
                dispenseOrderId={dispenseOrderId}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </Page>
  );
}
