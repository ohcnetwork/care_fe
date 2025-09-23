import QuestionnaireResponsesList, {
  ResponseCard,
} from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ResponsesCardProps {
  response: QuestionnaireResponse;
  isActive: boolean;
  onClick: () => void;
  showTitle?: boolean;
}
function ResponsesCard({
  response,
  isActive,
  onClick,
  showTitle = true,
}: ResponsesCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer p-3 text-sm border hover:border-primary-500 transition-colors",
        isActive && "border-primary-600 bg-primary-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          {showTitle && (
            <div className="mt-1 font-medium pb-1">
              {response.questionnaire?.title}
            </div>
          )}
          <div className="font-medium text-xs">
            {formatDateTime(response.created_date)}
          </div>
          <div className="text-gray-600">
            {t("filed_by")}{" "}
            <span className="font-medium text-gray-800">
              {formatName(response.created_by)}
            </span>
          </div>
        </div>
        {isActive && <ArrowRight className="size-4 text-gray-500" />}
      </div>
    </Card>
  );
}

interface LeftPanelProps {
  encounter: any;
  patientId: string;
  canAccess: boolean;
  responseId?: string;
  selectedQuestionnaireTitle: string;
  selectedQuestionnaire: any | null;
  setSelectedQuestionnaireTitle: (title: string) => void;
  setQueryParams: (params: any) => void;
  onResponseClick: (response: QuestionnaireResponse) => void;
}

function LeftPanel({
  encounter,
  patientId,
  canAccess,
  responseId,
  selectedQuestionnaireTitle,
  selectedQuestionnaire,
  setSelectedQuestionnaireTitle,
  setQueryParams,
  onResponseClick,
}: LeftPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative w-full pb-2">
        <QuestionnaireSearch
          placeholder={
            selectedQuestionnaire
              ? selectedQuestionnaireTitle || selectedQuestionnaire.title
              : t("select_questionnaire")
          }
          subjectType="encounter"
          onSelect={(q) => {
            setQueryParams({ questionnaireId: q.id });
            setSelectedQuestionnaireTitle(q.title);
          }}
          trigger={
            <Button
              variant="outline"
              role="combobox"
              className="w-full border border-primary-600 justify-between h-auto min-h-[2.5rem] py-2"
            >
              <div className="flex justify-start items-center gap-2 text-primary-800 flex-1">
                <span className="text-left whitespace-normal break-words">
                  {selectedQuestionnaire
                    ? selectedQuestionnaireTitle || selectedQuestionnaire.title
                    : t("select_questionnaire")}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {selectedQuestionnaire && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQueryParams({});
                      setSelectedQuestionnaireTitle("");
                    }}
                    className="h-5 w-5 p-0 hover:bg-gray-100"
                  >
                    <X className="size-4" />
                  </Button>
                )}
                {!selectedQuestionnaire && (
                  <ChevronDown className="size-4 flex-shrink-0" />
                )}
              </div>
            </Button>
          }
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <QuestionnaireResponsesList
          encounter={encounter}
          patientId={patientId}
          canAccess={canAccess}
          questionnaireId={selectedQuestionnaire?.id}
          renderItem={(response: QuestionnaireResponse) => (
            <ResponsesCard
              response={response}
              isActive={responseId === response.id}
              onClick={() => onResponseClick(response)}
              showTitle={!selectedQuestionnaire}
            />
          )}
        />
      </div>
    </>
  );
}

export const EncounterResponsesTab = () => {
  const {
    selectedEncounter: encounter,
    patientId,
    canReadSelectedEncounter: canAccess,
  } = useEncounter();
  const { t } = useTranslation();
  const [qParams, setQueryParams] = useQueryParams<{
    questionnaireId?: string;
    responseId?: string;
  }>();

  const { questionnaireId, responseId } = qParams;

  const selectedQuestionnaire = questionnaireId
    ? {
        id: questionnaireId,
        slug: "",
        questions: [],
        title: "",
        status: "active",
        subject_type: "encounter",
        tags: [],
      }
    : null;

  const [selectedQuestionnaireTitle, setSelectedQuestionnaireTitle] =
    useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, md: false });

  const handleResponseClick = (response: QuestionnaireResponse) => {
    setQueryParams({ ...qParams, responseId: response.id });
    window.location.hash = `#response-${response.id}`;
    if (isMobile) setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="hidden md:flex md:w-1/5 flex flex-col gap-3 pt-1 md:h-full md:overflow-y-auto">
        <LeftPanel
          encounter={encounter}
          patientId={patientId}
          canAccess={canAccess}
          responseId={responseId}
          selectedQuestionnaire={selectedQuestionnaire}
          selectedQuestionnaireTitle={selectedQuestionnaireTitle}
          setSelectedQuestionnaireTitle={setSelectedQuestionnaireTitle}
          setQueryParams={setQueryParams}
          onResponseClick={handleResponseClick}
        />
      </div>
      {isMobile && (
        <div className="p-3 border-b md:hidden flex justify-center">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Menu className="h-4 w-4 mr-2" />
                {t("view_responses")}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              className="h-[85vh]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <ScrollArea className="h-full">
                <div className="p-3 h-full">
                  <LeftPanel
                    encounter={encounter}
                    patientId={patientId}
                    canAccess={canAccess}
                    responseId={responseId}
                    selectedQuestionnaire={selectedQuestionnaire}
                    selectedQuestionnaireTitle={selectedQuestionnaireTitle}
                    setSelectedQuestionnaireTitle={
                      setSelectedQuestionnaireTitle
                    }
                    setQueryParams={setQueryParams}
                    onResponseClick={handleResponseClick}
                  />
                </div>
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </div>
      )}
      <div className="flex-1 h-full overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-3 overflow-anchor-auto">
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={patientId}
              canAccess={canAccess}
              questionnaireId={selectedQuestionnaire?.id}
              renderItem={(response: QuestionnaireResponse) => {
                return (
                  <div
                    key={response.id}
                    id={`response-${response.id}`}
                    className="scroll-mt-24 [overflow-anchor:auto]"
                  >
                    <Card
                      className={cn(
                        "shadow-sm border rounded-lg",
                        responseId === response.id && "ring-2 ring-primary-500",
                      )}
                    >
                      <ResponseCard
                        item={response}
                        onTitleClick={(qid) => {
                          setQueryParams({ questionnaireId: qid });
                          setSelectedQuestionnaireTitle(
                            response.questionnaire?.title || "",
                          );
                        }}
                      />
                    </Card>
                  </div>
                );
              }}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
