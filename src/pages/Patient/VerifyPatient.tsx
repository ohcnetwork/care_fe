import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CalendarIcon, ExternalLink } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import CreateTokenForm from "@/components/Tokens/CreateTokenForm";
import PatientHomeTabs from "./home/PatientHomeTabs";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import { formatPatientAge } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import patientApi from "@/types/emr/patient/patientApi";

export default function VerifyPatient() {
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const { phone_number, year_of_birth, partial_id } = qParams;
  const { goBack } = useAppHistory();
  const { facility, facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();

  const { canCreateAppointment, canCreateEncounter, canListEncounters } =
    getPermissions(hasPermission, facility?.permissions ?? []);

  // For now, using canCreateAppointment as a proxy for token creation permission
  // This can be updated when specific token permissions are available
  const canCreateToken = canCreateAppointment;

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

  useEffect(() => {
    if (phone_number && year_of_birth && partial_id) {
      verifyPatient({
        phone_number,
        year_of_birth,
        partial_id,
      });
    }
  }, [phone_number, year_of_birth, partial_id, verifyPatient]);

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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 gap-y-2 md:flex-row">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex flex-row gap-x-4">
                    <div className="size-10 shrink-0 md:size-14">
                      <Avatar
                        className="size-10 font-semibold text-secondary-800 md:size-auto"
                        name={patientData.name || "-"}
                      />
                    </div>
                    <div>
                      <Link
                        href={`/facility/${facility.id}/patient/${patientData.id}`}
                        className="flex flex-col group"
                      >
                        <div className="flex items-center gap-2">
                          <h1
                            data-cy="verify-patient-name"
                            className="text-xl font-bold capitalize text-gray-950 group-hover:text-primary transition-colors"
                          >
                            {patientData.name}
                          </h1>
                          <ExternalLink className="size-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600">
                          {formatPatientAge(patientData, true)},{"  "}
                          <span className="capitalize">
                            {patientData.gender.replace("_", " ")}
                          </span>
                          {patientData.blood_group &&
                            ", " + patientData.blood_group.replace("_", " ")}
                        </h3>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {(canCreateAppointment || canCreateEncounter || canCreateToken) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("quick_actions")}</CardTitle>
                <CardDescription>
                  {canCreateAppointment && canCreateEncounter
                    ? t("quick_actions_description")
                    : canCreateAppointment
                      ? t("quick_actions_description_create_appointment")
                      : canCreateEncounter
                        ? t("quick_actions_description_create_encounter")
                        : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                {canCreateAppointment && (
                  <Button
                    asChild
                    variant="outline"
                    className="group relative h-[100px] md:h-[120px] overflow-hidden border-0 bg-linear-to-br from-blue-50 to-indigo-50 p-0 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <Link
                      href={`/facility/${facilityId}/patient/${patientData.id}/book-appointment`}
                      className="p-4 md:p-6"
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                      <div className="relative flex w-full items-center gap-3 md:gap-4">
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <CalendarIcon className="size-5 md:size-6 text-primary" />
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                            {t("schedule_appointment")}
                          </span>
                          <span className="text-xs md:text-sm text-gray-500 line-clamp-1">
                            {t("book_a_new_appointment")}
                          </span>
                        </div>
                        <CareIcon
                          icon="l-arrow-right"
                          className="ml-auto size-4 md:size-5 text-gray-400 transform translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                        />
                      </div>
                    </Link>
                  </Button>
                )}

                {canCreateEncounter && (
                  <CreateEncounterForm
                    patientId={patientData.id}
                    facilityId={facilityId}
                    patientName={patientData.name}
                    trigger={
                      <Button
                        variant="outline"
                        data-cy="create-encounter-button"
                        className="group relative h-[100px] md:h-[120px] overflow-hidden border-0 bg-linear-to-br from-emerald-50 to-teal-50 p-0 shadow-md hover:shadow-xl transition-all duration-300 justify-start"
                      >
                        <div className="w-full p-4 md:p-6">
                          <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                          <div className="relative flex w-full items-center gap-3 md:gap-4">
                            <div className="flex size-10 md:size-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <CareIcon
                                icon="l-stethoscope"
                                className="size-5 md:size-6 text-primary"
                              />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                                {t("create_encounter")}
                              </span>
                              <span className="text-xs md:text-sm text-gray-500 line-clamp-1">
                                {t("start_a_new_clinical_encounter")}
                              </span>
                            </div>
                            <CareIcon
                              icon="l-arrow-right"
                              className="ml-auto size-4 md:size-5 text-gray-400 transform translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                            />
                          </div>
                        </div>
                      </Button>
                    }
                  />
                )}

                {canCreateToken && (
                  <CreateTokenForm
                    patientId={patientData.id}
                    facilityId={facilityId}
                    patientName={patientData.name}
                    trigger={
                      <Button
                        variant="outline"
                        data-cy="create-token-button"
                        className="group relative h-[100px] md:h-[120px] overflow-hidden border-0 bg-linear-to-br from-amber-50 to-orange-50 p-0 shadow-md hover:shadow-xl transition-all duration-300 justify-start"
                      >
                        <div className="w-full p-4 md:p-6">
                          <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                          <div className="relative flex w-full items-center gap-3 md:gap-4">
                            <div className="flex size-10 md:size-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <CareIcon
                                icon="l-ticket"
                                className="size-5 md:size-6 text-primary"
                              />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                                {t("create_token")}
                              </span>
                              <span className="text-xs md:text-sm text-gray-500 line-clamp-1">
                                {t("generate_a_new_token")}
                              </span>
                            </div>
                            <CareIcon
                              icon="l-arrow-right"
                              className="ml-auto size-4 md:size-5 text-gray-400 transform translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                            />
                          </div>
                        </div>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          )}

          <PatientHomeTabs
            patientId={patientData.id}
            facilityId={facilityId}
            facilityPermissions={facility?.permissions ?? []}
            canListEncounters={canListEncounters}
            canCreateAppointment={canCreateAppointment}
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
