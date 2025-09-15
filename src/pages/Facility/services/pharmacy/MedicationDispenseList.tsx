import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, MoreVertical, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import { FilterTabs } from "@/components/ui/filter-tabs";
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

import useFilters from "@/hooks/useFilters";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  MEDICATION_REQUEST_PRIORITY_COLORS,
  MEDICATION_REQUEST_STATUS,
  MEDICATION_REQUEST_STATUS_COLORS,
  MedicationPriority,
  MedicationRequestDispenseStatus,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { formatDateTime, formatName } from "@/Utils/utils";
import { cn } from "@/lib/utils";
import {
  GroupedPrescription,
  PRESCRIPTION_STATUS_STYLES,
  PrescriptionRead,
} from "@/types/emr/prescription/prescription";
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
            <TableHead className="text-gray-700">{t("priority")}</TableHead>
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
                  <Badge
                    variant={
                      MEDICATION_REQUEST_PRIORITY_COLORS[medication.priority]
                    }
                  >
                    {t(medication.priority)}
                  </Badge>
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
  partial?: boolean;
}

export default function MedicationDispenseList({
  facilityId,
  patientId,
  partial = false,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 100,
    disableCache: true,
  });
  const queryClient = useQueryClient();
  const [dispensedMedicationId, setDispensedMedicationId] = useState<
    string | null
  >(null);
  const [medicationToMarkComplete, setMedicationToMarkComplete] =
    useState<MedicationRequestRead | null>(null);
  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_requests", qParams, patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status || "active",
        priority: qParams.priority,
        dispense_status: partial ? "partial" : undefined,
        dispense_status_isnull: !partial ? true : undefined,
        ordering: "-created_date",
      },
    }),
  });

  const medications = response?.results || [];

  const groupedByPrescription = medications.reduce((acc, medication) => {
    const prescriptionId = medication.prescription?.id;
    if (prescriptionId && !acc[prescriptionId]) {
      acc[prescriptionId] = {
        requests: [],
        prescription: medication.prescription as PrescriptionRead,
      };
    }
    if (prescriptionId) {
      acc[prescriptionId].requests.push(medication);
    }
    return acc;
  }, {} as GroupedPrescription);

  const { mutate: updateMedicationRequest } = useMutation({
    mutationFn: (medication: MedicationRequestRead) => {
      return mutate(medicationRequestApi.update, {
        pathParams: { patientId, id: medication.id },
      })(medication);
    },
    onSuccess: () => {
      toast.success(t("medication_request_status_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["medication_requests", qParams, patientId],
      });
    },
    onError: () => {
      toast.error(t("something_went_wrong"));
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <FilterTabs
            className="overflow-x-auto w-full"
            value={qParams.status || "active"}
            onValueChange={(value) => updateQuery({ status: value })}
            options={Object.values(MEDICATION_REQUEST_STATUS)}
            showMoreDropdown={true}
            showAllOption={false}
            maxVisibleTabs={4}
            defaultVisibleOptions={[
              "active",
              "completed",
              "cancelled",
              "draft",
            ]}
          />
          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial sm:w-auto">
              <FilterSelect
                value={qParams.priority || ""}
                onValueChange={(value) => updateQuery({ priority: value })}
                options={Object.values(MedicationPriority)}
                label={t("priority")}
                onClear={() => updateQuery({ priority: undefined })}
              />
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-400 font-semibold"
              disabled={medications.length === 0}
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/print`,
                  {
                    query: {
                      status: qParams.status || "active",
                      priority: qParams.priority || "",
                      dispense_status: partial ? "partial" : "",
                      dispense_status_isnull: !partial,
                      type:
                        Object.keys(groupedByPrescription).length > 0
                          ? "pharmacy"
                          : "other",
                    },
                  },
                )
              }
            >
              <PrinterIcon className="size-4" />
              {t("print_prescriptions")}
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/bill`,
                )
              }
              className="w-full sm:w-auto"
            >
              {Object.keys(groupedByPrescription).length > 0
                ? t("start_billing")
                : t("add_new_medications")}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton count={5} />
      ) : medications.length === 0 ? (
        <EmptyState
          title={t("no_medications_found")}
          description={t("no_medications_found_description")}
          icon="l-tablets"
        />
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedByPrescription).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("pharmacy_medications")}
              </h2>

              <div className="space-y-6">
                {Object.keys(groupedByPrescription).map((prescriptionId) => (
                  <div key={prescriptionId}>
                    <div className="text-base flex justify-between font-medium text-gray-800 space-x-2 bg-white rounded-t border-gray-300">
                      <div className="flex items-center gap-2 px-2 py-1">
                        <span className="text-gray-900">
                          {t("prescription")}
                        </span>
                        <span className="text-gray-700">
                          {formatDateTime(
                            groupedByPrescription[prescriptionId].prescription
                              .created_date,
                          )}
                        </span>
                        <span className="text-gray-500">{t("by")}</span>
                        <span className="text-gray-900">
                          {formatName(
                            groupedByPrescription[prescriptionId].prescription
                              .prescribed_by,
                          )}
                        </span>
                      </div>
                      <div className="px-2 py-1">
                        <Badge
                          variant={
                            PRESCRIPTION_STATUS_STYLES[
                              groupedByPrescription[prescriptionId].prescription
                                .status
                            ]
                          }
                        >
                          {t(
                            groupedByPrescription[prescriptionId].prescription
                              .status,
                          )}
                        </Badge>
                      </div>
                    </div>
                    <MedicationTable
                      medications={
                        groupedByPrescription[prescriptionId].requests
                      }
                      setDispensedMedicationId={
                        partial ? setDispensedMedicationId : undefined
                      }
                      setMedicationToMarkComplete={
                        partial ? setMedicationToMarkComplete : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <Pagination totalCount={response?.count || 0} />
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
        cancelText={t("cancel")}
        variant="primary"
      />
    </div>
  );
}
