import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ENCOUNTER_CLASS_ICONS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

import { StatusBadge } from "./EncounterProperties";

interface Props {
  encounter: EncounterRead;
  canEdit: boolean;
}

export default function EncounterPropertiesTest({ encounter }: Props) {
  const [activeTab, setActiveTab] = useState("details");
  const { t } = useTranslation();
  const EncounterClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];

  const renderDetailsTab = () => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 bg-gray-100 border border-gray-200 rounded-md p-2">
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold">{t("encounter_details")}</span>
            <CareIcon icon="l-edit" className="size-6" />
          </div>
          <div className="flex flex-wrap gap-2 justify-between bg-white w-full p-2 rounded-md">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("status")}: </span>
              <div>
                <StatusBadge encounter={encounter} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {t("encounter_class")}:{" "}
              </span>
              <div>
                <Badge variant="teal" size="sm">
                  <EncounterClassIcon className="size-3" />
                  <span className="whitespace-nowrap">
                    {t(`encounter_class__${encounter.encounter_class}`)}
                  </span>
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("priority")}: </span>
              <div>
                <Badge variant="orange" size="sm">
                  <span className="whitespace-nowrap">
                    {t(`encounter_priority__${encounter.priority}`)}
                  </span>
                </Badge>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="hidden md:flex flex-col gap-1">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("start_date")}:
                </span>
                <div className="text-sm text-gray-950 font-semibold">
                  {encounter.period.start
                    ? format(encounter.period.start, "dd MMM yyyy hh:mma")
                    : ""}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-1">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("end_date")}:
                </span>
                <div className="text-sm text-gray-950 font-semibold">
                  {encounter.period.end
                    ? format(encounter.period.end, "dd MMM yyyy hh:mma")
                    : "(Ongoing)"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-gray-200 justify-between">
          <TabsTrigger value="details" className="w-full">
            {t("details")}
          </TabsTrigger>
          <TabsTrigger value="actions" className="w-full">
            {t("actions")}
          </TabsTrigger>
          <TabsTrigger value="reports" className="w-full">
            {t("reports")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {renderDetailsTab()}
          <Button variant="outline" size="lg" className="w-full mt-2">
            <CareIcon icon="l-edit" className="size-3" />
            <span className="text-sm font-semibold text-gray-950">
              {t("update_details")}
            </span>
          </Button>
        </TabsContent>

        <TabsContent value="actions">{t("actions")}</TabsContent>

        <TabsContent value="reports">{t("reports")}</TabsContent>
      </Tabs>
    </div>
  );
}
