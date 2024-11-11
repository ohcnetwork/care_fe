import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import DialogModal from "@/components/Common/Dialog";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import PrescrpitionActivityTimeline from "@/components/Medicine/PrescrpitionTimeline";
import {
  MedicineAdministrationRecord,
  Prescription,
} from "@/components/Medicine/models";

import dayjs from "@/Utils/dayjs";
import { classNames, formatDateTime } from "@/Utils/utils";

interface Props {
  administrations: MedicineAdministrationRecord[];
  interval: { start: Date; end: Date };
  prescription: Prescription;
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
      dayjs(administration.administered_date).isBetween(start, end, null, "[)"),
    )
    .sort(
      (a, b) =>
        new Date(a.administered_date!).getTime() -
        new Date(b.administered_date!).getTime(),
    );

  const hasComment = administered.some((obj) => !!obj.notes);

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
          <PrescrpitionActivityTimeline
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

  // Check if cell belongs to after prescription.created_date
  if (dayjs(start).isAfter(prescription.created_date)) {
    return (
      <CareIcon icon="l-minus-circle" className="text-xl text-secondary-400" />
    );
  }

  // Check if cell belongs to a discontinued prescription
  if (
    prescription.discontinued &&
    dayjs(end).isAfter(prescription.discontinued_date)
  ) {
    if (!dayjs(prescription.discontinued_date).isBetween(start, end)) return;

    return (
      <div className="tooltip">
        <CareIcon
          icon="l-ban"
          className={classNames(
            "text-xl",
            dayjs(prescription.discontinued_date).isBetween(start, end)
              ? "text-danger-700"
              : "text-secondary-400",
          )}
        />
        <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
          <p>
            Discontinued on{" "}
            <strong>{formatDateTime(prescription.discontinued_date)}</strong>
          </p>
          <p>
            Reason:{" "}
            {prescription.discontinued_reason ? (
              <strong>{prescription.discontinued_reason}</strong>
            ) : (
              <span className="italic">Not specified</span>
            )}
          </p>
        </span>
      </div>
    );
  }
}
