import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  MoreVertical,
  PrinterIcon,
  User as UserIcon,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

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
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { formatDoseRange, formatTotalUnits } from "@/components/Medicine/utils";

import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  MEDICATION_REQUEST_STATUS_COLORS,
  MedicationRequestDispenseStatus,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { formatDateTime, formatName } from "@/Utils/utils";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { cn } from "@/lib/utils";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import {
  PRESCRIPTION_STATUS_STYLES,
  PrescriptionRead,
  PrescriptionStatus,
} from "@/types/emr/prescription/prescription";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DispensedItemsSheet } from "./MedicationBillForm";

interface MedicationTableProps {
  medications: MedicationRequestRead[];
  setDispensedMedicationId?: (id: string) => void;
  setMedicationToMarkComplete?: (medication: MedicationRequestRead) => void;
}

function MedicationTable({
  medications,
  setDispensedMedicationId,
  setMedicationToMarkComplete,
}: MedicationTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
      <Table className="rounded-md">
        <TableHeader className=" bg-gray-100 text-gray-700">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("medicine")}</TableHead>
            <TableHead className="text-gray-700">{t("dosage")}</TableHead>
            <TableHead className="text-gray-700">{t("frequency")}</TableHead>
            <TableHead className="text-gray-700">{t("duration")}</TableHead>
            <TableHead className="text-gray-700">{t("total_units")}</TableHead>
            <TableHead className="text-gray-700">
              {t("dispense_status")}
            </TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            {medications.some(
              (medication) =>
                medication.dispense_status ===
                MedicationRequestDispenseStatus.partial,
            ) && (
              <TableHead className="text-gray-700 w-10">
                {t("actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {medications.map((medication: MedicationRequestRead) => {
            const instruction = medication.dosage_instruction[0];
            const frequency = instruction?.timing?.code;
            const duration = instruction?.timing?.repeat?.bounds_duration;
            const dosage = instruction?.dose_and_rate?.dose_quantity;

            return (
              <TableRow
                key={medication.id}
                className={cn(
                  "hover:bg-gray-50 divide-x",
                  medication.requested_product
                    ? "hover:bg-gray-50"
                    : "bg-gray-200",
                )}
              >
                <TableCell className="font-semibold text-gray-950 flex items-center gap-2">
                  {displayMedicationName(medication)}
                  {medication?.dispense_status ===
                    MedicationRequestDispenseStatus.partial && (
                    <Button
                      variant="secondary"
                      type="button"
                      size="xs"
                      className="flex gap-1"
                      onClick={() => {
                        setDispensedMedicationId?.(medication.id);
                      }}
                    >
                      <CareIcon icon="l-eye" className="size-4" />
                      {t("view_dispensed")}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {dosage
                    ? `${dosage.value} ${dosage.unit.display}`
                    : formatDoseRange(instruction?.dose_and_rate?.dose_range)}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {instruction?.as_needed_boolean
                    ? `${t("as_needed_prn")} ${
                        instruction?.as_needed_for?.display
                          ? `(${instruction.as_needed_for.display})`
                          : ""
                      }`
                    : frequency?.display || "-"}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {duration ? `${duration.value} ${duration.unit}` : "-"}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {formatTotalUnits(medication.dosage_instruction, t("units"))}
                </TableCell>
                <TableCell>
                  <Badge>{t(medication.dispense_status || "pending")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      MEDICATION_REQUEST_STATUS_COLORS[medication.status]
                    }
                  >
                    {t(medication.status)}
                  </Badge>
                </TableCell>
                {medication?.dispense_status ===
                  MedicationRequestDispenseStatus.partial && (
                  <TableCell className="w-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setMedicationToMarkComplete?.(medication);
                          }}
                        >
                          {t("mark_as_already_given")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
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
  prescriptionId: string;
}

export default function MedicationDispenseList({
  facilityId,
  patientId,
  prescriptionId,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();
  useShortcutSubContext("facility:pharmacy");
  const queryClient = useQueryClient();
  const [dispensedMedicationId, setDispensedMedicationId] = useState<
    string | null
  >(null);
  const [medicationToMarkComplete, setMedicationToMarkComplete] =
    useState<MedicationRequestRead | null>(null);
  const [prescriptionToUpdate, setPrescriptionToUpdate] = useState<{
    prescription: PrescriptionRead;
    newStatus: PrescriptionStatus;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dispenseFilter, setDispenseFilter] = useState<
    "all" | keyof typeof MedicationRequestDispenseStatus
  >("all");
  const [groupByDispense, setGroupByDispense] = useState(true);

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId },
      queryParams: { facility: facilityId },
    }),
  });

  const { mutate: updateMedicationRequest } = useMutation({
    mutationFn: (medication: MedicationRequestRead) => {
      return mutate(medicationRequestApi.update, {
        pathParams: { patientId, id: medication.id },
      })(medication);
    },
    onSuccess: () => {
      toast.success(t("medication_request_status_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["medication_requests", patientId],
      });
    },
    onError: () => {
      toast.error(t("something_went_wrong"));
    },
  });

  const { mutate: updatePrescriptionStatus } = useMutation({
    mutationFn: ({
      prescription,
      newStatus,
    }: {
      prescription: PrescriptionRead;
      newStatus: PrescriptionStatus;
    }) => {
      return mutate(prescriptionApi.update, {
        pathParams: { patientId, id: prescription.id },
        queryParams: { facility: facilityId },
      })({ ...prescription, status: newStatus });
    },
    onSuccess: () => {
      toast.success(t("prescription_status_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["prescription", patientId, prescriptionId],
      });
    },
    onError: () => {
      toast.error(t("something_went_wrong"));
    },
  });

  if (!prescription || isLoading) {
    return <TableSkeleton count={5} />;
  }

  const allMedications = prescription.medications;

  const countsInit = {
    total: allMedications.length,
    pending: 0,
    partial: 0,
    complete: 0,
  };
  for (const med of allMedications) {
    const key = (med.dispense_status || "pending") as
      | "pending"
      | "partial"
      | "complete";
    countsInit[key] += 1;
  }
  const dispenseCounts = countsInit;

  const term = searchTerm.trim().toLowerCase();
  const filteredMedications = [...allMedications]
    .filter((m) => {
      const name = displayMedicationName(m).toLowerCase();
      return !term || name.includes(term);
    })
    .filter(
      (m) =>
        dispenseFilter === "all" ||
        (m.dispense_status || "pending") === dispenseFilter,
    )
    .sort((a, b) =>
      displayMedicationName(a).localeCompare(displayMedicationName(b)),
    );

  const groupedByDispense: Record<
    "pending" | "partial" | "complete",
    MedicationRequestRead[]
  > = {
    pending: [],
    partial: [],
    complete: [],
  };
  for (const m of filteredMedications) {
    const key = (m.dispense_status || "pending") as
      | "pending"
      | "partial"
      | "complete";
    groupedByDispense[key]?.push(m);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col lg:flex-row items-stretch gap-2 w-full">
            <div className="w-full lg:w-64">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("search") as string}
              />
            </div>
            <div className="md:flex gap-2">
              <FilterSelect
                value={dispenseFilter}
                onValueChange={(value) =>
                  setDispenseFilter(
                    (value as
                      | "all"
                      | keyof typeof MedicationRequestDispenseStatus) ?? "all",
                  )
                }
                options={["all", "pending", "partial", "complete"]}
                label={t("dispense_status") as string}
                onClear={() => setDispenseFilter("all")}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="group-by" className="text-sm text-gray-700">
                {t("group_by")}: {t("dispense_status")}
              </Label>
              <Switch
                id="group-by"
                checked={groupByDispense}
                onCheckedChange={setGroupByDispense}
              />
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              asChild
              className="w-full sm:w-auto border-gray-400 font-semibold"
              data-shortcut-id="dispense-button"
            >
              <Link
                href={`/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/preparation`}
                basePath="/"
              >
                {t("dispenses")}
                <ShortcutBadge actionId="dispense-button" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-400 font-semibold"
              disabled={prescription.medications.length === 0}
              data-shortcut-id="print-button"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/patient/${patientId}/prescription/${prescriptionId}/print`,
                )
              }
            >
              <PrinterIcon className="size-4" />
              {t("print")}
              <ShortcutBadge actionId="print-button" />
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/bill`,
                )
              }
              className="w-full sm:w-auto"
              data-shortcut-id="billing-action"
            >
              <ShortcutBadge actionId="billing-action" />
              {t("billing")}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {prescription.medications.length === 0 ? (
        <EmptyState
          title={t("no_medications_found")}
          description={t("no_medications_found_description")}
          icon={<CareIcon icon="l-tablets" className="text-primary size-6" />}
        />
      ) : (
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="bg-white border rounded-md p-1">
              <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <UserIcon className="size-4 text-gray-600" />
                    <span className="text-gray-900">
                      {formatName(prescription.prescribed_by)}
                    </span>
                    <span className="text-gray-500">{t("on")}</span>
                    <span className="text-gray-900">
                      {formatDateTime(prescription.created_date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={PRESCRIPTION_STATUS_STYLES[prescription.status]}
                  >
                    {t("status")}: {t(prescription.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-gray-300 shadow-none"
                        size="icon"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {prescription.status === PrescriptionStatus.active && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setPrescriptionToUpdate({
                              prescription,
                              newStatus: PrescriptionStatus.completed,
                            });
                          }}
                        >
                          {t("mark_as_completed")}
                        </DropdownMenuItem>
                      )}
                      {prescription.status === PrescriptionStatus.active && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setPrescriptionToUpdate({
                              prescription,
                              newStatus: PrescriptionStatus.cancelled,
                            });
                          }}
                        >
                          {t("cancel_prescription")}
                        </DropdownMenuItem>
                      )}
                      {(prescription.status === PrescriptionStatus.completed ||
                        prescription.status ===
                          PrescriptionStatus.cancelled) && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setPrescriptionToUpdate({
                              prescription,
                              newStatus: PrescriptionStatus.active,
                            });
                          }}
                        >
                          {t("reactivate_prescription")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span>
                  {t("total")}: {dispenseCounts.total} • {t("complete")}:{" "}
                  {dispenseCounts.complete} • {t("partial")}:{" "}
                  {dispenseCounts.partial} • {t("pending")}:{" "}
                  {dispenseCounts.pending}
                </span>
              </div>
            </div>

            {groupByDispense ? (
              <div className="space-y-6">
                {(["pending", "partial", "complete"] as const).map((key) =>
                  groupedByDispense[key].length > 0 ? (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">
                          {t(key)} ({groupedByDispense[key].length})
                        </h3>
                      </div>
                      <MedicationTable
                        medications={groupedByDispense[key]}
                        setDispensedMedicationId={
                          prescription.status === PrescriptionStatus.active
                            ? setDispensedMedicationId
                            : undefined
                        }
                        setMedicationToMarkComplete={
                          prescription.status === PrescriptionStatus.active
                            ? setMedicationToMarkComplete
                            : undefined
                        }
                      />
                    </div>
                  ) : null,
                )}
                {filteredMedications.length === 0 && (
                  <EmptyState
                    title={t("no_results")}
                    description={t("try_adjusting_your_filters")}
                    icon={
                      <CareIcon
                        icon="l-search"
                        className="text-primary size-6"
                      />
                    }
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("pharmacy_medications")}
                </h2>
                <MedicationTable
                  medications={filteredMedications}
                  setDispensedMedicationId={
                    prescription.status === PrescriptionStatus.active
                      ? setDispensedMedicationId
                      : undefined
                  }
                  setMedicationToMarkComplete={
                    prescription.status === PrescriptionStatus.active
                      ? setMedicationToMarkComplete
                      : undefined
                  }
                />
                {filteredMedications.length === 0 && (
                  <EmptyState
                    title={t("no_results")}
                    description={t("try_adjusting_your_filters")}
                    icon={
                      <CareIcon
                        icon="l-search"
                        className="text-primary size-6"
                      />
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {dispensedMedicationId && (
        <DispensedItemsSheet
          open={!!dispensedMedicationId}
          onOpenChange={(open) => {
            if (!open) {
              setDispensedMedicationId(null);
            }
          }}
          medicationRequestId={dispensedMedicationId}
          facilityId={facilityId}
        />
      )}
      <ConfirmActionDialog
        open={medicationToMarkComplete !== null}
        onOpenChange={(open) => {
          if (!open) setMedicationToMarkComplete(null);
        }}
        title={t("mark_as_already_given")}
        description={
          <>
            <Trans
              i18nKey="confirm_action_description"
              values={{
                action: t("mark_as_already_given").toLowerCase(),
              }}
              components={{
                1: <strong className="text-gray-900" />,
              }}
            />{" "}
            {t("you_cannot_change_once_submitted")}
            <p className="mt-2">
              {t("medication")}:{" "}
              <strong>
                {medicationToMarkComplete?.requested_product?.name}
              </strong>
            </p>
          </>
        }
        onConfirm={() => {
          if (medicationToMarkComplete) {
            updateMedicationRequest({
              ...medicationToMarkComplete,
              dispense_status: MedicationRequestDispenseStatus.complete,
            });
          }
          setMedicationToMarkComplete(null);
        }}
        confirmText={t("mark_as_already_given")}
      />
      <ConfirmActionDialog
        open={prescriptionToUpdate !== null}
        onOpenChange={(open) => {
          if (!open) setPrescriptionToUpdate(null);
        }}
        title={t("update_status")}
        description={
          <>
            <Trans
              i18nKey="confirm_action_description"
              values={{
                action: t("change_status").toLowerCase(),
              }}
              components={{
                1: <strong className="text-gray-900" />,
              }}
            />{" "}
            {t("you_cannot_change_once_submitted")}
            <p className="mt-2">
              {t("prescription")}:{" "}
              <strong>
                {prescriptionToUpdate?.prescription?.name || t("prescription")}
              </strong>
            </p>
            <p className="mt-1">
              {t("new_status")}:{" "}
              <strong>{t(prescriptionToUpdate?.newStatus || "")}</strong>
            </p>
          </>
        }
        onConfirm={() => {
          if (prescriptionToUpdate) {
            updatePrescriptionStatus(prescriptionToUpdate);
          }
          setPrescriptionToUpdate(null);
        }}
        confirmText={t("update_status")}
        cancelText={t("cancel")}
        variant="primary"
      />
    </div>
  );
}
