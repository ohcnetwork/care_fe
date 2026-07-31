import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Pill } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { formatDosage, formatDuration } from "@/components/Medicine/utils";
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
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";

/**
 * The backend status set is wider than the frontend enum (`on_hold`, `ended`,
 * `stopped`, …), so callers fall back to `neutral` for anything unmapped.
 */
const PRESCRIPTION_BADGE_TONES: Record<string, PatientBadgeTone> = {
  active: "success",
  completed: "info",
  cancelled: "danger",
};

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function MedicineCard({ medication }: { medication: MedicationRequestRead }) {
  const { t } = useTranslation();

  const instructions = medication.dosage_instruction ?? [];
  const [primary] = instructions;
  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
  );

  const frequency = fhirDosageToFrequencyValue(primary);
  const meta = [formatDosage(primary), primary?.route?.display]
    .filter(Boolean)
    .join(" · ");
  const detail = [
    ...(primary?.additional_instruction ?? []).map((code) => code.display),
    formatDuration(primary),
  ]
    .filter(Boolean)
    .join(" · ");

  // A tapering course carries more than one instruction; each further step gets
  // its own line so the regimen is never truncated to its first step.
  const furtherSteps = instructions
    .slice(1)
    .map((instruction) =>
      [
        formatDosage(instruction),
        fhirDosageToFrequencyValue(instruction),
        ...(instruction.additional_instruction ?? []).map(
          (code) => code.display,
        ),
        formatDuration(instruction),
      ]
        .filter(Boolean)
        .join(" · "),
    )
    .filter(Boolean);

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5",
        isInactive && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-base font-bold text-gray-900">
            {displayMedicationName(medication)}
          </span>
          {meta && <span className="text-xs text-gray-600">{meta}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isInactive && (
            <PatientBadge tone="neutral">{t(medication.status)}</PatientBadge>
          )}
          {frequency && (
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-bold text-gray-900">
              {frequency}
            </span>
          )}
        </div>
      </div>
      {detail && <span className="text-xs text-gray-600">{detail}</span>}
      {furtherSteps.map((step, index) => (
        <span key={index} className="text-xs text-gray-600">
          {step}
        </span>
      ))}
      {medication.note && (
        <span className="text-xs text-gray-600">{medication.note}</span>
      )}
    </div>
  );
}

export default function PrescriptionDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { tokenData } = usePatientContext();

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["portal-prescription", id],
    queryFn: query(patientPortalApi.getPrescription, {
      pathParams: { id },
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  return (
    <PatientAppShell
      title={t("prescription")}
      backTo="/patient/records?tab=prescriptions"
      hideTabs
    >
      <div className="flex flex-col gap-3 p-4">
        {isLoading || !prescription ? (
          <>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-bold text-gray-900">
                  {formatName(prescription.prescribed_by)}
                </span>
                <PatientBadge
                  tone={
                    PRESCRIPTION_BADGE_TONES[prescription.status] ?? "neutral"
                  }
                >
                  {t(prescription.status)}
                </PatientBadge>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <MetaField
                  label={t("prescribed_on")}
                  value={dayjs(prescription.created_date).format("DD MMM YYYY")}
                />
                {prescription.encounter?.facility?.name && (
                  <MetaField
                    label={t("facility")}
                    value={prescription.encounter.facility.name}
                  />
                )}
                {prescription.encounter?.patient?.name && (
                  <MetaField
                    label={t("patient")}
                    value={prescription.encounter.patient.name}
                  />
                )}
                {prescription.name && (
                  <MetaField label={t("name")} value={prescription.name} />
                )}
              </div>
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("medications")} · {prescription.medications?.length ?? 0}
            </span>

            {prescription.medications?.length ? (
              prescription.medications.map((medication) => (
                <MedicineCard key={medication.id} medication={medication} />
              ))
            ) : (
              <EmptyState
                icon={<Pill className="size-6 text-primary-700" />}
                title={t("no_medications_found")}
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
