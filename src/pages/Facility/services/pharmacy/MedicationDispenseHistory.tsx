import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

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
import { CreateDispenseSheet } from "@/pages/Facility/services/pharmacy/CreateDispenseSheet";
import { MedicationReturnSheet } from "@/pages/Facility/services/pharmacy/MedicationReturnSheet";

import useFilters from "@/hooks/useFilters";

import CareIcon from "@/CAREUI/icons/CareIcon";
import query from "@/Utils/request/query";
import { dateQueryString, formatDateTime } from "@/Utils/utils";
import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import {
  createdByFilter,
  dateFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import {
  FilterDateRange,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthUser from "@/hooks/useAuthUser";
import {
  DISPENSE_ORDER_STATUS_STYLES,
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { UserReadMinimal } from "@/types/user/user";
import { Link, navigate } from "raviger";

export default function MedicationDispenseHistory({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { qParams, Pagination, updateQuery, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  const [selectedDispenses, setSelectedDispenses] = useState<string[]>([]);

  // Clear selections when patient filter changes
  useEffect(() => {
    setSelectedDispenses([]);
  }, [qParams.patientId]);

  const filters = [
    createdByFilter("created_by"),
    dateFilter("created_date", t("date"), longDateRangeOptions),
  ];

  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    let query = { ...filterQuery };
    for (const [key, value] of Object.entries(filterQuery)) {
      switch (key) {
        case "created_by":
          {
            const userValue = value as UserReadMinimal | UserReadMinimal[];
            const user = Array.isArray(userValue) ? userValue[0] : userValue;
            query = {
              ...query,
              created_by: user?.id || undefined,
            };
          }
          break;
        case "created_date":
          {
            const dateRange = value as FilterDateRange;
            query = {
              ...query,
              created_date: undefined,
              created_date_after: dateRange?.from
                ? dateQueryString(dateRange?.from as Date)
                : undefined,
              created_date_before: dateRange?.to
                ? dateQueryString(dateRange?.to as Date)
                : undefined,
            };
          }
          break;
      }
    }
    updateQuery(query);
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    created_date:
      qParams.created_date_after || qParams.created_date_before
        ? {
            from: qParams.created_date_after
              ? new Date(qParams.created_date_after)
              : undefined,
            to: qParams.created_date_before
              ? new Date(qParams.created_date_before)
              : undefined,
          }
        : undefined,
    created_by: qParams.created_by === authUser.id ? [authUser] : [],
  });

  const { data: dispenseOrderQueue, isLoading } = useQuery({
    queryKey: ["dispenseOrderQueue", facilityId, locationId, qParams],
    queryFn: query.debounced(dispenseOrderApi.list, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        patient: qParams.patientId,
        status:
          qParams.exclude_status === "history"
            ? "completed,entered_in_error,abandoned"
            : "draft,in_progress",
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        created_by: qParams.created_by,
        created_date_after: qParams.created_date_after,
        created_date_before: qParams.created_date_before,
      },
    }),
  });

  const DISPENSE_STATUS_OPTIONS = {
    pending: {
      label: "pending",
    },
    history: {
      label: "history",
    },
  } as const;

  const showCheckboxes = !!qParams.patientId;

  const completedDispenses =
    dispenseOrderQueue?.results?.filter(
      (item) => item.status === DispenseOrderStatus.completed,
    ) || [];

  const allCompletedSelected =
    completedDispenses.length > 0 &&
    completedDispenses.every((item) => selectedDispenses.includes(item.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDispenses(completedDispenses.map((item) => item.id));
    } else {
      setSelectedDispenses([]);
    }
  };

  const handleSelectDispense = (dispenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedDispenses([...selectedDispenses, dispenseId]);
    } else {
      setSelectedDispenses(selectedDispenses.filter((id) => id !== dispenseId));
    }
  };

  // Get patient info from the first selected dispense (all should be for same patient)
  const selectedPatient = dispenseOrderQueue?.results?.find((item) =>
    selectedDispenses.includes(item.id),
  )?.patient;

  return (
    <Page
      title={t("dispense_orders")}
      options={
        <div className="flex items-center gap-2">
          {selectedDispenses.length > 0 &&
            qParams.patientId &&
            selectedPatient && (
              <MedicationReturnSheet
                facilityId={facilityId}
                locationId={locationId}
                patient={selectedPatient}
                onSuccess={(deliveryOrder) => {
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/medication_return/order/${deliveryOrder.id}?dispenseOrderIds=${selectedDispenses.join(",")}`,
                  );
                }}
                trigger={
                  <Button>
                    {t("return_medicines")} ({selectedDispenses.length})
                  </Button>
                }
              />
            )}
          <CreateDispenseSheet
            facilityId={facilityId}
            locationId={locationId}
            patientId={qParams.patientId}
          />
        </div>
      }
    >
      <div className="mb-4 pt-6">
        <Tabs
          value={qParams.exclude_status || "pending"}
          onValueChange={(value) => updateQuery({ exclude_status: value })}
          className="w-full"
        >
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {Object.entries(DISPENSE_STATUS_OPTIONS).map(([key, { label }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t(label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <PatientIdentifierFilter
            onSelect={(patientId, patientName) =>
              updateQuery({
                patientId: patientId,
                patient_name: patientName,
              })
            }
            placeholder={t("filter_by_identifier")}
            className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
            patientId={qParams.patientId}
            patientName={qParams.patient_name}
          />
          <MultiFilter
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onOperationChange={handleOperationChange}
            onClearAll={handleClearAll}
            onClearFilter={handleClearFilter}
            className="flex flex-row flex-wrap sm:items-center"
            facilityId={facilityId}
          />
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : dispenseOrderQueue?.results?.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon
                icon="l-prescription-bottle"
                className="text-primary size-6"
              />
            }
            title={t("no_dispense_orders_found")}
            description={t("no_dispense_orders_found_description")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {showCheckboxes && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allCompletedSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label={t("select_all")}
                    />
                  </TableHead>
                )}
                <TableHead>{t("patient_name")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispenseOrderQueue?.results?.map((item: DispenseOrderRead) => {
                const isCompleted =
                  item.status === DispenseOrderStatus.completed;
                const isSelected = selectedDispenses.includes(item.id);
                return (
                  <TableRow
                    key={item.id}
                    className={`group ${isSelected ? "bg-primary-50" : ""}`}
                  >
                    {showCheckboxes && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectDispense(item.id, checked as boolean)
                          }
                          disabled={!isCompleted}
                          aria-label={
                            isCompleted
                              ? t("select_dispense")
                              : t("dispense_not_completed")
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell
                      className="font-semibold group-hover:underline cursor-pointer"
                      onClick={() =>
                        updateQuery({
                          patientId: item.patient.id,
                          patient_name: item.patient.name,
                        })
                      }
                    >
                      {item.patient.name}
                      <div className="text-xs text-gray-500">
                        {t("created_at")}: {formatDateTime(item.created_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={DISPENSE_ORDER_STATUS_STYLES[item.status]}
                      >
                        {t(`dispense_order_status__${item.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{item.location.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.location.description}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button variant="outline" asChild>
                        <Link href={`/medication_dispense/order/${item.id}`}>
                          <ArrowUpRightSquare
                            strokeWidth={1.5}
                            className="size-4"
                          />
                          {t("view_order")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <Pagination totalCount={dispenseOrderQueue?.count || 0} />
      </div>
    </Page>
  );
}
