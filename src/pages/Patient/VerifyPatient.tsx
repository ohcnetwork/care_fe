import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  Printer,
  SquareActivity,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import CreateTokenForm from "@/components/Tokens/CreateTokenForm";
import BookAppointmentSheet from "@/pages/Appointments/BookAppointment/BookAppointmentSheet";
import PatientHomeTabs from "./home/PatientHomeTabs";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { PatientInfoCard } from "@/components/Patient/PatientInfoCard";
import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { TokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import { QuickAction } from "@/pages/Encounters/tabs/overview/quick-actions";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import patientApi from "@/types/emr/patient/patientApi";
import { renderTokenNumber } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import query from "@/Utils/request/query";
import { saveElementAsImage } from "@/Utils/utils";

export default function VerifyPatient() {
  useShortcutSubContext("facility:patient:home");
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const queryClient = useQueryClient();

  const { phone_number, year_of_birth, partial_id, queue_id, token_id } =
    qParams;
  const { goBack } = useAppHistory();
  const { facility, facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();

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

  // Fetch token details if queue_id and token_id are provided
  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", facilityId, queue_id, token_id],
    queryFn: query(tokenApi.get, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queue_id!,
        id: token_id!,
      },
    }),
    enabled: !!(queue_id && token_id && facilityId),
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
                facilityId={facilityId}
                facilityPermissions={facility?.permissions ?? []}
                canListEncounters={canListEncounters}
                canWriteAppointment={canWriteAppointment}
                canCreateToken={canCreateToken}
                patientData={patientData}
              />
            </div>

            <div className="space-y-4">
              {isTokenLoading && (
                <Card className="bg-white shadow-sm h-full">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {tokenData && (
                <Card className="bg-white shadow-sm p-1">
                  <CardHeader className="bg-gray-100 font-semibold text-lg p-2 rounded-t-lg">
                    {t("queue")}
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/facility/${facilityId}/${resourceTypeToResourcePathSlug[tokenData.resource_type]}/${tokenData.resource.id}/queues/${tokenData.queue.id}/ongoing`}
                        className="font-semibold text-lg underline"
                      >
                        {tokenData.queue.name === "System Generated"
                          ? t("primary_queue")
                          : tokenData.queue.name}
                      </Link>

                      <span className="text-lg text-gray-700 p-2">
                        {t("token")}: {renderTokenNumber(tokenData)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tokenData && (
                <div>
                  <div
                    id="section-to-print"
                    className="print:block print:w-[400px] print:pt-4"
                  >
                    <TokenCard token={tokenData} facility={facility} />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        saveElementAsImage("section-to-print", "token-card.png")
                      }
                      className="underline font-semibold text-base"
                    >
                      <Download className="size-5" />
                      {t("download")}
                    </Button>
                    <Button
                      data-shortcut-id="print-token"
                      variant="outline"
                      onClick={() => print()}
                      className="font-semibold text-base"
                    >
                      <Printer className="size-5" />
                      {t("print_token")}
                      <ShortcutBadge actionId="print-token" />
                    </Button>
                  </div>
                </div>
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
