import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  createFilterConfig,
  getVariantColorClasses,
} from "@/components/ui/multi-filter/utils/Utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseCategory,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpdate,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { groupItemsByTime } from "@/lib/time";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import ViewDefaultAccountButton from "@/pages/Facility/billing/account/ViewDefaultAccountButton";
import batchApi from "@/types/base/batch/batchApi";
import accountApi from "@/types/billing/account/accountApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PatientListRead } from "@/types/emr/patient/patient";
import { round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PillIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface MedicationTableProps {
  facilityId: string;
  medications: MedicationDispenseRead[];
}

function MedicationTable({ facilityId, medications }: MedicationTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateMedication } = useMutation({
    mutationFn: (body: MedicationDispenseUpdate) => {
      return mutate(medicationDispenseApi.update, {
        body: {
          status: body.status,
        },
        pathParams: {
          id: body.id,
        },
      })(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      toast.success(t("dispense_status_updated"));
    },
  });

  const editableStatuses = [
    MedicationDispenseStatus.preparation,
    MedicationDispenseStatus.in_progress,
    MedicationDispenseStatus.completed,
  ];

  const getStatusOptions = (charge_item?: ChargeItemRead) => {
    const statusOptions = [
      MedicationDispenseStatus.preparation,
      MedicationDispenseStatus.in_progress,
      MedicationDispenseStatus.completed,
    ];
    if (
      !charge_item ||
      !charge_item?.paid_invoice ||
      charge_item?.paid_invoice?.status === InvoiceStatus.draft
    ) {
      statusOptions.push(MedicationDispenseStatus.declined);
    }
    return statusOptions;
  };

  return (
    <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
      <Table className="rounded-md">
        <TableHeader className="bg-gray-100 text-gray-700">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("medicine")}</TableHead>
            <TableHead className="text-gray-700">{t("dosage")}</TableHead>
            <TableHead className="text-gray-700">{t("frequency")}</TableHead>
            <TableHead className="text-gray-700">{t("quantity")}</TableHead>
            <TableHead className="text-gray-700">
              {t("item_location")}
            </TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="text-gray-700">
              {t("prepared_date")}
            </TableHead>
            <TableHead className="text-gray-700">
              {t("payment_status")}
            </TableHead>
            <TableHead className="text-gray-700">{t("invoice")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {medications.map((medication) => {
            const instruction = medication.dosage_instruction[0] ?? {};
            const frequency = instruction?.timing?.code;
            const dosage = instruction?.dose_and_rate?.dose_quantity;
            const isPaid =
              medication.charge_item?.paid_invoice?.status ===
              InvoiceStatus.balanced;

            return (
              <TableRow
                key={medication.id}
                className="hover:bg-gray-50 divide-x"
              >
                <TableCell className="text-gray-950 font-semibold">
                  {medication.item.product.product_knowledge.name}
                </TableCell>
                <TableCell className={"text-gray-950"}>
                  {dosage
                    ? `${round(dosage.value)} ${dosage.unit.display}`
                    : "-"}
                </TableCell>
                <TableCell className={"text-gray-950"}>
                  {instruction?.as_needed_boolean
                    ? `${t("as_needed_prn")} ${
                        instruction?.as_needed_for?.display
                          ? `(${instruction.as_needed_for.display})`
                          : ""
                      }`
                    : frequency?.display || "-"}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {medication.quantity ? round(medication.quantity) : "-"}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {medication.item.location.name || "-"}
                </TableCell>
                <TableCell className={"text-gray-950"}>
                  {editableStatuses.includes(medication.status) ? (
                    <Select
                      value={medication.status.toString()}
                      onValueChange={(value) => {
                        updateMedication({
                          id: medication.id,
                          status: value as MedicationDispenseStatus,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatusOptions(medication?.charge_item).map(
                          (status) => {
                            return (
                              <SelectItem
                                key={status}
                                value={status.toString()}
                              >
                                {t(status)}
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={
                        MEDICATION_DISPENSE_STATUS_COLORS[medication.status]
                      }
                    >
                      {t(medication.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className={"text-gray-950"}>
                  {new Date(medication.when_prepared).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {!medication.charge_item ? (
                    "-"
                  ) : (
                    <Badge variant={isPaid ? "green" : "destructive"}>
                      {isPaid ? t("paid") : t("unpaid")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {medication?.charge_item?.paid_invoice && (
                    <Button variant="link" asChild>
                      <Link
                        href={`/facility/${facilityId}/billing/invoices/${medication.charge_item.paid_invoice?.id}`}
                        basePath={`/`}
                        className="hover:text-primary underline underline-offset-2"
                      >
                        {t("view_invoice")}
                        <CareIcon
                          icon="l-external-link-alt"
                          className="size-3"
                        />
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface Props {
  facilityId: string;
  patient: PatientListRead;
  locationId: string;
  status: MedicationDispenseStatus | undefined;
  dispenseOrder: DispenseOrderRead;
  medications: MedicationDispenseRead[];
  updateQuery: ({ status }: { status: MedicationDispenseStatus }) => void;
}

export default function DispensedMedicationList({
  facilityId,
  patient,
  locationId,
  status,
  dispenseOrder,
  medications,
  updateQuery,
}: Props) {
  useShortcutSubContext("facility:pharmacy");
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [paymentFilter, setPaymentFilter] = useState<"paid" | "unpaid" | "all">(
    "all",
  );
  const [billableChargeItems, setBillableChargeItems] = useState<
    ChargeItemRead[]
  >([]);
  const [createInvoiceSheetOpen, setCreateInvoiceSheetOpen] = useState(false);

  const filters = useMemo(
    () => [
      createFilterConfig(
        "status",
        t("status"),
        "command",
        Object.values(MedicationDispenseStatus).map((s) => ({
          value: s,
          label: t(s),
          color: getVariantColorClasses(MEDICATION_DISPENSE_STATUS_COLORS[s]),
        })),
      ),
    ],
    [t],
  );

  const onFilterUpdate = (query: Record<string, any>) => {
    updateQuery(query as { status: MedicationDispenseStatus });
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    status: status,
  });

  const { data: account } = useQuery({
    queryKey: ["accounts", patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patient.id,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
  });

  const { mutate: updateDispenseOrder, isPending: isUpdatingDispenseOrder } =
    useMutation({
      mutationFn: mutate(batchApi.batchRequest),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["dispenseOrder", facilityId, dispenseOrder.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["medication_dispense", dispenseOrder.id, locationId],
        });
        toast.success(t("medication_dispense_updated"));
      },
      onError: () => {
        toast.error(t("error_updating_medication_dispenses"));
      },
    });

  const handleUpdateDispenseOrder = (
    newDispenseOrderStatus: DispenseOrderStatus = DispenseOrderStatus.completed,
  ) => {
    const requests: Array<{
      url: string;
      method: string;
      reference_id: string;
      body: any;
    }> = [
      {
        url: `/api/v1/facility/${facilityId}/order/dispense/${dispenseOrder.id}/`,
        method: "PATCH",
        reference_id: `update_dispense_order_${dispenseOrder.id}`,
        body: { status: newDispenseOrderStatus },
      },
    ];
    const medicationsDispenses =
      medications.filter(
        (med) =>
          med.status === MedicationDispenseStatus.preparation ||
          med.status === MedicationDispenseStatus.in_progress,
      ) || [];

    if (medicationsDispenses.length > 0) {
      let newMedicationDispenseStatus = MedicationDispenseStatus.in_progress;
      switch (newDispenseOrderStatus) {
        case DispenseOrderStatus.draft:
          newMedicationDispenseStatus = MedicationDispenseStatus.preparation;
          break;
        case DispenseOrderStatus.abandoned:
          newMedicationDispenseStatus = MedicationDispenseStatus.cancelled;
          break;
        case DispenseOrderStatus.entered_in_error:
          newMedicationDispenseStatus =
            MedicationDispenseStatus.entered_in_error;
          break;
        case DispenseOrderStatus.completed:
          newMedicationDispenseStatus = MedicationDispenseStatus.completed;
          break;
        default:
          newMedicationDispenseStatus = MedicationDispenseStatus.in_progress;
          break;
      }
      if (newDispenseOrderStatus !== DispenseOrderStatus.completed) {
        const updates: MedicationDispenseUpsert[] = medicationsDispenses.map(
          (dispense) => ({
            id: dispense.id,
            status: newMedicationDispenseStatus,
            category: MedicationDispenseCategory.outpatient,
            when_prepared: dispense.when_prepared,
            dosage_instruction: dispense.dosage_instruction,
          }),
        );
        requests.push({
          url: `/api/v1/medication/dispense/upsert/`,
          method: "POST",
          reference_id: `update_medication_dispenses`,
          body: { datapoints: updates },
        });
      } else if (newDispenseOrderStatus === DispenseOrderStatus.completed) {
        const updates: MedicationDispenseUpsert[] = medicationsDispenses.map(
          (dispense) => ({
            id: dispense.id,
            status: newMedicationDispenseStatus,
            category: MedicationDispenseCategory.outpatient,
            when_prepared: dispense.when_prepared,
            dosage_instruction: dispense.dosage_instruction,
          }),
        );
        requests.push({
          url: `/api/v1/medication/dispense/upsert/`,
          method: "POST",
          reference_id: `update_medication_dispenses`,
          body: { datapoints: updates },
        });
      }
    }

    updateDispenseOrder({ requests });
  };

  const filteredMedications = medications?.filter((med) => {
    if (paymentFilter === "paid")
      return med.charge_item?.paid_invoice?.status === InvoiceStatus.balanced;
    if (paymentFilter === "unpaid")
      return (
        !med.charge_item?.paid_invoice ||
        med.charge_item?.paid_invoice?.status === InvoiceStatus.issued ||
        med.charge_item?.paid_invoice?.status === InvoiceStatus.draft
      );
    return true;
  });

  // Group medications by time periods
  const groupedMedications = groupItemsByTime(filteredMedications || []);

  const billableItems = filteredMedications
    ?.filter((med) => {
      return med.charge_item?.status === ChargeItemStatus.billable;
    })
    .map((med) => med.charge_item);

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("medications_dispense")}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link
                  href={`/facility/${facilityId}/locations/${locationId}/medication_requests/?patient_external_id=${patient.id}&patient_name=${encodeURIComponent(patient.name || "")}`}
                  basePath="/"
                >
                  <PillIcon className="size-4" />
                  {t("prescriptions")}
                  <ShortcutBadge actionId="view-prescriptions" />
                </Link>
              </Button>
              {status === MedicationDispenseStatus.preparation &&
                billableItems &&
                billableItems.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBillableChargeItems(billableItems);
                      setCreateInvoiceSheetOpen(true);
                    }}
                  >
                    {t("bill_medication")}
                    <ShortcutBadge actionId="billing-action" />
                  </Button>
                )}
              <ViewDefaultAccountButton
                facilityId={facilityId}
                patientId={patient.id}
                disabled={isUpdatingDispenseOrder}
              />
              {(dispenseOrder.status === DispenseOrderStatus.draft ||
                dispenseOrder.status === DispenseOrderStatus.in_progress) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-400 px-2">
                      <CareIcon icon="l-ellipsis-v" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.values(DispenseOrderStatus)
                      .filter((status) => status !== dispenseOrder.status)
                      .filter(
                        (status) => status !== DispenseOrderStatus.completed,
                      )
                      .map((status) => (
                        <DropdownMenuItem asChild key={status}>
                          <Button
                            variant="ghost"
                            onClick={() => handleUpdateDispenseOrder(status)}
                            className="w-full flex flex-row justify-stretch items-center"
                            disabled={isUpdatingDispenseOrder}
                          >
                            {t(`mark_as_${status}`)}
                          </Button>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {(dispenseOrder.status === DispenseOrderStatus.draft ||
            dispenseOrder.status === DispenseOrderStatus.in_progress) && (
            <Button
              onClick={() =>
                handleUpdateDispenseOrder(DispenseOrderStatus.completed)
              }
              disabled={isUpdatingDispenseOrder}
            >
              {t("complete_dispense")}
              <ShortcutBadge actionId="dispense-button" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-row gap-4 mb-4">
        <Tabs
          value={paymentFilter}
          onValueChange={(value) =>
            setPaymentFilter(value as "paid" | "unpaid" | "all")
          }
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            <TabsTrigger value="paid">{t("paid")}</TabsTrigger>
            <TabsTrigger value="unpaid">{t("unpaid")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <MultiFilter
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onOperationChange={handleOperationChange}
          onClearAll={handleClearAll}
          onClearFilter={handleClearFilter}
          placeholder={t("filter")}
          facilityId={facilityId}
          className="flex-row flex-row-reverse"
          triggerButtonClassName="self-start sm:self-center"
          align="end"
        />
      </div>

      {!filteredMedications?.length ? (
        <EmptyState
          title={t("no_medications_found")}
          description={t("no_medications_found_description")}
          icon={<CareIcon icon="l-tablets" className="text-primary size-6" />}
        />
      ) : (
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Today */}
            {groupedMedications.today.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-800">
                  {t("today")}
                </h3>
                <MedicationTable
                  facilityId={facilityId}
                  medications={groupedMedications.today}
                />
              </div>
            )}

            {/* Yesterday */}
            {groupedMedications.yesterday.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-800">
                  {t("yesterday")}
                </h3>
                <MedicationTable
                  facilityId={facilityId}
                  medications={groupedMedications.yesterday}
                />
              </div>
            )}

            {/* This Week */}
            {groupedMedications.thisWeek.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-800">
                  {t("this_week")}
                </h3>
                <MedicationTable
                  facilityId={facilityId}
                  medications={groupedMedications.thisWeek}
                />
              </div>
            )}

            {/* This Month */}
            {groupedMedications.thisMonth.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-800">
                  {t("this_month")}
                </h3>
                <MedicationTable
                  facilityId={facilityId}
                  medications={groupedMedications.thisMonth}
                />
              </div>
            )}

            {/* This Year */}
            {groupedMedications.thisYear.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-800">
                  {t("this_year")}
                </h3>
                <MedicationTable
                  facilityId={facilityId}
                  medications={groupedMedications.thisYear}
                />
              </div>
            )}

            {/* Older */}
            {groupedMedications.older.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-800">
                  {t("older")}
                </h3>
                <MedicationTable
                  facilityId={facilityId}
                  medications={groupedMedications.older}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {account && account.results.length > 0 && (
        <CreateInvoiceSheet
          facilityId={facilityId}
          accountId={account.results[0].id}
          open={createInvoiceSheetOpen}
          onOpenChange={setCreateInvoiceSheetOpen}
          preSelectedChargeItems={billableChargeItems}
          sourceUrl={`/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}?status=preparation`}
          onSuccess={() => {
            setCreateInvoiceSheetOpen(false);
            setBillableChargeItems([]);
          }}
        />
      )}
    </div>
  );
}
