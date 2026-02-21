import { useQuery } from "@tanstack/react-query";
import { Box, Eye } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

import { CreateMedicationReturnSheet } from "@/pages/Facility/services/pharmacy/CreateMedicationReturnSheet";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";

interface Props {
  facilityId: string;
  locationId: string;
}

const STATUS_TABS = [
  { value: "all", label: "all" },
  { value: DeliveryOrderStatus.draft, label: "draft" },
  { value: DeliveryOrderStatus.pending, label: "pending" },
  { value: DeliveryOrderStatus.completed, label: "completed" },
  { value: DeliveryOrderStatus.abandoned, label: "abandoned" },
] as const;

export default function MedicationReturnList({
  facilityId,
  locationId,
}: Props) {
  const { t } = useTranslation();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const currentStatus = qParams.status || "all";

  const { data: response, isLoading } = useQuery({
    queryKey: ["medicationReturns", locationId, qParams],
    queryFn: query.debounced(deliveryOrderApi.listDeliveryOrder, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        destination: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: currentStatus !== "all" ? currentStatus : undefined,
        patient_isnull: false, // Medication returns always have a patient
        patient: qParams.patient_external_id,
      },
    }),
  });

  const orders = response?.results || [];

  return (
    <Page title={t("medication_return")} hideTitleOnPage>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t("medication_return")}
            </h1>
          </div>
          <CreateMedicationReturnSheet
            facilityId={facilityId}
            locationId={locationId}
          />
        </div>

        {/* Status Tabs */}
        <div className="mb-4">
          <Tabs
            value={currentStatus}
            onValueChange={(value) => updateQuery({ status: value, page: 1 })}
            className="w-full"
          >
            <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                >
                  {t(tab.label)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Patient Identifier Filter */}
        <div className="flex flex-col md:flex-row items-start gap-2">
          <div className="w-full md:w-auto">
            <PatientIdentifierFilter
              onSelect={(patientId, patientName) =>
                updateQuery({
                  patient_external_id: patientId,
                  patient_name: patientName,
                  page: 1,
                })
              }
              placeholder={t("filter_by_identifier")}
              className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
              patientId={qParams.patient_external_id}
              patientName={qParams.patient_name}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          <MedicationReturnTable
            deliveries={orders}
            isLoading={isLoading}
            facilityId={facilityId}
            locationId={locationId}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}

interface TableProps {
  deliveries: DeliveryOrderRetrieve[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
}

function MedicationReturnTable({
  deliveries,
  isLoading,
  facilityId,
  locationId,
}: TableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<Box className="text-primary size-5" />}
        title={t("no_medication_returns_found")}
        description={t("no_medication_returns_found_description")}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("patient")}</TableHead>
          <TableHead>{t("return_to")}</TableHead>
          <TableHead>{t("created_on")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead className="w-28">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.map((delivery: DeliveryOrderRetrieve) => (
          <TableRow key={delivery.id}>
            <TableCell className="font-medium">{delivery.name}</TableCell>
            <TableCell>{delivery.patient?.name}</TableCell>
            <TableCell>{delivery.destination.name}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {formatDateTime(delivery.created_date)}
            </TableCell>
            <TableCell>
              <Badge variant={DELIVERY_ORDER_STATUS_COLORS[delivery.status]}>
                {t(delivery.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/medication_return/order/${delivery.id}`,
                  )
                }
              >
                <Eye className="mr-1 size-4" />
                {t("view")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
