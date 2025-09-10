import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Printer, PrinterIcon } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import CreateTokenForm from "@/components/Tokens/CreateTokenForm";
import PatientHomeTabs from "./home/PatientHomeTabs";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { usePermissions } from "@/context/PermissionContext";

import { TokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import patientApi from "@/types/emr/patient/patientApi";
import {
  getTagHierarchyDisplay,
  TagResource,
} from "@/types/emr/tagConfig/tagConfig";
import { TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useQueryClient } from "@tanstack/react-query";
export default function VerifyPatient() {
  const queryClient = useQueryClient();

  const { t } = useTranslation();
  const [qParams] = useQueryParams();
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
    mutate: verifyPatient,
    data: patientData,
    isPending: isVerifyingPatient,
    isError,
  } = useMutation({
    mutationFn: mutate(patientApi.searchRetrieve),
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      errorData.errors.msg.forEach((er) => {
        toast.error(er);
      });
    },
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

  useEffect(() => {
    if (phone_number && year_of_birth && partial_id) {
      verifyPatient({
        phone_number,
        year_of_birth,
        partial_id,
      });
    }
  }, [phone_number, year_of_birth, partial_id, verifyPatient]);

  // Helper function to get status display
  const getStatusDisplay = (status: TokenStatus) => {
    switch (status) {
      case TokenStatus.CREATED:
        return { text: t("waiting"), variant: "secondary" as const };
      case TokenStatus.IN_PROGRESS:
        return { text: t("in_progress"), variant: "default" as const };
      case TokenStatus.FULFILLED:
        return { text: t("completed"), variant: "default" as const };
      case TokenStatus.CANCELLED:
        return { text: t("cancelled"), variant: "destructive" as const };
      default:
        return { text: status, variant: "secondary" as const };
    }
  };

  if (isVerifyingPatient || !facility) {
    return (
      <div className="space-y-4">
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
        <div className="space-y-6">
          {/* Main Layout: Left side (patient info + actions) and Right side (token) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Patient Information and Actions */}
            <div className="space-y-6 lg:col-span-2">
              {/* Patient Information Header */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    {/* Patient Details */}
                    <PatientHoverCard
                      patient={patientData}
                      facilityId={facilityId || ""}
                    />

                    {/* Patient Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {patientData.instance_tags.map((t) => (
                        <Badge key={t.id} variant="outline">
                          {getTagHierarchyDisplay(t)}
                        </Badge>
                      ))}
                      <TagAssignmentSheet
                        entityType={TagResource.PATIENT}
                        entityId={patientData.id}
                        currentTags={patientData.instance_tags}
                        onUpdate={() => {
                          queryClient.invalidateQueries({
                            queryKey: ["patient", patientData.id],
                          });
                        }}
                        canWrite={true}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Action Cards */}
            </div>

            {/* Right Side - Token Information */}
            <div className="space-y-4">
              {isTokenLoading ? (
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
              ) : (
                tokenData && (
                  <Card className="bg-white shadow-sm h-full">
                    <CardHeader className="p-4 h-full">
                      <div className="space-y-3q flex flex-col h-full justify-between">
                        {/* Compact Token Display */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
                              <CareIcon
                                icon="l-circle"
                                className="size-4 text-orange-600"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {tokenData.number}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t("token")}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800 border-orange-200 text-xs"
                          >
                            {getStatusDisplay(tokenData.status).text}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            data-shortcut-id="print-token"
                            variant="outline"
                            size="sm"
                            onClick={() => print()}
                            className="flex-1"
                          >
                            <PrinterIcon className="size-3 mr-1" />
                            {t("print")}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              )}

              {/* Hidden Full Token Card for Printing */}
              {tokenData && (
                <div
                  id="section-to-print"
                  className="hidden print:block print:w-[400px] print:pt-4"
                >
                  <TokenCard token={tokenData} facility={facility} />
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2  lg:grid-cols-5">
            {canCreateEncounter && (
              <CreateEncounterForm
                patientId={patientData.id}
                facilityId={facilityId}
                patientName={patientData.name}
                trigger={
                  <div className="group relative h-[120px] overflow-hidden border border-gray-200 rounded-lg bg-gray-50 p-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="absolute top-2 right-2 text-xs text-gray-400 font-medium">
                      E
                    </div>
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                        <CareIcon
                          icon="l-heartbeat"
                          className="size-6 text-orange-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 text-center">
                        {t("create_encounter")}
                      </span>
                    </div>
                  </div>
                }
              />
            )}

            {canWriteAppointment && (
              <Link
                href={`/facility/${facilityId}/patient/${patientData.id}/book-appointment`}
                className="group relative h-[120px] overflow-hidden border border-gray-200 rounded-lg bg-gray-50 p-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer block"
              >
                <div className="absolute top-2 right-2 text-xs text-gray-400 font-medium">
                  A
                </div>
                <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                    <CareIcon
                      icon="l-stethoscope"
                      className="size-6 text-purple-500"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800 text-center">
                    {t("schedule_appointment")}
                  </span>
                </div>
              </Link>
            )}

            {canCreateToken && (
              <CreateTokenForm
                patient={patientData}
                facilityId={facilityId}
                trigger={
                  <div className="group relative h-[120px] overflow-hidden border border-gray-200 rounded-lg bg-gray-50 p-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="absolute top-2 right-2 text-xs text-gray-400 font-medium">
                      T
                    </div>
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                        <Printer className="size-6 text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 text-center">
                        {t("generate_token")}
                      </span>
                    </div>
                  </div>
                }
              />
            )}
          </div>
          {/* Patient Tabs - Full Width */}
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
