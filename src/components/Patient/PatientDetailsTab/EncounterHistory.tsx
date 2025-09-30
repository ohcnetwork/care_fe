import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import { TimelineEncounterCard } from "@/components/Facility/EncounterCard";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { TimelineWrapper } from "@/components/Common/TimelineWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/context/PermissionContext";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { CaptionsOff, PlusIcon } from "lucide-react";

const EncounterHistory = (props: PatientProps) => {
  const { patientData, facilityId } = props;
  const patientId = patientData.id;
  useShortcutSubContext("facility:patient:home");

  const { t } = useTranslation();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();
  const { hasPermission } = usePermissions();
  const { canViewPatients } = getPermissions(
    hasPermission,
    patientData.permissions,
  );
  const { goBack } = useAppHistory();

  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounterHistory", patientId, qParams],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        limit: 5,
        offset: ((qParams.page ?? 1) - 1) * 5,
      },
    }),
    enabled: canViewPatients,
  });

  useEffect(() => {
    if (!canViewPatients) {
      toast.error(t("no_permission_to_view_page"));
      goBack(`/facility/${facilityId}/patient/${patientId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewPatients]);

  return (
    <div className="mt-8">
      <div>
        {isLoading ? (
          <div>
            <div className="grid gap-5">
              <CardListSkeleton count={5} />
            </div>
          </div>
        ) : (
          <div>
            {encounterData?.results?.length === 0 ? (
              facilityId ? (
                <div className="p-2">
                  <EmptyState
                    title={t("no_active_encounters_found")}
                    description={t("create_a_new_encounter_to_get_started")}
                    icon={<CaptionsOff className="size-5 text-primary m-1" />}
                    action={
                      <CreateEncounterForm
                        facilityId={facilityId}
                        patientId={patientId}
                        patientName={patientData.name}
                        trigger={
                          <Button>
                            <PlusIcon />
                            {t("create_encounter")}
                            <ShortcutBadge actionId="create-encounter" />
                          </Button>
                        }
                      />
                    }
                  />
                </div>
              ) : (
                <div className="p-2">
                  <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
                    <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                      <div className="h-full flex w-full items-center justify-center">
                        <span className="text-sm text-gray-500">
                          {t("no_encounters_found")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <ul className="grid gap-4">
                <TimelineWrapper>
                  {encounterData?.results?.map((encounter) => (
                    <li key={encounter.id} className="w-full">
                      <TimelineEncounterCard
                        key={encounter.id}
                        encounter={encounter}
                        permissions={patientData.permissions ?? []}
                        facilityId={facilityId}
                      />
                    </li>
                  ))}
                </TimelineWrapper>
                <div className="flex w-full items-center justify-center">
                  <div
                    className={cn(
                      "flex w-full justify-center",
                      (encounterData?.count ?? 0) > 5 ? "visible" : "invisible",
                    )}
                  >
                    <PaginationComponent
                      cPage={qParams.page ?? 1}
                      defaultPerPage={5}
                      data={{ totalCount: encounterData?.count ?? 0 }}
                      onChange={(page) => setQueryParams({ page })}
                    />
                  </div>
                </div>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EncounterHistory;
