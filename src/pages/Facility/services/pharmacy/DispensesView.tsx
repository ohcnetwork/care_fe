import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, PrinterIcon, RotateCcw } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  DISPENSE_ORDER_STATUS_STYLES,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

import { PatientHeader } from "@/components/Patient/PatientHeader";
import { PrescriptionSummary } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { PaginatedResponse } from "@/Utils/request/types";
import DispensedMedicationList from "./DispensedMedicationList";
import { MedicationReturnSheet } from "./MedicationReturnSheet";

interface Props {
  facilityId: string;
  dispenseOrderId: string;
}

export default function DispensesView({ facilityId, dispenseOrderId }: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const { qParams, updateQuery } = useFilters({
    disableCache: true,
  });

  const medicationDispenseStatus = qParams.status as MedicationDispenseStatus;

  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
    enabled: !!dispenseOrderId,
  });

  const { data: medicationDispensesResponse, isLoading: isLoadingDispenses } =
    useQuery({
      queryKey: ["medication_dispense", dispenseOrderId, locationId],
      queryFn: query(medicationDispenseApi.list, {
        queryParams: {
          location: locationId,
          limit: 100,
          order: dispenseOrderId,
        },
      }),
      enabled: !!dispenseOrderId && !!locationId,
    });

  const { data: prescriptionTags } = useQuery({
    queryKey: ["prescriptionQueue", facilityId, dispenseOrder?.patient.id],
    queryFn: query(prescriptionApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        patient_external_id: dispenseOrder?.patient.id,
      },
    }),
    select: (data: PaginatedResponse<PrescriptionSummary>) =>
      data.results.flatMap((item) => item.tags),
    enabled: !!dispenseOrder?.patient.id,
  });

  if (isLoadingOrder || isLoadingDispenses) {
    return <TableSkeleton count={5} />;
  }

  if (!dispenseOrder) {
    return null;
  }

  // Filter medications by current status
  const filteredMedications =
    medicationDispensesResponse?.results?.filter((med) =>
      medicationDispenseStatus ? med.status === medicationDispenseStatus : true,
    ) || [];

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
      {dispenseOrder && (
        <Card className="flex gap-4 mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader
            patient={dispenseOrder.patient}
            facilityId={facilityId}
          />
          {prescriptionTags && prescriptionTags.length > 0 && (
            <div className="flex flex-col gap-1 items-start mt-5">
              <span className="text-xs text-gray-700">
                {t("prescription_tags")}:
              </span>
              <div className="flex flex-wrap items-start gap-2 text-sm whitespace-nowrap">
                {prescriptionTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="capitalize"
                    title={tag.description}
                  >
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
              {dispenseOrder.created_by && (
                <div>
                  <span className="text-gray-500">{t("created_by")}:</span>{" "}
                  <span className="font-medium">
                    {formatName(dispenseOrder.created_by)}
                  </span>
                </div>
              )}
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
            {dispenseOrder.status === DispenseOrderStatus.completed && (
              <MedicationReturnSheet
                facilityId={facilityId}
                locationId={locationId}
                patient={dispenseOrder.patient}
                onSuccess={(deliveryOrder) => {
                  // Navigate to the medication return detail page
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/medication_return/order/${deliveryOrder.id}/?dispenseOrderIds=${dispenseOrderId}`,
                  );
                }}
                trigger={
                  <Button
                    variant="outline"
                    className="border-gray-400 font-semibold"
                  >
                    <RotateCcw className="size-4" />
                    {t("medication_return")}
                  </Button>
                }
              />
            )}
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

      <DispensedMedicationList
        facilityId={facilityId}
        patient={dispenseOrder.patient}
        locationId={locationId}
        status={medicationDispenseStatus}
        dispenseOrder={dispenseOrder}
        medications={filteredMedications}
        updateQuery={updateQuery}
      />
    </Page>
  );
}
