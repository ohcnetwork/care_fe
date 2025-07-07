import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Question } from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";

interface PropertyDiffCardProps {
  property: string;
  currentValue: string;
  newValue: string;
}

const PropertyDiffCard = ({
  property,
  currentValue,
  newValue,
}: PropertyDiffCardProps) => {
  if (!currentValue && !newValue) {
    return null;
  }

  if (currentValue === newValue) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label>{property}</Label>
            <span className="text-sm">{newValue}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="space-y-2">
          <Label>{property}</Label>
          <div className="text-sm">
            {currentValue && (
              <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 p-2 rounded-md">
                <div className="w-3">
                  <Minus className="size-3 text-red-500" />
                </div>
                <span className="whitespace-pre-wrap">{currentValue}</span>
              </div>
            )}
            {newValue && (
              <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 p-2 rounded-md mt-1">
                <div className="w-3">
                  <Plus className="size-3 text-green-500" />
                </div>
                <span className="whitespace-pre-wrap">{newValue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuestionnaireDetailDiff {
  existingData: QuestionnaireDetail;
  newData: QuestionnaireDetail;
}

const QuestionnairePropertyDiff = ({
  existingData,
  newData,
}: QuestionnaireDetailDiff) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <PropertyDiffCard
        property={t("title")}
        currentValue={existingData.title}
        newValue={newData.title}
      />
      <PropertyDiffCard
        property={t("description")}
        currentValue={existingData.description ?? ""}
        newValue={newData.description ?? ""}
      />
      <PropertyDiffCard
        property={t("slug")}
        currentValue={existingData.slug}
        newValue={newData.slug}
      />
      {/* Currently not in use*/}
      {/* <PropertyDiffCard
        property={t("version")}
        currentValue={existingData.version ?? ""}
        newValue={newData.version ?? ""}
      /> */}
      <PropertyDiffCard
        property={t("status")}
        currentValue={t(existingData.status)}
        newValue={t(newData.status)}
      />
      <PropertyDiffCard
        property={t("subject_type")}
        currentValue={t(existingData.subject_type)}
        newValue={t(newData.subject_type)}
      />
    </div>
  );
};

const QuestionnaireQuestions = ({ questions }: { questions: Question[] }) => {
  const { t } = useTranslation();

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
        <CareIcon icon="l-info-circle" className="size-8 text-gray-400 mb-2" />
        <p className="text-gray-600 font-medium">
          {t("no_questions_to_import")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-md font-medium text-green-700 flex items-center gap-2">
        <Plus className="w-4 h-4" />
        {t("new_questions")} ({questions.length})
      </div>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <Card key={question.id} className="shadow-none">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">
                      {index + 1}. {question.text}
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-semibold rounded-full capitalize"
                    >
                      {question.type}
                      {question.type === "group" &&
                        ` (${question.questions?.length} ${t("sub_questions")})`}
                    </Badge>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-500 text-sm">
                      {question.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-xs mt-1">
                  {question.required && (
                    <Badge variant="destructive" className="rounded-full">
                      {t("required")}
                    </Badge>
                  )}
                  {question.repeats && (
                    <Badge variant="blue" className="ml-1 rounded-full">
                      {t("repeatable")}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const QuestionnaireImportPreview = ({
  existingData,
  newData,
}: QuestionnaireDetailDiff) => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="properties" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="properties">{t("properties")}</TabsTrigger>
        <TabsTrigger value="questions">
          {t("questions")} ({newData.questions.length})
        </TabsTrigger>
      </TabsList>
      <ScrollArea className="h-[calc(100vh-15rem)] md:h-[calc(100vh-24rem)] overflow-y-auto pr-2">
        <TabsContent value="properties" className="mt-4">
          <QuestionnairePropertyDiff
            existingData={existingData}
            newData={newData}
          />
        </TabsContent>
        <TabsContent value="questions" className="mt-4">
          <QuestionnaireQuestions questions={newData.questions} />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
};
