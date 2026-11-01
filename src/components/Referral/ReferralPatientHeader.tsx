import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";
import { PatientTagsDisplay } from "@/components/Patient/PatientTagsDisplay";
import { Button, buttonVariants } from "@/components/ui/button";
import EncounterDetailsHeader from "@/pages/Encounters/EncounterDetailsHeader";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import { appendReferralNativeContext } from "./referralNativeNavigation";

interface ReferralPatientHeaderProps {
  referral: ReferralRetrieve;
  children: ReactNode;
  receivingEncounter?: EncounterRead;
}

function accessUnavailable(error: unknown) {
  return error instanceof HTTPError && [401, 403, 404].includes(error.status);
}

export function ReferralPatientHeader({
  referral,
  children,
  receivingEncounter,
}: ReferralPatientHeaderProps) {
  const { t } = useTranslation();
  const [{ sourceUrl, referralAppointmentId }] = useQueryParams<{
    sourceUrl?: string;
    referralAppointmentId?: string;
  }>();
  const encounterQuery = useQuery({
    queryKey: [
      "referrals",
      referral.id,
      "header",
      "encounter",
      referral.encounter,
    ],
    queryFn: query(encounterApi.get, {
      pathParams: { id: referral.encounter ?? "" },
      silent: true,
    }),
    enabled: !!referral.encounter && !receivingEncounter,
    retry: false,
  });
  // Chart access is independent of referral/encounter access. This also
  // authorizes the shared header's patient-profile navigation. Do not request
  // source-facility identifiers/tags through an unrelated facility context.
  const patientQuery = useQuery({
    queryKey: ["referrals", referral.id, "header", "patient", referral.patient],
    queryFn: query(patientApi.get, {
      pathParams: { id: referral.patient },
      silent: true,
    }),
    retry: false,
  });
  const encounter =
    receivingEncounter?.patient.id === referral.patient
      ? receivingEncounter
      : !encounterQuery.isError &&
          encounterQuery.data?.patient.id === referral.patient
        ? encounterQuery.data
        : undefined;
  const chartPatient =
    !patientQuery.isError && patientQuery.data?.id === referral.patient
      ? patientQuery.data
      : undefined;
  // Encounter retrieval includes the patient identifiers and tags in the
  // originating facility. Never retain this data after its access is revoked.
  const patient = encounter?.patient ?? chartPatient;
  const loading =
    patientQuery.isPending ||
    (!!referral.encounter && !receivingEncounter && encounterQuery.isPending);
  const patientError = patientQuery.error;
  const encounterError = encounterQuery.error;

  const encounterLabel = receivingEncounter
    ? "referral_receiving_encounter"
    : "referral_source_encounter";
  const encounterLoading = !receivingEncounter && encounterQuery.isPending;
  const encounterPath = encounter
    ? `/facility/${encounter.facility.id}/patient/${referral.patient}/encounter/${encounter.id}/updates`
    : "";
  const encounterUrl =
    receivingEncounter && encounter
      ? appendReferralNativeContext(
          encounterPath,
          new URLSearchParams({
            referralId: referral.id,
            referralEncounterId: encounter.id,
            ...(referralAppointmentId &&
            encounter.appointment?.id === referralAppointmentId
              ? { referralAppointmentId }
              : {}),
            ...(typeof sourceUrl === "string"
              ? { referralSourceUrl: sourceUrl }
              : {}),
          }).toString(),
        )
      : encounterPath;
  return (
    <div className="space-y-2">
      <section
        aria-label={t("patient_details")}
        className="grid min-w-0 gap-3 rounded-lg border border-border bg-background px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      >
        <PatientHeader
          patient={
            patient ?? { id: referral.patient, name: referral.patient_name }
          }
          variant="encounter"
          showDetails={!!chartPatient}
          className="p-0"
        />
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {children}
        </div>
        {patient && (
          <PatientTagsDisplay
            patient={patient}
            className="min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-1 lg:col-span-2 [&>span]:shrink-0 [&>span]:text-xs [&>span]:font-normal [&>span]:text-gray-500 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:gap-1.5 [&_[data-slot=badge]]:max-w-full [&_[data-slot=badge]]:whitespace-normal [&_[data-slot=badge]]:wrap-anywhere"
          />
        )}
        {!patient && (
          <div
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground lg:col-span-2"
            role="status"
          >
            <p>
              {t(
                loading
                  ? "loading"
                  : accessUnavailable(patientError)
                    ? "referral_patient_details_unavailable"
                    : "referral_context_load_failed",
              )}
            </p>
            {!loading && patientError && !accessUnavailable(patientError) && (
              <Button
                size="sm"
                variant="outline"
                disabled={patientQuery.isFetching}
                onClick={() => void patientQuery.refetch()}
              >
                {t("retry")}
              </Button>
            )}
          </div>
        )}
      </section>
      {patient && <PatientDeceasedInfo patient={patient} />}
      {(referral.encounter || receivingEncounter) && (
        <section aria-label={t(encounterLabel)} className="space-y-1">
          <h2 className="px-1 text-xs font-medium text-muted-foreground">
            {t(encounterLabel)}
          </h2>
          {encounter || encounterLoading ? (
            <EncounterDetailsHeader
              encounter={encounter}
              isLoading={encounterLoading}
              isHistorical={false}
              actions={
                encounter && (
                  <Link
                    href={encounterUrl}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    {t("view_encounter")}
                    <ArrowUpRight className="size-4" />
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-2 rounded-lg border border-border bg-background px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                {t(
                  accessUnavailable(encounterError)
                    ? "referral_encounter_details_unavailable"
                    : "referral_context_load_failed",
                )}
              </p>
              {encounterError && !accessUnavailable(encounterError) && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={encounterQuery.isFetching}
                  onClick={() => void encounterQuery.refetch()}
                >
                  {t("retry")}
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
