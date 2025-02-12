import { t } from "i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";

import ObservationsList from "./ObservationsList";
import QuickAccess from "./QuickAccess";

interface Props {
  encounter: Encounter;
  canAccess: boolean;
}

export default function SideOverview(props: Props) {
  const authUser = useAuthUser();
  const { hasPermission } = usePermissions();
  const { canSubmitEncounterQuestionnaire } = getPermissions(
    hasPermission,
    authUser.permissions,
  );
  const canWrite =
    canSubmitEncounterQuestionnaire &&
    !inactiveEncounterStatus.includes(props.encounter.status);

  return (
    <div className="mt-4 flex w-full h-auto flex-col gap-4 text-sm">
      <Tabs
        defaultValue={canWrite ? "quick_access" : "observations"}
        className="w-full"
      >
        <div className="px-2">
          <TabsList className="h-9">
            {canWrite && (
              <TabsTrigger value="quick_access" className="font-semibold">
                {t("quick_access")}
              </TabsTrigger>
            )}
            <TabsTrigger value="observations" className="font-semibold">
              {t("observations")}
            </TabsTrigger>
          </TabsList>
        </div>

        <div>
          {canWrite && (
            <TabsContent value="quick_access" className="p-2">
              <QuickAccess encounter={props.encounter} />
            </TabsContent>
          )}
          <TabsContent value="observations" className="p-2">
            <ObservationsList
              encounter={props.encounter}
              canAccess={props.canAccess}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
