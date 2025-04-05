import { t } from "i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Encounter } from "@/types/emr/encounter";

import ObservationsList from "./ObservationsList";
import QuickAccess from "./QuickAccess";

interface Props {
  encounter: Encounter;
  canAccess: boolean;
  canEdit: boolean;
}

export default function SideOverview(props: Props) {
  return (
    <div className="mt-4 flex w-full h-auto flex-col gap-4 text-sm">
      <Tabs defaultValue="quick_access" className="w-full">
        <div className="px-2">
          <TabsList className="h-9">
            <TabsTrigger value="quick_access" className="font-semibold">
              {t("quick_access")}
            </TabsTrigger>
            <TabsTrigger value="observations" className="font-semibold">
              {t("observations")}
            </TabsTrigger>
          </TabsList>
        </div>

        <div>
          <TabsContent value="quick_access" className="p-2">
            <QuickAccess encounter={props.encounter} canEdit={props.canEdit} />
          </TabsContent>
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
