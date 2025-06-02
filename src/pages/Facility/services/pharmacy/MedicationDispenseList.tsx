import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  ACTIVE_MEDICATION_STATUSES,
  INACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_PRIORITY_COLORS,
  MEDICATION_REQUEST_STATUS_COLORS,
  MedicationPriority,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

interface MedicationTableProps {
  medications: MedicationRequestRead[];
}

function MedicationTable({ medications }: MedicationTableProps) {
  const { t } = useTranslation();

  const tableHeadClass =
    "border-x p-3 text-gray-700 text-sm font-medium leading-5";
  const tableCellClass = "border-x p-3 text-gray-950";

  return (
    <div className="rounded-md border shadow-sm w-full bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="border-b">
            <TableHead className={tableHeadClass}>{t("medicine")}</TableHead>
            <TableHead className={tableHeadClass}>{t("dosage")}</TableHead>
            <TableHead className={tableHeadClass}>{t("frequency")}</TableHead>
            <TableHead className={tableHeadClass}>{t("duration")}</TableHead>
            <TableHead className={tableHeadClass}>{t("priority")}</TableHead>
            <TableHead className={tableHeadClass}>{t("status")}</TableHead>
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
                className="border-b hover:bg-gray-50"
              >
                <TableCell className={cn(tableCellClass, "font-medium")}>
                  {displayMedicationName(medication)}
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
                  {duration ? `${duration.value} ${duration.unit}` : "-"}
                </TableCell>
                <TableCell className={tableCellClass}>
                  <Badge
                    variant="outline"
                    className={
                      MEDICATION_REQUEST_PRIORITY_COLORS[medication.priority]
                    }
                  >
                    {t(medication.priority)}
                  </Badge>
                </TableCell>
                <TableCell className={tableCellClass}>
                  <Badge
                    variant="outline"
                    className={
                      MEDICATION_REQUEST_STATUS_COLORS[medication.status]
                    }
                  >
                    {t(medication.status)}
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

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_requests", qParams, patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        priority: qParams.priority,
        dispense_status: partial ? "partial" : undefined,
        dispense_status_isnull: !partial ? true : undefined,
      },
    }),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  const medications = response?.results || [];
  const medicationsWithProduct = medications.filter(
    (med) => med.requested_product,
  );
  const otherMedications = medications.filter((med) => !med.requested_product);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <FilterTabs
            value={qParams.priority || ""}
            onValueChange={(value) =>
              updateQuery({ priority: value || undefined })
            }
            options={Object.values(MedicationPriority)}
            allOptionLabel={t("all_priorities")}
          />
          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial sm:w-auto">
              <FilterSelect
                value={qParams.status || ""}
                onValueChange={(value) => updateQuery({ status: value })}
                options={[
                  ...ACTIVE_MEDICATION_STATUSES,
                  ...INACTIVE_MEDICATION_STATUSES,
                ]}
                label="status"
                onClear={() => updateQuery({ status: undefined })}
              />
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-gray-400 font-semibold"
                >
                  <PrinterIcon className="size-4" />
                  {t("print_prescriptions")}
                </Button>
              </DialogTrigger>
              <DialogContent className="md:max-w-4xl max-h-screen overflow-auto">
                {patient && medications.length > 0 && (
                  <PrescriptionPreview
                    medications={medications}
                    patient={patient}
                  />
                )}
              </DialogContent>
            </Dialog>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/bill`,
                )
              }
              className="w-full sm:w-auto"
            >
              {t("start_billing")}
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
          {medicationsWithProduct.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("pharmacy_medications")}
              </h2>
              <MedicationTable medications={medicationsWithProduct} />
            </div>
          )}

          {!partial && otherMedications.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("other_medications")}
              </h2>
              <MedicationTable medications={otherMedications} />
            </div>
          )}
          <div className="mt-4">
            <Pagination totalCount={response?.count || 0} />
          </div>
        </div>
      )}
    </div>
  );
}
