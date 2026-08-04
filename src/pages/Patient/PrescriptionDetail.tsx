import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Pill } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import {
  formatDosage,
  formatDuration,
  formatSig,
} from "@/components/Medicine/utils";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import {
  PatientBadge,
  type PatientBadgeTone,
} from "@/components/Patient/PatientBadge";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import {
  displayMedicationName,
  fhirDosageToFrequencyValue,
  INACTIVE_MEDICATION_STATUSES,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";

/**
 * The backend status set is wider than the frontend enum (`on_hold`, `ended`,
 * `stopped`, …), so callers fall back to `neutral` for anything unmapped.
 */
const PRESCRIPTION_BADGE_TONES: Record<string, PatientBadgeTone> = {
  active: "success",
  completed: "info",
  cancelled: "danger",
};

function PrescriptionSummary({
  prescription,
}: {
  prescription: PrescriptionRead;
}) {
  const { t } = useTranslation();

  const fields: [string, string | null | undefined][] = [
    [
      t("prescribed_on"),
      dayjs(prescription.created_date).format("DD MMM YYYY"),
    ],
    [t("facility"), prescription.encounter?.facility?.name],
    [t("patient"), prescription.encounter?.patient?.name],
    [t("name"), prescription.name],
  ];

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-bold text-gray-900">
          {formatName(prescription.prescribed_by)}
        </span>
        <PatientBadge
          tone={PRESCRIPTION_BADGE_TONES[prescription.status] ?? "neutral"}
        >
          {t(prescription.status)}
        </PatientBadge>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {fields.map(
          ([label, value]) =>
            value && (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {value}
                </span>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

function DosageStep({
  instruction,
}: {
  instruction: MedicationRequestDosageInstruction;
}) {
  const frequency = fhirDosageToFrequencyValue(instruction);
  const dose = [formatDosage(instruction), formatSig(instruction)]
    .filter(Boolean)
    .join(" · ");
  const detail = [
    formatDuration(instruction),
    ...(instruction.additional_instruction ?? []).map((code) => code.display),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-start justify-between gap-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        {dose && <span className="text-xs text-gray-600">{dose}</span>}
        {detail && <span className="text-xs text-gray-600">{detail}</span>}
      </div>
      {frequency && (
        <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-bold text-gray-900">
          {frequency}
        </span>
      )}
    </div>
  );
}

function MedicineCard({ medication }: { medication: MedicationRequestRead }) {
  const { t } = useTranslation();

  // A tapering course carries more than one instruction; every step is rendered
  // so the regimen is never truncated to its first step.
  const instructions = medication.dosage_instruction ?? [];
  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5",
        isInactive && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <span className="min-w-0 text-base font-bold text-gray-900">
          {displayMedicationName(medication)}
        </span>
        {isInactive && (
          <PatientBadge tone="neutral">{t(medication.status)}</PatientBadge>
        )}
      </div>
      <DosageInstructionList
        instructions={instructions}
        gap="sm"
        renderItem={(instruction) => <DosageStep instruction={instruction} />}
      />
      {medication.note && (
        <span className="text-xs text-gray-600">
          <span className="font-semibold">{t("note")}:</span> {medication.note}
        </span>
      )}
    </div>
  );
}

export default function PrescriptionDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { tokenData } = usePatientContext();

  const { data: prescription } = useQuery({
    queryKey: ["portal-prescription", id],
    queryFn: query(patientPortalApi.getPrescription, {
      pathParams: { id },
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  const medications = prescription?.medications ?? [];

  return (
    <PatientAppShell
      title={t("prescription")}
      backTo="/patient/records?tab=prescriptions"
      hideTabs
    >
      <div className="flex flex-col gap-3 p-4">
        {!prescription ? (
          <>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </>
        ) : (
          <>
            <PrescriptionSummary prescription={prescription} />

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("medications")} · {medications.length}
            </span>

            {medications.length ? (
              medications.map((medication) => (
                <MedicineCard key={medication.id} medication={medication} />
              ))
            ) : (
              <EmptyState
                icon={<Pill className="size-6 text-primary-700" />}
                title={t("no_medications_found")}
                className="gap-3 rounded-2xl border-gray-300 px-5 py-7 shadow-none"
              />
            )}

            {prescription.note && (
              <div className="flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <span className="text-sm font-bold text-gray-900">
                  {t("patient_records__doctors_advice")}
                </span>
                <span className="text-xs leading-relaxed text-gray-600">
                  {prescription.note}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
