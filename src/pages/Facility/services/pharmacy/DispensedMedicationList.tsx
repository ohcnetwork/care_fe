import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { groupItemsByTime } from "@/lib/time";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
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

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import ViewDefaultAccountButton from "@/pages/Facility/billing/account/ViewDefaultAccountButton";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseCategory,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpdate,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PillIcon } from "lucide-react";

interface MedicationTableProps {
  facilityId: string;
  medications: MedicationDispenseRead[];
  selectedMedications: string[];
  onSelectionChange: (id: string) => void;
  onSelectAll: () => void;
  showCheckbox?: boolean;
}

function MedicationTable({
  facilityId,
  medications,
  selectedMedications,
  onSelectionChange,
  onSelectAll,
  showCheckbox = true,
}: MedicationTableProps) {
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
    MedicationDispenseStatus.on_hold,
  ];

  return (
    <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
      <Table className="rounded-md">
        <TableHeader className="bg-gray-100 text-gray-700">
          <TableRow className="divide-x">
            {showCheckbox && (
              <TableHead className="w-[50px] pl-4">
                <Checkbox
                  checked={
                    selectedMedications.length === medications.length &&
                    medications.length > 0
                  }
                  onCheckedChange={onSelectAll}
                  className="mb-2 checked:mb-0"
                />
              </TableHead>
            )}
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
            const shouldShowCheckbox = showCheckbox;

            return (
              <TableRow
                key={medication.id}
                className="hover:bg-gray-50 divide-x"
              >
                {shouldShowCheckbox && (
                  <TableCell className="text-gray-950 p-0">
                    <span className="flex items-center justify-center p-2">
                      {shouldShowCheckbox && (
                        <Checkbox
                          checked={selectedMedications.includes(medication.id)}
                          onCheckedChange={() =>
                            onSelectionChange(medication.id)
                          }
                        />
                      )}
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-gray-950 font-semibold">
                  {medication.item.product.product_knowledge.name}
                </TableCell>
                <TableCell className={"text-gray-950"}>
                  {dosage ? `${dosage.value} ${dosage.unit.display}` : "-"}
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
                  {medication.quantity || "-"}
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
                        {Object.values(MedicationDispenseStatus)
                          .filter(
                            (status) =>
                              status !== MedicationDispenseStatus.completed,
                          )
                          .filter(
                            (status) =>
                              !(
                                medication.status ===
                                  MedicationDispenseStatus.in_progress &&
                                status === MedicationDispenseStatus.preparation
                              ),
                          )
                          .map((status) => {
                            return (
                              <SelectItem
                                key={status}
                                value={status.toString()}
                              >
                                {t(status)}
                              </SelectItem>
                            );
                          })}
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
                  <Badge variant={isPaid ? "green" : "destructive"}>
                    {isPaid ? t("paid") : t("unpaid")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {medication?.charge_item?.paid_invoice && (
                    <Button variant="link" asChild>
                      <Link
                        href={`/facility/${facilityId}/billing/invoices/${medication.charge_item.paid_invoice?.id}`}
                        basePath={`/`}
                        className="hover:text-primary underline underline-offset-2"
                        target="_blank"
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
  patientId: string;
  locationId: string;
  status?: MedicationDispenseStatus;
}

export default function DispensedMedicationList({
  facilityId,
  patientId,
  locationId,
  status,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const { qParams, Pagination, resultsPerPage, updateQuery } = useFilters({
    limit: 100,
    disableCache: true,
  });
  const paymentFilter = (qParams.payment_status as "paid" | "unpaid") || "all";
  const [billableChargeItems, setBillableChargeItems] = useState<
    ChargeItemRead[]
  >([]);
  const [createInvoiceSheetOpen, setCreateInvoiceSheetOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_dispense", patientId, qParams, status],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        location: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: status ?? qParams.status,
        patient: patientId,
      },
    }),
  });

  const { data: account } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
  });

  // set all medicines as selectedMedications
  useEffect(() => {
    if (response?.results) {
      setSelectedMedications(response.results.map((med) => med.id));
    }
  }, [response?.results]);

  const { mutate: completeMedications, isPending } = useMutation({
    mutationFn: async ({ signal }: { signal: AbortSignal }) => {
      if (!response?.results) return;

      const selectedDispenses = response.results.filter((med) =>
        selectedMedications.includes(med.id),
      );

      const updates: MedicationDispenseUpsert[] = selectedDispenses.map(
        (dispense) => ({
          id: dispense.id,
          status: MedicationDispenseStatus.completed,
          category: MedicationDispenseCategory.outpatient,
          when_prepared: dispense.when_prepared,
          dosage_instruction: dispense.dosage_instruction,
        }),
      );

      return query(medicationDispenseApi.upsert, {
        signal,
        body: { datapoints: updates },
      })({ signal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      setSelectedMedications([]);
      toast.success(t("medicine_dispensed"));
    },
  });

  const handleSelectionChange = (id: string) => {
    setSelectedMedications((prev) =>
      prev.includes(id)
        ? prev.filter((medicationId) => medicationId !== id)
        : [...prev, id],
    );
  };

  const filteredMedications = response?.results?.filter((med) => {
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

  const handleSelectAll = () => {
    const allMedicationIds = filteredMedications?.map((med) => med.id) || [];
    if (selectedMedications.length === allMedicationIds.length) {
      setSelectedMedications([]);
    } else {
      setSelectedMedications(allMedicationIds);
    }
  };

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
                  href={`/facility/${facilityId}/locations/${locationId}/medication_requests/?patient_external_id=${patientId}`}
                  basePath="/"
                >
                  <PillIcon className="size-4" />
                  {t("prescriptions")}
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
                  </Button>
                )}
              <ViewDefaultAccountButton
                facilityId={facilityId}
                patientId={patientId}
                disabled={isPending}
              />
            </div>
          </div>

          {selectedMedications.length > 0 && (
            <Button
              onClick={() =>
                completeMedications({ signal: new AbortController().signal })
              }
              disabled={isPending}
            >
              {t("complete_dispense")}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Tabs
          value={paymentFilter}
          onValueChange={(value) => updateQuery({ payment_status: value })}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            <TabsTrigger value="paid">{t("paid")}</TabsTrigger>
            <TabsTrigger value="unpaid">{t("unpaid")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <TableSkeleton count={5} />
      ) : !filteredMedications?.length ? (
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
                  selectedMedications={selectedMedications}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckbox={
                    status === MedicationDispenseStatus.preparation ||
                    status === MedicationDispenseStatus.in_progress
                  }
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
                  selectedMedications={selectedMedications}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckbox={
                    status === MedicationDispenseStatus.preparation ||
                    status === MedicationDispenseStatus.in_progress
                  }
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
                  selectedMedications={selectedMedications}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckbox={
                    status === MedicationDispenseStatus.preparation ||
                    status === MedicationDispenseStatus.in_progress
                  }
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
                  selectedMedications={selectedMedications}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckbox={
                    status === MedicationDispenseStatus.preparation ||
                    status === MedicationDispenseStatus.in_progress
                  }
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
                  selectedMedications={selectedMedications}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckbox={
                    status === MedicationDispenseStatus.preparation ||
                    status === MedicationDispenseStatus.in_progress
                  }
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
                  selectedMedications={selectedMedications}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                  showCheckbox={
                    status === MedicationDispenseStatus.preparation ||
                    status === MedicationDispenseStatus.in_progress
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <Pagination totalCount={response?.count || 0} />
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
          sourceUrl={`/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/preparation`}
          onSuccess={() => {
            setCreateInvoiceSheetOpen(false);
            setBillableChargeItems([]);
          }}
        />
      )}
    </div>
  );
}
