import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  SquareActivity,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import CreateTokenForm from "@/components/Tokens/CreateTokenForm";
import PatientTokensList from "@/components/Tokens/PatientTokensList";
import BookAppointmentSheet from "@/pages/Appointments/BookAppointment/BookAppointmentSheet";
import PatientHomeTabs from "./home/PatientHomeTabs";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import BackButton from "@/components/Common/BackButton";
import { PatientInfoCard } from "@/components/Patient/PatientInfoCard";
import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { Badge } from "@/components/ui/badge";
import useBreakpoints from "@/hooks/useBreakpoints";
import { QuickAction } from "@/pages/Encounters/tabs/overview/quick-actions";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PLUGIN_Component } from "@/PluginEngine";
import patientApi from "@/types/emr/patient/patientApi";
import {
  Appointment,
  APPOINTMENT_STATUS_COLORS,
  formatScheduleResourceName,
  SchedulableResourceType,
  UpcomingAppointmentStatuses,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { dateQueryString } from "@/Utils/utils";
import { format } from "date-fns";

export default function VerifyPatient() {
  useShortcutSubContext("facility:patient:home");
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const queryClient = useQueryClient();

  const {
    phone_number,
    year_of_birth,
    partial_id,
    queue_id,
    token_id,
    resource_type,
    resource_id,
  } = qParams;
  const { goBack } = useAppHistory();
  const { facility, facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const isTab = useBreakpoints({ default: true, lg: false });

  const {
    canWriteAppointment,
    canCreateEncounter,
    canListEncounters,
    canWriteToken,
    canListTokens,
    canViewAppointments,
  } = getPermissions(hasPermission, facility?.permissions ?? []);

  const {
    data: patientData,
    isPending: isVerifyingPatient,
    isError,
  } = useQuery({
    queryKey: ["patient-verify", phone_number, year_of_birth, partial_id],
    queryFn: query(patientApi.searchRetrieve, {
      body: { phone_number, year_of_birth, partial_id },
    }),
    enabled: !!(phone_number && year_of_birth && partial_id),
  });

  if (isVerifyingPatient || !facility) {
    return (
      <div className="space-y-4 md:max-w-5xl mx-auto">
        <CardListSkeleton count={1} />
        <CardGridSkeleton count={4} />
      </div>
    );
  }
  return (
    <div>
      {!phone_number || !year_of_birth || !partial_id ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t("missing_required_params_for_patient_verification")}
          </AlertDescription>
        </Alert>
      ) : patientData ? (
        <div className="space-y-5 md:max-w-5xl mx-auto">
          {queue_id && (
            <BackButton
              to={`/facility/${facilityId}/${resourceTypeToResourcePathSlug[resource_type as SchedulableResourceType]}/${resource_id}/queues/${queue_id}`}
            >
              <ArrowLeft />
              {t("queue")}
            </BackButton>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <PatientInfoCard
                  tags={patientData.instance_tags}
                  tagEntityType="patient"
                  tagEntityId={patientData.id}
                  patient={patientData}
                  facilityId={facilityId}
                  onTagsUpdate={() => {
                    queryClient.invalidateQueries({
                      queryKey: [
                        "patient-verify",
                        phone_number,
                        year_of_birth,
                        partial_id,
                      ],
                    });
                  }}
                >
                  <PLUGIN_Component
                    __name="PatientInfoCardActions"
                    patient={patientData}
                    facilityId={facilityId}
                    className="flex justify-end"
                  />
                </PatientInfoCard>
              </div>

              {canViewAppointments && (
                <UpcomingAppointmentsSummary
                  patientId={patientData.id}
                  facilityId={facilityId}
                />
              )}

              <div className="grid gap-4 grid-cols-2  lg:grid-cols-3">
                {canCreateEncounter && (
                  <CreateEncounterForm
                    patientId={patientData.id}
                    facilityId={facilityId}
                    patientName={patientData.name}
                    trigger={
                      <QuickAction
                        icon={<SquareActivity className="text-orange-500" />}
                        title={t("create_encounter")}
                        actionId="create-encounter"
                      />
                    }
                  />
                )}

                {canWriteAppointment && (
                  <BookAppointmentSheet
                    patientId={patientData.id}
                    facilityId={facilityId}
                    trigger={
                      <QuickAction
                        icon={<Stethoscope className="text-purple-500" />}
                        title={t("schedule_appointment")}
                        actionId="schedule-appointment"
                      />
                    }
                  />
                )}

                {canWriteToken && (
                  <CreateTokenForm
                    patient={patientData}
                    facilityId={facilityId}
                    trigger={
                      <QuickAction
                        icon={<Ticket className="text-gray-500" />}
                        title={t("generate_token")}
                        actionId="generate-token"
                      />
                    }
                  />
                )}
              </div>

              <PatientHomeTabs
                patientId={patientData.id}
                facility={facility}
                facilityPermissions={facility?.permissions ?? []}
                canListEncounters={canListEncounters}
                canWriteAppointment={canWriteAppointment}
                canListTokens={canListTokens}
              />
            </div>
            <div className="space-y-4">
              {canListTokens && !isTab && (
                <PatientTokensList
                  patientId={patientData.id}
                  facility={facility}
                  tokenId={token_id}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        isError && (
          <div className="h-screen w-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-semibold mb-1">
                {t("verification_failed")}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t("please_enter_correct_birth_year")}
              </p>
              <Button
                variant={"primary_gradient"}
                className="gap-3 group"
                onClick={() => goBack(`/facility/${facilityId}/patients`)}
              >
                {t("go_back")}
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

const UpcomingAppointmentsSummary = ({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId: string;
}) => {
  const { t } = useTranslation();
  const [, setQueryParams] = useQueryParams<{ tab?: string }>();

  const { data } = useQuery({
    queryKey: ["upcoming-appointments", patientId, facilityId],
    queryFn: query(scheduleApi.appointments.getAppointments, {
      pathParams: { patientId },
      queryParams: {
        limit: 1,
        facility: facilityId,
        date_after: dateQueryString(new Date()),
        status: UpcomingAppointmentStatuses.join(","),
      },
    }),
    select: (data: PaginatedResponse<Appointment>) => ({
      appointment: data.results[0],
      totalCount: data.count,
    }),
  });

  if (!data?.appointment) {
    return null;
  }

  const { appointment, totalCount } = data;

  return (
    <div className="flex flex-col gap-2 items-start">
      <h6 className="text-base font-semibold">{t("upcoming_appointment")}</h6>

      <div className="flex w-full gap-2 py-2 pl-4 pr-3 bg-white rounded-lg border border-indigo-400">
        <div className="flex w-full justify-between items-center">
          <div className="flex gap-3 items-center">
            <span className="text-sm font-semibold">
              {appointment.token_slot.availability.name}
            </span>
            <div className="h-6 w-0 border" />
            <span className="text-sm font-medium">
              {format(
                appointment.token_slot.start_datetime,
                "hh:mm a; dd/MM/yyyy",
              )}
            </span>
            <div className="h-6 w-0 border" />
            <span className="text-sm font-medium">
              {formatScheduleResourceName(appointment)}
            </span>
          </div>
          <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
            {t(appointment.status)}
          </Badge>
        </div>

        <Button variant="ghost" size="lg" asChild>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/appointments/${appointment.id}`}
          >
            <ChevronRight size={20} />
          </Link>
        </Button>
      </div>

      {totalCount > 1 && (
        <Button
          variant="link"
          className="underline"
          onClick={() =>
            setQueryParams({ tab: "appointments" }, { overwrite: false })
          }
        >
          {t("view_all_appointments", { count: totalCount })}
        </Button>
      )}
    </div>
  );
};
