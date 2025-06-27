import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { EncounterCard } from "@/components/Facility/EncounterCard";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import {
  isOfflineId,
  normalizeOfflineEncounterRecord,
  normalizeOfflinePatientRecord,
} from "@/OfflineSupport/offlineWriteHelpers";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { formatPatientAge } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/patient";

interface SearchPatientParams {
  phone_number: string;
  year_of_birth: string;
  partial_id: string;
}

export default function VerifyPatient(props: { facilityId: string }) {
  const db = new AppCacheDB();
  const { t } = useTranslation();
  const [qParams] = useQueryParams();
  const { phone_number, year_of_birth, partial_id } = qParams;
  const { goBack } = useAppHistory();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [offlinePatientPayload, setOfflinePatientPayload] =
    useState<Patient | null>(null);
  const [newofflineEncounters, setNewOfflineEncounters] = useState<Encounter[]>(
    [],
  );
  const [offlineUpdatedEncounters, setOfflineUpdatedEncounters] = useState<
    OfflineWritesEntry[]
  >([]);
  const [hasReachedEncounterLimitOffline, sethasReachedEncounterLimitOffline] =
    useState(false);

  const { data: patientverificationdata } = useQuery<Patient>({
    queryKey: ["PatientVerification", phone_number, year_of_birth, partial_id],
    queryFn: async () => {
      throw new Error("Should not fetch online");
    },
    meta: { persist: true },
    networkMode: "online",
    enabled: false,
  });

  const { data: facilityData, isLoading: facilityLoading } = useQuery({
    queryKey: ["facility", props.facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: props.facilityId },
    }),
    meta: { persist: true },
    networkMode: "online",
  });
  console.log("facility ddata :", facilityData);
  const { canCreateAppointment, canCreateEncounter, canListEncounters } =
    getPermissions(hasPermission, facilityData?.permissions ?? []);

  const {
    mutate: verifyPatient,
    data: onlinepatientData,
    isPending: isVerifyingPatient,
    isError,
  } = useMutation<Patient, HTTPError, SearchPatientParams>({
    mutationFn: mutate(routes.patient.search_retrieve),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["PatientVerification", phone_number, year_of_birth, partial_id],
        data,
      );
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      errorData.errors.msg.forEach((er) => {
        toast.error(er);
      });
    },
  });

  const patientData = onlineManager.isOnline()
    ? onlinepatientData
    : (patientverificationdata ??
      (isOfflineId(partial_id) ? offlinePatientPayload : null));

  const { data: encounters, isLoading: encounterLoading } = useQuery({
    queryKey: ["encounters", "live", patientData?.id],
    queryFn: query(routes.encounter.list, {
      queryParams: {
        patient: patientData?.id,
        live: false,
      },
      silent: true,
    }),
    meta: { persist: true },
    networkMode: "online",
    enabled: !!patientData?.id && canListEncounters,
  });

  const { data: closedEncounters } = useQuery({
    queryKey: ["encounters", "closed", patientData?.id],
    queryFn: query(routes.encounter.list, {
      queryParams: {
        patient: patientData?.id,
        live: true,
      },
      silent: true,
    }),
    enabled: !!patientData?.id && canListEncounters,
  });

  useEffect(() => {
    if (!patientData) return;

    queryClient.setQueryData(["patient", patientData.id], patientData);
  }, [patientData, queryClient]);

  useEffect(() => {
    const loadOfflinePatient = async () => {
      if (!onlineManager.isOnline() && isOfflineId(partial_id)) {
        try {
          const record = await db.OfflineWrites.get(partial_id);
          if (record) {
            const normalized = normalizeOfflinePatientRecord(
              record,
              queryClient,
            );
            setOfflinePatientPayload(normalized);
          }
        } catch (error) {
          console.error("Error while fetching patient record", error);
          toast.error(t("offline_patient_payload_fetch_error"));
        }
      }
    };
    loadOfflinePatient();
  }, [partial_id, queryClient]);

  console.log("patient,", newofflineEncounters);
  useEffect(() => {
    const loadOfflineEncounters = async () => {
      if (!patientData?.id || !facilityData) return;

      try {
        const allWrites = await db.OfflineWrites.where("type")
          .equals("createEncounter")
          .toArray();
        const patientEncounters = allWrites.filter((entry) => {
          const payload = entry.payload as any;
          return (
            payload?.patient === patientData.id ||
            entry.parentMutationIds?.includes(patientData.id)
          );
        });

        const normalized = patientEncounters.map((entry) =>
          normalizeOfflineEncounterRecord(entry, patientData),
        );
        setNewOfflineEncounters(normalized);

        // 2. Load updateEncounter writes
        const updateWrites = await db.OfflineWrites.where("type")
          .equals("markAsCompleteEncounter")
          .toArray();

        const offlineEncounterUpdates = updateWrites.filter((entry) => {
          const payload = entry.payload as any;
          return payload?.patient === patientData.id;
        });

        setOfflineUpdatedEncounters(offlineEncounterUpdates);
      } catch (error) {
        console.error("Failed to load offline encounters:", error);
        toast.error(t("offline_encounter_payload_fetch_error"));
      }
    };

    if (!onlineManager.isOnline()) {
      loadOfflineEncounters();
    }
  }, [patientData, facilityData]);

  const FinalOfflinEncounters = useMemo(() => {
    if (!patientData && onlineManager.isOnline()) return [];

    const offlineUpdateMap = new Map(
      offlineUpdatedEncounters.map((entry: any) => [
        entry.id,
        entry?.payload?.status,
      ]),
    );

    const patchedSyncedEncounters = (encounters?.results ?? []).map((enc) =>
      offlineUpdateMap.has(enc.id)
        ? {
            ...enc,
            status: offlineUpdateMap.get(enc.id),
            isUpdatedOffline: true,
          }
        : enc,
    );

    return [...patchedSyncedEncounters, ...newofflineEncounters];
  }, [
    encounters?.results,
    offlineUpdatedEncounters,
    newofflineEncounters,
    patientData,
  ]);

  useEffect(() => {
    if (!onlineManager.isOnline() && FinalOfflinEncounters) {
      const activeCount = FinalOfflinEncounters.filter(
        (encounter) =>
          !inactiveEncounterStatus.includes(
            encounter.status as (typeof inactiveEncounterStatus)[number],
          ),
      ).length;

      sethasReachedEncounterLimitOffline(activeCount >= 5);
    } else {
      sethasReachedEncounterLimitOffline(false);
    }
  }, [FinalOfflinEncounters]);

  useEffect(() => {
    if (
      onlineManager.isOnline() &&
      phone_number &&
      year_of_birth &&
      partial_id
    ) {
      verifyPatient({
        phone_number,
        year_of_birth,
        partial_id,
      });
    }
  }, [phone_number, year_of_birth, partial_id, verifyPatient]);

  const Encounters = onlineManager.isOnline()
    ? encounters?.results
    : FinalOfflinEncounters;

  if (isVerifyingPatient || facilityLoading || encounterLoading) {
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
                      <h1
                        data-cy="verify-patient-name"
                        className="text-xl font-bold capitalize text-gray-950"
                      >
                        {patientData.name}
                        {isOfflineId(patientData.id) && (
                          <Badge
                            variant="outline"
                            className="ml-2 py-0 border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
                          >
                            <h3 className="text-xs font-medium">
                              {t("Pending_sync")}
                            </h3>
                          </Badge>
                        )}
                      </h1>

                      <h3 className="text-sm font-medium text-gray-600">
                        {formatPatientAge(patientData, true)},{"  "}
                        <span className="capitalize">
                          {patientData.gender.replace("_", " ")}
                        </span>
                        {patientData.blood_group &&
                          ", " + patientData.blood_group.replace("_", " ")}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {(canCreateAppointment || canCreateEncounter) && (
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
              <CardContent className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {canCreateAppointment && (
                  <Button
                    asChild
                    variant="outline"
                    className="group relative h-[100px] md:h-[120px] overflow-hidden border-0 bg-linear-to-br from-blue-50 to-indigo-50 p-0 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <Link
                      href={`/facility/${props.facilityId}/patient/${patientData.id}/book-appointment`}
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
                    facilityId={props.facilityId}
                    patientName={patientData.name}
                    hasReachedEncounterLimitOffline={
                      hasReachedEncounterLimitOffline
                    }
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
              </CardContent>
            </Card>
          )}

          {canListEncounters && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("active_encounters")}</CardTitle>
                <CardDescription>
                  {t("view_and_manage_patient_encounters")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-2">
                {Encounters && Encounters.length > 0 ? (
                  <>
                    {Encounters.map((encounter: Encounter) => (
                      <EncounterCard
                        encounter={encounter}
                        key={encounter.id}
                        permissions={facilityData?.permissions ?? []}
                        facilityId={
                          encounter.facility.id === props.facilityId
                            ? props.facilityId
                            : undefined
                        }
                      />
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center border rounded-lg border-dashed">
                    <div className="rounded-full bg-primary/10 p-2 md:p-3 mb-3 md:mb-4">
                      <CareIcon
                        icon="l-folder-open"
                        className="size-5 md:size-6 text-primary"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">
                      {t("no_active_encounters_found")}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      {t("create_a_new_encounter_to_get_started")}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardHeader className="pb-2">
                <CardTitle>{t("completed_encounters")}</CardTitle>
                <CardDescription>
                  {t("view_completed_encounters")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-2">
                {closedEncounters?.results &&
                closedEncounters.results.length > 0 ? (
                  <>
                    {closedEncounters.results.map((encounter: Encounter) => (
                      <EncounterCard
                        encounter={encounter}
                        key={encounter.id}
                        permissions={facilityData?.permissions ?? []}
                        facilityId={
                          encounter.facility.id === props.facilityId
                            ? props.facilityId
                            : undefined
                        }
                      />
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center border rounded-lg border-dashed">
                    <div className="rounded-full bg-primary/10 p-2 md:p-3 mb-3 md:mb-4">
                      <CareIcon
                        icon="l-folder-open"
                        className="size-5 md:size-6 text-primary"
                      />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">
                      {t("no_completed_encounters_found")}
                    </h3>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
                onClick={() => goBack(`/facility/${props.facilityId}/patients`)}
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
