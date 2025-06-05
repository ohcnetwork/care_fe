import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import ViewDefaultAccountButton from "@/pages/Facility/billing/account/ViewDefaultAccountButton";
import {
  MedicationDispenseCategory,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpdate,
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
  showCheckbox?: boolean;
}

function MedicationTable({
  medications,
  selectedMedications,
  onSelectionChange,
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
            {showCheckbox && <TableHead className="w-[50px]" />}
            <TableHead className="text-gray-700">{t("medicine")}</TableHead>
            <TableHead className="text-gray-700">{t("dosage")}</TableHead>
            <TableHead className="text-gray-700">{t("frequency")}</TableHead>
            <TableHead className="text-gray-700">{t("quantity")}</TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="text-gray-700">
              {t("prepared_date")}
            </TableHead>
            <TableHead className="text-gray-700">
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
            const shouldShowCheckbox = showCheckbox;

            return (
              <TableRow
                key={medication.id}
                className="hover:bg-gray-50 divide-x"
              >
                {shouldShowCheckbox && (
                  <TableCell className="text-gray-950 p-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-center p-2">
                            {shouldShowCheckbox && isPaid && (
                              <Checkbox
                                checked={selectedMedications.includes(
                                  medication.id,
                                )}
                                onCheckedChange={() =>
                                  onSelectionChange(medication.id)
                                }
                              />
                            )}
                          </span>
                        </TooltipTrigger>
                        {shouldShowCheckbox && !isPaid && (
                          <TooltipContent>
                            <p>{t("cannot_complete_unpaid_medication")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
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
                  {medication.charge_item.quantity || "-"}
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
                      variant="outline"
                      className={STATUS_COLORS[medication.status]}
                    >
                      {t(medication.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className={"text-gray-950"}>
                  {new Date(medication.when_prepared).toLocaleDateString()}
                </TableCell>
                <TableCell className={"text-gray-950"}>
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
  status?: MedicationDispenseStatus;
}

export default function DispensedMedicationList({
  facilityId,
  patientId,
  status,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<"paid" | "unpaid">("paid");
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 100,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_dispense", qParams, patientId, status],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: status ?? qParams.status,
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

  const filteredMedications = response?.results?.filter((med) => {
    if (paymentFilter === "paid") return med.charge_item.paid_invoice;
    if (paymentFilter === "unpaid") return !med.charge_item.paid_invoice;
    return true;
  });

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
        <Tabs
          value={paymentFilter}
          onValueChange={(value) =>
            setPaymentFilter(value as typeof paymentFilter)
          }
          className="w-full"
        >
          <TabsList>
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
          icon="l-tablets"
        />
      ) : (
        <div className="space-y-8">
          <div>
            <MedicationTable
              medications={filteredMedications}
              selectedMedications={selectedMedications}
              onSelectionChange={handleSelectionChange}
              showCheckbox={
                paymentFilter !== "unpaid" &&
                (status === MedicationDispenseStatus.preparation ||
                  status === MedicationDispenseStatus.in_progress)
              }
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
