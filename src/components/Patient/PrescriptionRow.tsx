import dayjs from "dayjs";
import { ChevronRight } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  PatientBadge,
  type PatientBadgeTone,
} from "@/components/Patient/PatientBadge";

import { formatName } from "@/Utils/utils";
import {
  PrescriptionStatus,
  PrescritionList,
} from "@/types/emr/prescription/prescription";

export const PRESCRIPTION_TONES = {
  active: "success",
  completed: "neutral",
  cancelled: "danger",
} as const satisfies Record<PrescriptionStatus, PatientBadgeTone>;

/**
 * One prescription in a list — shared by the records hub and the home preview
 * so the same record does not describe itself two different ways.
 *
 * The list payload carries no medicines (those arrive with the detail request),
 * so the row identifies a prescription by who wrote it, when, and where.
 */
export function PrescriptionRow({
  prescription,
  className,
}: {
  prescription: PrescritionList;
  className?: string;
}) {
  const { t } = useTranslation();
  const isActive = prescription.status === PrescriptionStatus.active;

  return (
    <Link
      href={`/patient/records/prescriptions/${prescription.id}`}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border bg-white p-4 hover:border-gray-300",
        isActive ? "border-primary-200" : "border-gray-200 opacity-80",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-bold text-gray-900">
          {formatName(prescription.prescribed_by)}
        </span>
        <span className="truncate text-xs text-gray-600">
          {[
            dayjs(prescription.created_date).format("DD MMM YYYY"),
            prescription.encounter?.facility?.name,
            prescription.name,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <PatientBadge tone={PRESCRIPTION_TONES[prescription.status]}>
        {t(prescription.status)}
      </PatientBadge>
      <ChevronRight
        className="size-4.25 shrink-0 text-gray-600"
        strokeWidth={2.1}
        aria-hidden
      />
    </Link>
  );
}
