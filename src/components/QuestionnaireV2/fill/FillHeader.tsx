import { useQuery } from "@tanstack/react-query";
import { Droplet } from "lucide-react";
import {
  type KeyboardEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

import { AllergyIcon } from "@/CAREUI/icons/CustomIcons";

import { Badge } from "@/components/ui/badge";

import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";
import { PatientTagsDisplay } from "@/components/Patient/PatientTagsDisplay";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import { completedEncounterStatus } from "@/types/emr/encounter/encounter";
import type { PatientRead } from "@/types/emr/patient/patient";

interface FillHeaderProps {
  patient?: PatientRead;
  encounter?: EncounterRead;
  facilityId?: string;
  actions: ReactNode;
  onActionsHeightChange: (height: number) => void;
}

function MetaPair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium wrap-anywhere text-gray-950">
        {children}
      </dd>
    </div>
  );
}

/** Patient details scroll away; the sibling clinical/action strip stays visible. */
export function FillHeader({
  patient,
  encounter,
  facilityId,
  actions,
  onActionsHeightChange,
}: FillHeaderProps) {
  const { t } = useTranslation();
  const actionsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = actionsRef.current;
    if (!element) return;
    const measure = () => {
      const height = Math.ceil(element.getBoundingClientRect().height);
      if (height > 0) onActionsHeightChange(height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onActionsHeightChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Keep native activation for patient details and form actions.
      event.stopPropagation();
    }
  };

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
  const bloodGroup = patient?.blood_group || "unknown";

  return (
    <>
      {(patient || encounter) && (
        <header className="space-y-3" onKeyDown={handleKeyDown}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-6">
            {patient && (
              <PatientHeader
                patient={patient}
                facilityId={facilityId}
                variant="encounter"
                showBloodGroup={false}
                className="p-0 xl:max-w-3xl"
              />
            )}
            {encounter && (
              <dl className="flex min-w-0 flex-wrap items-start gap-x-6 gap-y-3">
                <MetaPair label={t("start_date")}>
                  {encounter.period.start
                    ? formatDateTime(encounter.period.start)
                    : t("not_specified")}
                </MetaPair>
                <MetaPair label={t("end_date")}>
                  {encounter.period.end
                    ? formatDateTime(encounter.period.end)
                    : t("ongoing")}
                </MetaPair>
                {encounter.external_identifier && (
                  <MetaPair label={t("hospital_identifier")}>
                    {encounter.external_identifier}
                  </MetaPair>
                )}
                {assignedDoctor && (
                  <MetaPair label={t("assigned_doctor")}>
                    {formatName(assignedDoctor.member)}
                    {assignedDoctor.role.display && (
                      <span className="font-normal">
                        {` (${assignedDoctor.role.display})`}
                      </span>
                    )}
                  </MetaPair>
                )}
              </dl>
            )}
          </div>
          {patient && (
            <>
              <PatientTagsDisplay
                patient={patient}
                className="min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-1 [&>span]:shrink-0 [&>span]:text-xs [&>span]:font-normal [&>span]:text-gray-500 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:gap-1.5 [&_[data-slot=badge]]:max-w-full [&_[data-slot=badge]]:whitespace-normal [&_[data-slot=badge]]:wrap-anywhere"
              />
              <PatientDeceasedInfo patient={patient} />
            </>
          )}
        </header>
      )}
      <div
        ref={actionsRef}
        onKeyDown={handleKeyDown}
        className="sticky top-(--fill-shell-header-height) z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 shadow-sm md:top-0"
      >
        {patient && (
          <div className="flex min-w-0 basis-full flex-wrap items-center gap-x-4 gap-y-1.5 sm:flex-1">
            <div className="flex shrink-0 items-center gap-2">
              <p className="whitespace-nowrap text-xs text-gray-700">
                {t("blood_group")}:
              </p>
              <Badge variant={bloodGroup === "unknown" ? "secondary" : "green"}>
                <Droplet className="size-3.5 shrink-0" aria-hidden />
                {t(`BLOOD_GROUP_LONG__${bloodGroup}`)}
              </Badge>
            </div>
            {!!allergies?.results.length && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-xs text-gray-700">{t("allergies")}:</p>
                <Badge
                  variant="yellow"
                  className="max-w-full gap-1.5 whitespace-normal wrap-anywhere"
                >
                  <AllergyIcon className="size-3.5 shrink-0" aria-hidden />
                  {allergies.results
                    .map((allergy) => allergy.code.display)
                    .join(", ")}
                </Badge>
              </div>
            )}
          </div>
        )}
        {actions}
      </div>
    </>
  );
}
