import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import DialogModal from "@/components/Common/Dialog";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import PrescriptionActivityTimeline from "@/components/Medicine/PrescriptionTimeline";

import dayjs from "@/Utils/dayjs";
import { classNames, formatDateTime } from "@/Utils/utils";
import { MedicationAdministration } from "@/types/emr/medicationAdministration";
import { MedicationRequest } from "@/types/emr/medicationRequest";

import { isMedicationDiscontinued } from "./utils";

interface Props {
  administrations: MedicationAdministration[];
  interval: { start: Date; end: Date };
  prescription: MedicationRequest;
  refetch: () => void;
  readonly?: boolean;
}

export default function AdministrationEventCell({
  administrations,
  interval: { start, end },
  prescription,
  refetch,
  readonly,
}: Props) {
  const [showTimeline, setShowTimeline] = useState(false);
  // Check if cell belongs to an administered prescription (including start and excluding end)
  const administered = administrations
    .filter((administration) =>
      dayjs(administration.occurrence_period_end).isBetween(
        start,
        end,
        null,
        "[)",
      ),
    )
    .sort(
      (a, b) =>
        new Date(a.occurrence_period_end!).getTime() -
        new Date(b.occurrence_period_end!).getTime(),
    );

  const hasComment = administered.some((obj) => !!obj.note);

  if (administered.length) {
    return (
      <>
        <DialogModal
          onClose={() => setShowTimeline(false)}
          title={
            <PrescriptionDetailCard prescription={prescription} readonly />
          }
          className="w-full md:max-w-4xl"
          show={showTimeline}
        >
          <div className="mt-6 text-sm font-medium text-secondary-700">
            Administrations on{" "}
            <span className="text-black">
              {formatDateTime(start, "DD/MM/YYYY")}
            </span>
          </div>
          <PrescriptionActivityTimeline
            interval={{ start, end }}
            prescription={prescription}
            showPrescriptionDetails
            onRefetch={refetch}
            readonly={readonly}
          />
        </DialogModal>
        <button
          id="administration-symbol"
          className="scale-100 transition-transform duration-200 ease-in-out hover:scale-110"
          onClick={() => setShowTimeline(true)}
        >
          <div className="relative mx-auto max-w-min">
            <CareIcon
              icon="l-check-circle"
              className="text-xl text-primary-500"
            />
            {administered.length > 1 && (
              <span className="absolute -bottom-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                {administered.length}
              </span>
            )}
          </div>
          {hasComment && (
            <CareIcon icon="l-notes" className="text-xl text-primary-500" />
          )}
        </button>
      </>
    );
  }

  // Check if cell belongs to after prescription.authored_on
  if (dayjs(start).isAfter(prescription.authored_on)) {
    return (
      <CareIcon icon="l-minus-circle" className="text-xl text-secondary-400" />
    );
  }

  // Check if cell belongs to a discontinued prescription
  if (
    isMedicationDiscontinued(prescription) &&
    dayjs(end).isAfter(prescription.status_changed)
  ) {
    if (!dayjs(prescription.status_changed).isBetween(start, end)) return;

    return (
      <div className="tooltip">
        <CareIcon
          icon="l-ban"
          className={classNames(
            "text-xl",
            dayjs(prescription.status_changed).isBetween(start, end)
              ? "text-danger-700"
              : "text-secondary-400",
          )}
        />
        <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
          <p>
            Discontinued on{" "}
            <strong>{formatDateTime(prescription.status_changed)}</strong>
          </p>
          <p>
            Reason:{" "}
            {prescription.status_reason ? (
              <strong>{prescription.status_reason}</strong>
            ) : (
              <span className="italic">Not specified</span>
            )}
          </p>
        </span>
      </div>
    );
  }
}
