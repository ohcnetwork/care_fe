import { useQuery } from "@tanstack/react-query";
import { Check, DropletIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AllergyIcon } from "@/CAREUI/icons/CustomIcons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";

import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatTruncatedList } from "@/Utils/utils";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import { completedEncounterStatus } from "@/types/emr/encounter/encounter";
import type { PatientRead } from "@/types/emr/patient/patient";

function MetaPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

interface FillHeaderProps {
  patient?: PatientRead;
  encounter?: EncounterRead;
  facilityId?: string;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  /** Provided only when this session may be saved as a SERVER draft (see
   *  `draft/useSaveServerDraft`); absent → the affordance is not offered. */
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
}

/**
 * The fill page's context header per the reference: patient identity row
 * with the encounter meta pairs (start/end, hospital identifier, assigned
 * doctor), then the gray action band — blood group + confirmed-allergy
 * badges on the left (same sources as the encounter overview's clinical
 * history card), Cancel + Save Changes on the right.
 */
export function FillHeader({
  patient,
  encounter,
  facilityId,
  onCancel,
  onSubmit,
  isSubmitting,
  canSubmit,
  onSaveDraft,
  isSavingDraft = false,
}: FillHeaderProps) {
  const { t } = useTranslation();

  const patientId = patient?.id;
  const { data: allergies } = useQuery({
    queryKey: ["allergies", patientId, "confirmed"],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId: patientId ?? "" },
      queryParams: { verification_status: "confirmed" },
    }),
    // Same voluntary gate as the encounter overview card — the listing is
    // only reliably permitted alongside an active encounter.
    enabled:
      !!patientId &&
      !!encounter &&
      !completedEncounterStatus.includes(encounter.status),
  });

  const assignedDoctor = encounter?.care_team?.[0];

  return (
    <div className="shrink-0 space-y-2 px-4 pt-3 md:px-6">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-10">
        {patient && (
          <PatientHeader
            patient={patient}
            facilityId={facilityId}
            className="p-0"
          />
        )}
        {encounter && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <MetaPair
              label={t("start_date")}
              value={formatDateTime(encounter.period.start)}
            />
            <MetaPair
              label={t("end_date")}
              value={
                encounter.period.end
                  ? formatDateTime(encounter.period.end)
                  : `-- (${t("ongoing")})`
              }
            />
            {encounter.external_identifier && (
              <MetaPair
                label={t("hospital_identifier")}
                value={encounter.external_identifier}
              />
            )}
            {assignedDoctor && (
              <MetaPair
                label={t("assigned_doctor")}
                value={`${formatName(assignedDoctor.member)}${
                  assignedDoctor.role.display
                    ? ` (${assignedDoctor.role.display})`
                    : ""
                }`}
              />
            )}
          </div>
        )}
      </div>
      {patient && <PatientDeceasedInfo patient={patient} />}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-4">
          {patient && (
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs font-medium text-gray-600">
                {t("blood_group")}:
              </span>
              <Badge variant="yellow">
                <DropletIcon className="size-4" strokeWidth={1.5} />
                <span>
                  {t(`BLOOD_GROUP_LONG__${patient.blood_group || "unknown"}`)}
                </span>
              </Badge>
            </div>
          )}
          {!!allergies?.results.length && (
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs font-medium text-gray-600">
                {t("allergies")}:
              </span>
              <Badge variant="destructive">
                <AllergyIcon className="size-4" />
                <span>
                  {formatTruncatedList(
                    allergies.results,
                    2,
                    (allergy) => allergy.code.display,
                  )}
                </span>
              </Badge>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="font-semibold underline underline-offset-4"
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSubmitting || isSavingDraft}
            >
              {t("save_as_draft")}
            </Button>
          )}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isSavingDraft || !canSubmit}
            className="border border-emerald-900/80 bg-gradient-to-b from-emerald-700 to-emerald-800 text-white shadow-sm hover:from-emerald-800 hover:to-emerald-900"
          >
            <Check className="size-4" />
            {t("save_changes")}
          </Button>
        </div>
      </div>
    </div>
  );
}
