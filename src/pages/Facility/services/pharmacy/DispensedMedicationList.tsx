import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectItem } from "@/components/ui/select";
import { Select } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsTrigger } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { Tabs } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import ViewDefaultAccountButton from "@/pages/Facility/billing/account/ViewDefaultAccountButton";
import { ChargeItemStatus } from "@/types/billing/chargeItem/chargeItem";
import {
  MedicationDispenseCategory,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpsert,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

const STATUS_COLORS: Record<string, string> = {
  preparation: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
  completed: "bg-green-100 text-green-700",
  entered_in_error: "bg-red-100 text-red-700",
  stopped: "bg-purple-100 text-purple-700",
  declined: "bg-gray-100 text-gray-700",
};

interface MedicationTableProps {
  medications: MedicationDispenseRead[];
  selectedMedications: string[];
  onSelectionChange: (id: string) => void;
}

function MedicationTable({
  medications,
  selectedMedications,
  onSelectionChange,
}: MedicationTableProps) {
  const { t } = useTranslation();

  const tableHeadClass =
    "border-x p-3 text-gray-700 text-sm font-medium leading-5";
  const tableCellClass = "border-x p-3 text-gray-950";

  return (
    <div className="rounded-md border shadow-sm w-full bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="border-b">
            <TableHead className={cn(tableHeadClass, "w-[50px]")} />
            <TableHead className={tableHeadClass}>{t("medicine")}</TableHead>
            <TableHead className={tableHeadClass}>{t("dosage")}</TableHead>
            <TableHead className={tableHeadClass}>{t("frequency")}</TableHead>
            <TableHead className={tableHeadClass}>{t("status")}</TableHead>
            <TableHead className={tableHeadClass}>
              {t("prepared_date")}
            </TableHead>
            <TableHead className={tableHeadClass}>
              {t("payment_status")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {medications.map((medication) => {
            const instruction = medication.dosage_instruction[0] ?? {};
            const frequency = instruction?.timing?.code;
            const dosage = instruction?.dose_and_rate?.dose_quantity;
            const isPaid = medication.charge_item.paid_invoice;
            const showCheckbox =
              medication.status === MedicationDispenseStatus.preparation ||
              medication.status === MedicationDispenseStatus.in_progress;

            return (
              <TableRow
                key={medication.id}
                className="border-b hover:bg-gray-50"
              >
                <TableCell className={tableCellClass}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {showCheckbox && (
                            <Checkbox
                              checked={selectedMedications.includes(
                                medication.id,
                              )}
                              onCheckedChange={() =>
                                onSelectionChange(medication.id)
                              }
                              disabled={!isPaid}
                              className={
                                !isPaid ? "cursor-not-allowed opacity-50" : ""
                              }
                            />
                          )}
                        </span>
                      </TooltipTrigger>
                      {!isPaid && (
                        <TooltipContent>
                          <p>{t("cannot_complete_unpaid_medication")}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className={cn(tableCellClass, "font-medium")}>
                  {medication.item.product.product_knowledge.name}
                </TableCell>
                <TableCell className={tableCellClass}>
                  {dosage ? `${dosage.value} ${dosage.unit.display}` : "-"}
                </TableCell>
                <TableCell className={tableCellClass}>
                  {instruction?.as_needed_boolean
                    ? `${t("as_needed_prn")} ${
                        instruction?.as_needed_for?.display
                          ? `(${instruction.as_needed_for.display})`
                          : ""
                      }`
                    : frequency?.display || "-"}
                </TableCell>
                <TableCell className={tableCellClass}>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[medication.status]}
                  >
                    {t(medication.status)}
                  </Badge>
                </TableCell>
                <TableCell className={tableCellClass}>
                  {new Date(medication.when_prepared).toLocaleDateString()}
                </TableCell>
                <TableCell className={tableCellClass}>
                  <Badge
                    variant={isPaid ? "outline" : "destructive"}
                    className={isPaid ? "bg-green-100 text-green-700" : ""}
                  >
                    {isPaid ? t("paid") : t("unpaid")}
                  </Badge>
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
}

export default function DispensedMedicationList({
  facilityId,
  patientId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 100,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_dispense", qParams, patientId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        patient: patientId,
      },
    }),
  });

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

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("medications_dispense")}
            </h1>
            <ViewDefaultAccountButton
              facilityId={facilityId}
              patientId={patientId}
              disabled={isPending}
            />
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
        {/* Desktop Tabs */}
        {/* Todo: Use extracted FilterTabs component */}
        <Tabs
          value={qParams.status ?? "all"}
          onValueChange={(value) =>
            updateQuery({
              status: value === "all" ? undefined : value,
            })
          }
          className="max-sm:hidden"
        >
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            {Object.values(MedicationDispenseStatus).map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(status)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {/* Mobile Select */}
        {/* Todo: Use extracted FilterSelect component */}
        <Select
          value={qParams.status ?? "all"}
          onValueChange={(value) =>
            updateQuery({
              status: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="sm:hidden w-full">
            <SelectValue placeholder={t("filter_by_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {Object.values(ChargeItemStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton count={5} />
      ) : !response?.results?.length ? (
        <EmptyState
          title={t("no_medications_found")}
          description={t("no_medications_found_description")}
          icon="l-tablets"
        />
      ) : (
        <div className="space-y-8">
          <div>
            <MedicationTable
              medications={response.results}
              selectedMedications={selectedMedications}
              onSelectionChange={handleSelectionChange}
            />
          </div>

          <div className="mt-4">
            <Pagination totalCount={response?.count || 0} />
          </div>
        </div>
      )}
    </div>
  );
}
