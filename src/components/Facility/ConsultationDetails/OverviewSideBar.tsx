import { EditIcon, NotebookPen } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import EncounterProperties from "@/pages/Encounters/EncounterProperties";
import { Encounter } from "@/types/emr/encounter";

interface Props {
  encounter: Encounter;
  canAccess: boolean;
  canEdit: boolean;
}

export default function SideOverview({ encounter, canEdit }: Props) {
  return (
    <div className="w-full max-w-[18rem] flex flex-col gap-4">
      <EncounterProperties encounter={encounter} canEdit={canEdit} />
      <div className="flex flex-col gap-8 mt-6">
        <Separator className="bg-slate-200" />
        <EncounterActions />
        <EncounterQuestionnaire canEdit={canEdit} encounter={encounter} />
        <EncounterLocation canEdit={canEdit} encounter={encounter} />
      </div>
    </div>
  );

  // return (
  //   <div className="mt-4 flex w-full h-auto flex-col gap-4 text-sm">
  //     <Tabs defaultValue="quick_access" className="w-full">
  //       <div className="px-2">
  //         <TabsList className="h-9">
  //           <TabsTrigger value="quick_access" className="font-semibold">
  //             {t("quick_access")}
  //           </TabsTrigger>
  //           <TabsTrigger value="observations" className="font-semibold">
  //             {t("observations")}
  //           </TabsTrigger>
  //         </TabsList>
  //       </div>

  //       <div>
  //         <TabsContent value="quick_access" className="p-2">
  //           <QuickAccess encounter={props.encounter} canEdit={props.canEdit} />
  //         </TabsContent>
  //         <TabsContent value="observations" className="p-2">
  //           <ObservationsList
  //             encounter={props.encounter}
  //             canAccess={props.canAccess}
  //           />
  //         </TabsContent>
  //       </div>
  //     </Tabs>
  //   </div>
  // );
}

const EncounterActions = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h6 className="text-black font-semibold mb-2">{t("actions")}</h6>
      <div className="flex flex-col gap-3">
        <Button variant="outline" className="justify-start">
          <NotebookPen />
          {t("manage_consents")}
        </Button>
        <Button variant="outline" className="justify-start">
          <NotebookPen />
          {t("manage_care_team")}
        </Button>
        <Button variant="outline" className="justify-start">
          <NotebookPen />
          {t("treatment_summary")}
        </Button>
        <Button variant="outline" className="justify-start">
          <NotebookPen />
          {t("discharge_summary")}
        </Button>
      </div>
    </div>
  );
};

const EncounterQuestionnaire = ({
  canEdit,
  encounter,
}: {
  canEdit: boolean;
  encounter: Encounter;
}) => {
  const { t } = useTranslation();

  const questionnaireOptions = useQuestionnaireOptions(
    "encounter_actions",
    canEdit,
  );

  return (
    <div>
      <h6 className="text-black font-semibold mb-2">{t("questionnaire")}</h6>
      <div className="flex flex-col gap-3">
        {questionnaireOptions.map((option) => (
          <Button
            key={option.slug}
            variant="outline"
            className="justify-start whitespace-break-spaces text-left"
            onClick={() =>
              navigate(
                `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/${option.slug}`,
              )
            }
          >
            <NotebookPen />
            {t(option.title)}
          </Button>
        ))}
        <QuestionnaireSearch
          placeholder={t("choose_questionnaire")}
          subjectType="encounter"
        />
      </div>
    </div>
  );
};

const EncounterLocation = ({
  canEdit,
  encounter,
}: {
  canEdit: boolean;
  encounter: Encounter;
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center">
        <h6 className="text-black font-semibold mb-2">{t("location")}</h6>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <Button
              variant="link"
              className="text-gray-950 underline font-semibold underline-offset-2"
            >
              <CareIcon icon="l-history" className="text-gray-700" />
              {t("history")}
            </Button>
          }
        />
      </div>
      <div className="bg-gray-100 border border-gray-200 rounded-lg mt-2 p-2">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <p className="text-gray-500 text-sm">{t("no_location_associated")}</p>
        )}
        {canEdit && (
          <LocationSheet
            facilityId={encounter.facility.id}
            history={encounter.location_history}
            encounter={encounter}
            trigger={
              <Button variant="outline" className="w-full mt-3">
                <EditIcon className="size-4" />
                {encounter.current_location
                  ? t("update_location")
                  : t("add_location")}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};
