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
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface LeftCardProps {
  response: QuestionnaireResponse;
  isActive: boolean;
  onClick: () => void;
  showTitle?: boolean;
}
function LeftCard({
  response,
  isActive,
  onClick,
  showTitle = true,
}: LeftCardProps) {
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
  encounterId?: string;
  patientId: string;
  canAccess: boolean;
  responseId?: string;
  selectedQuestionnaireTitle: string;
  questionnaireId?: string;
  setSelectedQuestionnaireTitle: (title: string) => void;
  setQueryParams: (params: any) => void;
  onResponseClick: (response: QuestionnaireResponse) => void;
}

function LeftPanel({
  encounterId,
  patientId,
  canAccess,
  responseId,
  selectedQuestionnaireTitle,
  questionnaireId,
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
            questionnaireId
              ? selectedQuestionnaireTitle
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
                  {questionnaireId
                    ? selectedQuestionnaireTitle
                    : t("select_questionnaire")}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {questionnaireId && (
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
                {!questionnaireId && (
                  <ChevronDown className="size-4 flex-shrink-0" />
                )}
              </div>
            </Button>
          }
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <QuestionnaireResponsesList
          encounterId={encounterId}
          patientId={patientId}
          canAccess={canAccess}
          questionnaireId={questionnaireId}
          renderItem={(response: QuestionnaireResponse) => (
            <LeftCard
              response={response}
              isActive={responseId === response.id}
              onClick={() => onResponseClick(response)}
              showTitle={!questionnaireId}
            />
          )}
        />
      </div>
    </>
  );
}

interface EncounterResponsesTabProps {
  patientId: string;
  encounterId?: string;
  canAccess?: boolean;
}

export const EncounterResponsesTab = ({
  patientId,
  encounterId,
  canAccess = true,
}: EncounterResponsesTabProps) => {
  const { t } = useTranslation();
  const [qParams, setQueryParams] = useQueryParams<{
    questionnaireId?: string;
    responseId?: string;
  }>();

  const { questionnaireId, responseId } = qParams;

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
          encounterId={encounterId}
          patientId={patientId}
          canAccess={canAccess}
          responseId={responseId}
          questionnaireId={questionnaireId}
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
                <Menu className="size-4 mr-2" />
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
                    encounterId={encounterId}
                    patientId={patientId}
                    canAccess={canAccess}
                    responseId={responseId}
                    questionnaireId={questionnaireId}
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
        <ScrollArea key={questionnaireId} className="h-full">
          <div className="space-y-4 p-3 overflow-anchor-auto">
            <QuestionnaireResponsesList
              encounterId={encounterId}
              patientId={patientId}
              canAccess={canAccess}
              questionnaireId={questionnaireId}
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
                        showTitle={!questionnaireId}
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
