import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { FormattedDosage } from "@/components/Medicine/FormattedDosage";
import {
  formatDuration,
  formatFrequency,
  formatTotalUnits,
} from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { BillMedicationsLoadingCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsLoadingCard";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  displayMedicationName,
  MEDICATION_REQUEST_STATUS_COLORS,
  MedicationRequestDispenseStatus,
} from "@/types/emr/medicationRequest/medicationRequest";
import {
  PRESCRIPTION_STATUS_STYLES,
  PrescriptionRead,
  PrescriptionStatus,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { getLocationPath } from "@/types/location/utils";
import mutate from "@/Utils/request/mutate";
import { formatName } from "@/Utils/utils";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  FileTextIcon,
  MinusCircleIcon,
  Pill,
  PrinterIcon,
  XCircleIcon,
} from "lucide-react";
import { Link, navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Filters {
  medicationDispenseStatus?: MedicationRequestDispenseStatus | null;
  medicationSearch?: string;
}

interface Props {
  prescriptions: (PrescriptionRead | undefined)[];
  filters?: Filters;
  onPrescriptionStatusUpdate?: (
    prescription: PrescriptionRead,
    newStatus: PrescriptionStatus,
  ) => void;
}

export default function PrescriptionsPreviewTable({
  prescriptions,
  filters,
}: Props) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
      {prescriptions.map((prescription, index) => (
        <React.Fragment key={index}>
          {index !== 0 && <div className="col-span-5 h-8 bg-gray-50" />}
          {<PrescriptionCard prescription={prescription} filters={filters} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const PrescriptionCard = ({
  prescription,
  filters,
}: {
  filters?: Filters;
  prescription: PrescriptionRead | undefined;
}) => {
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updatePrescriptionStatus, isPending } = useMutation({
    mutationFn: ({
      prescription,
      newStatus,
    }: {
      prescription: PrescriptionRead;
      newStatus: PrescriptionStatus;
    }) => {
      const patientId = prescription.encounter.patient.id;
      const id = prescription.id;
      return mutate(prescriptionApi.update, {
        pathParams: { patientId, id },
        queryParams: { facility: prescription.encounter.facility.id },
      })({ ...prescription, status: newStatus });
    },
    onSuccess: (_, { prescription, newStatus }) => {
      queryClient.invalidateQueries({
        queryKey: [
          "prescription",
          prescription.encounter.patient.id,
          prescription.id,
        ],
      });

      if (newStatus === PrescriptionStatus.completed) {
        toast.success(t("prescription_marked_as_completed"));
      } else if (newStatus === PrescriptionStatus.cancelled) {
        toast.success(t("prescription_marked_as_cancelled"));
      }
    },
  });

  if (!prescription) {
    return <BillMedicationsLoadingCard />;
  }

  const encounter = prescription.encounter;
  const isActive = prescription.status === PrescriptionStatus.active;

  const medications = prescription.medications.filter((medication) => {
    const matchesSearch =
      !filters?.medicationSearch ||
      displayMedicationName(medication)
        .toLowerCase()
        .includes(filters.medicationSearch.toLowerCase());

    const matchesStatus =
      !filters?.medicationDispenseStatus ||
      medication.dispense_status === filters.medicationDispenseStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Header */}
      <div className="relative flex justify-between col-start-1 col-span-5 bg-white pt-4 pr-2 pb-2 pl-4">
        <div className="absolute top-5 left-0 h-4 w-1 bg-indigo-500 rounded-r-md" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-base text-gray-950">
              <span className="font-medium">{t("prescribed_by")} </span>
              <span className="font-semibold">
                {formatName(prescription.prescribed_by)}
              </span>
            </div>
            <div className="flex gap-2.5">
              <span className="text-sm font-medium text-gray-700">
                {format(prescription.created_date, "dd/MM/yyyy · hh:mm a")} (
                {t("items_count", { count: prescription.medications.length })})
              </span>
              <hr className="h-5 w-px bg-gray-300" />
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-950">
                  {t("location")}:{" "}
                </span>
                <span className="text-sm text-gray-700">
                  {encounter.current_location
                    ? getLocationPath(encounter.current_location)
                    : "-"}
                </span>
              </div>
            </div>
          </div>
          {prescription.note && (
            <span className="text-sm font-medium text-gray-700">
              {t("note")}: {prescription.note}
            </span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {/* Completed or cancelled badge */}
          {!isActive && (
            <Badge variant={PRESCRIPTION_STATUS_STYLES[prescription.status]}>
              {prescription.status === PrescriptionStatus.completed && (
                <CheckCircleIcon className="size-3" />
              )}
              {prescription.status === PrescriptionStatus.cancelled && (
                <MinusCircleIcon className="size-3" />
              )}
              {t(prescription.status)}
            </Badge>
          )}

          {/* Collapse button */}
          {/* Print button */}
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/prescription/${prescription.id}/print`}
              basePath="/"
            >
              <PrinterIcon />
            </Link>
          </Button>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <DotsVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!isActive || isPending}
                onSelect={() => {
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${encounter.patient.id}/bill/prescriptions/${prescription.id}`,
                  );
                }}
              >
                <FileTextIcon />
                {t("bill_prescription")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isPending}
                onSelect={() => {
                  navigate(
                    `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/prescription/${prescription.id}/print`,
                  );
                }}
              >
                <PrinterIcon />
                {t("print_prescription")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isActive || isPending}
                onSelect={() => {
                  updatePrescriptionStatus({
                    prescription,
                    newStatus: PrescriptionStatus.completed,
                  });
                }}
              >
                <CheckCircleIcon />
                {t("mark_as_completed")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isActive || isPending}
                onSelect={() => {
                  updatePrescriptionStatus({
                    prescription,
                    newStatus: PrescriptionStatus.cancelled,
                  });
                }}
                variant="destructive"
              >
                <XCircleIcon />
                {t("cancel_prescription")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Header Row */}
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("medicine")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("dose")} · {t("schedule")} · {t("duration")} / {t("instructions")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("total_to_dispense")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center justify-end">
        <span className="text-sm font-medium text-gray-700">
          {t("dispense_status")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">{t("status")}</span>
      </div>

      {/* Medications */}
      {medications.map((medication) => (
        <>
          <div className="col-start-1 bg-white py-2 px-3 flex items-center">
            <span className="text-base font-semibold text-gray-950">
              {displayMedicationName(medication)}
            </span>
          </div>

          <div className="bg-white py-2 px-3 flex flex-col items-start justify-center">
            <DosageInstructionList
              instructions={medication.dosage_instruction}
              gap="sm"
              itemClassName="text-sm font-medium text-gray-950 flex items-center gap-1 capitalize"
              renderItem={(di) => {
                const rest = [formatFrequency(di), formatDuration(di)]
                  .filter(Boolean)
                  .join(" × ");
                return (
                  <>
                    <FormattedDosage instruction={di} fallback="-" />
                    {rest && <span> × {rest}</span>}
                  </>
                );
              }}
            />
            {medication.note && (
              <span className="text-sm font-medium text-gray-700">
                {medication.note}
              </span>
            )}
          </div>

          <div className="bg-white py-2 px-3 flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {formatTotalUnits(medication.dosage_instruction, t("units"))}
            </span>
          </div>

          <div className="bg-white py-2 px-3 flex items-center">
            <Badge>
              {t(
                medication.dispense_status ||
                  MedicationRequestDispenseStatus.incomplete,
              )}
            </Badge>
          </div>

          <div className="bg-white py-2 px-3 flex items-center">
            <Badge
              variant={MEDICATION_REQUEST_STATUS_COLORS[medication.status]}
            >
              {t(medication.status)}
            </Badge>
          </div>
        </>
      ))}

      {medications.length === 0 && (
        <EmptyState
          className="col-span-5 rounded-none border-b border-gray-200"
          icon={<Pill className="text-primary size-6" />}
          title={t("no_medications")}
        />
      )}
    </>
  );
};
