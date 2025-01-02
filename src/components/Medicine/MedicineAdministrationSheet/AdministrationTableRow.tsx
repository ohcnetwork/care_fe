import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import { Button } from "@/components/ui/button";

import DialogModal from "@/components/Common/Dialog";
import { useEncounter } from "@/components/Facility/ConsultationDetails/EncounterContext";
import AdministerMedicine from "@/components/Medicine/AdministerMedicine";
import AdministrationEventCell from "@/components/Medicine/MedicineAdministrationSheet/AdministrationEventCell";
import AdministrationEventSeperator from "@/components/Medicine/MedicineAdministrationSheet/AdministrationEventSeperator";
import { MedicationRequestItem } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import {
  classNames,
  displayCode,
  displayDoseRange,
  displayQuantity,
  displayTiming,
  formatDateTime,
} from "@/Utils/utils";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { Quantity } from "@/types/questionnaire/quantity";

import DiscontinueMedication from "../DiscontinueMedication";
import { isMedicationDiscontinued } from "./utils";

interface Props {
  prescription: MedicationRequest;
  intervals: { start: Date; end: Date }[];
  refetch: () => void;
  readonly: boolean;
  id: string;
}

export default function MedicineAdministrationTableRow({
  prescription,
  ...props
}: Props) {
  const { t } = useTranslation();
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();
  const [showDetails, setShowDetails] = useState(false);

  const medicationAdministrations = useTanStackQueryInstead(
    routes.medicationAdministration.list,
    {
      pathParams: { patientId: patient!.id },
      query: {
        encounter: encounterId,
        request: prescription.id,
        occurrence_period_end_after: formatDateTime(
          props.intervals[0].start,
          "YYYY-MM-DD",
        ),
        occurrence_period_end_before: formatDateTime(
          props.intervals[props.intervals.length - 1].end,
          "YYYY-MM-DD",
        ),
      },
    },
  );

  return (
    <>
      {showDetails && (
        <DialogModal
          title={t("prescription_details")}
          onClose={() => setShowDetails(false)}
          className="w-full md:max-w-4xl"
          show
        >
          <div className="mt-4 flex flex-col gap-4">
            <MedicationRequestItem medication={prescription} disabled />
            <div className="flex w-full flex-col items-center justify-end gap-2 md:flex-row">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDetails(false)}
              >
                {t("close")}
              </Button>
              <AuthorizedForConsultationRelatedActions>
                {!props.readonly && (
                  <>
                    <DiscontinueMedication
                      prescription={prescription}
                      onClose={(success) => {
                        if (success) {
                          props.refetch();
                        }
                      }}
                    />
                    <AdministerMedicine
                      prescription={prescription}
                      onClose={(success) => {
                        if (success) {
                          props.refetch();
                        }
                      }}
                    />
                  </>
                )}
              </AuthorizedForConsultationRelatedActions>
            </div>
          </div>
        </DialogModal>
      )}
      <tr
        className={classNames(
          "group transition-all duration-200 ease-in-out",
          medicationAdministrations.loading
            ? "bg-secondary-300"
            : "bg-white hover:bg-primary-100",
        )}
        id={props.id}
      >
        <td
          className="bg-secondary-white sticky left-0 z-10 cursor-pointer bg-white py-3 pl-4 text-left transition-all duration-200 ease-in-out group-hover:bg-primary-100"
          onClick={() => setShowDetails(true)}
        >
          <div className="flex flex-col gap-1 lg:flex-row lg:justify-between lg:gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={classNames(
                    "text-sm font-semibold uppercase",
                    isMedicationDiscontinued(prescription)
                      ? "text-secondary-700"
                      : "text-secondary-900",
                  )}
                >
                  {displayCode(prescription.medication)}
                </span>

                {isMedicationDiscontinued(prescription) && (
                  <span className="hidden rounded-full border border-secondary-500 bg-secondary-200 px-1.5 text-xs font-medium text-secondary-700 lg:block">
                    {t("discontinued")}
                  </span>
                )}

                {prescription.dosage_instruction[0].route && (
                  <span className="hidden rounded-full border border-blue-500 bg-blue-100 px-1.5 text-xs font-medium text-blue-700 lg:block">
                    {displayCode(prescription.dosage_instruction[0].route)}
                  </span>
                )}
              </div>
            </div>
            <div className="block lg:hidden">
              <DosageFrequencyInfo prescription={prescription} />
            </div>
          </div>
        </td>
        <td className="hidden lg:table-cell">
          <DosageFrequencyInfo prescription={prescription} />
        </td>

        <td />

        {/* Administration Cells */}
        {props.intervals.map(({ start, end }, index) => (
          <>
            <td key={`event-seperator-${index}`}>
              <AdministrationEventSeperator date={start} />
            </td>

            <td key={`event-socket-${index}`} className="text-center">
              {!medicationAdministrations.data?.results ? (
                <CareIcon
                  icon="l-spinner"
                  className="animate-spin text-lg text-secondary-500"
                />
              ) : (
                <AdministrationEventCell
                  administrations={medicationAdministrations.data.results}
                  interval={{ start, end }}
                  prescription={prescription}
                  refetch={medicationAdministrations.refetch}
                  readonly={props.readonly}
                />
              )}
            </td>
          </>
        ))}
        <td />

        {/* Action Buttons */}
        <td className="space-x-1 pr-2 text-right">
          <AuthorizedForConsultationRelatedActions>
            {!props.readonly && (
              <AdministerMedicine
                prescription={prescription}
                onClose={(success) => {
                  if (success) {
                    props.refetch();
                  }
                }}
              />
            )}
          </AuthorizedForConsultationRelatedActions>
        </td>
      </tr>
    </>
  );
}

type DosageFrequencyInfoProps = {
  prescription: MedicationRequest;
};

export function DosageFrequencyInfo({
  prescription,
}: DosageFrequencyInfoProps) {
  const dosageInstruction = prescription.dosage_instruction[0];

  return (
    <div className="flex justify-center">
      <div className="flex gap-1 text-xs font-semibold text-secondary-900 lg:flex-col lg:px-2 lg:text-center">
        {dosageInstruction.dose_and_rate?.dose_quantity && (
          <p>
            {displayQuantity(
              dosageInstruction.dose_and_rate?.dose_quantity as Quantity,
            )}
          </p>
        )}

        {dosageInstruction.dose_and_rate?.dose_range && (
          <p>{displayDoseRange(dosageInstruction.dose_and_rate?.dose_range)}</p>
        )}

        <p className="max-w-[6rem] truncate">
          {dosageInstruction.as_needed_boolean
            ? displayCode(dosageInstruction.as_needed_for)
            : displayTiming(dosageInstruction.timing)}
        </p>
      </div>
    </div>
  );
}
