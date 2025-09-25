import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, SquareActivity, Stethoscope, Ticket } from "lucide-react";
import { useQueryParams } from "raviger";
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

import { PatientInfoCard } from "@/components/Patient/PatientInfoCard";
import useBreakpoints from "@/hooks/useBreakpoints";
import { QuickAction } from "@/pages/Encounters/tabs/overview/quick-actions";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import patientApi from "@/types/emr/patient/patientApi";
import query from "@/Utils/request/query";

export default function VerifyPatient() {
  useShortcutSubContext("facility:patient:home");
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const queryClient = useQueryClient();

  const { phone_number, year_of_birth, partial_id } = qParams;
  const { goBack } = useAppHistory();
  const { facility, facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const isTab = useBreakpoints({ default: true, lg: false });

  const { canWriteAppointment, canCreateEncounter, canListEncounters } =
    getPermissions(hasPermission, facility?.permissions ?? []);

  // For now, using canWriteAppointment as a proxy for token creation permission
  // This can be updated when specific token permissions are available
  const canCreateToken = canWriteAppointment;

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
        <div className="space-y-6 md:max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              <div className="">
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
                />
              </div>

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
                        data-shortcut-id="create-encounter"
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
                        data-shortcut-id="schedule-appointment"
                      />
                    }
                  />
                )}

                {canCreateToken && (
                  <CreateTokenForm
                    patient={patientData}
                    facilityId={facilityId}
                    trigger={
                      <QuickAction
                        icon={<Ticket className="text-gray-500" />}
                        title={t("generate_token")}
                        actionId="generate-token"
                        data-shortcut-id="generate-token"
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
                canCreateToken={canCreateToken}
              />
            </div>

            <div className="space-y-4">
              {canCreateToken && !isTab && (
                <PatientTokensList
                  patientId={patientData.id}
                  facility={facility}
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
