import React, { useState } from "react";
import {
  CareQuestionnaireItem,
  CareQuestionnaireResponse,
  SavedQuestionnaire,
} from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface FHIRQuestionnaireProps {
  questionnaire: SavedQuestionnaire;
  onSubmit: (response: CareQuestionnaireResponse) => void;
}

export const FHIRQuestionnaire: React.FC<FHIRQuestionnaireProps> = ({
  questionnaire,
  onSubmit,
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const { t } = useTranslation();

  const handleInputChange = (linkId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [linkId]: value }));
  };

  const renderQuestionnaireItem = (item: CareQuestionnaireItem) => {
    switch (item.type) {
      case "string":
      case "integer":
        return (
          <div className="mb-4">
            <Label htmlFor={item.linkId}>{item.text}</Label>
            <Input
              id={item.linkId}
              type={item.type === "integer" ? "number" : "text"}
              value={responses[item.linkId] || ""}
              onChange={(e) => handleInputChange(item.linkId, e.target.value)}
              required={item.required}
            />
          </div>
        );
      case "text":
        return (
          <div className="mb-4">
            <Label htmlFor={item.linkId}>{item.text}</Label>
            <Textarea
              id={item.linkId}
              value={responses[item.linkId] || ""}
              onChange={(e) => handleInputChange(item.linkId, e.target.value)}
              required={item.required}
            />
          </div>
        );
      case "coding":
        if (item.repeats) {
          return (
            <div className="mb-4">
              <Label>{item.text}</Label>
              {item.answerOption?.map((option) => (
                <div
                  key={option.valueCoding?.code}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${item.linkId}-${option.valueCoding?.code}`}
                    checked={(responses[item.linkId] || []).includes(
                      option.valueCoding?.code,
                    )}
                    onCheckedChange={(checked) => {
                      const currentValues = responses[item.linkId] || [];
                      const newValues = checked
                        ? [...currentValues, option.valueCoding?.code]
                        : currentValues.filter(
                            (v: string) => v !== option.valueCoding?.code,
                          );
                      handleInputChange(item.linkId, newValues);
                    }}
                  />
                  <Label htmlFor={`${item.linkId}-${option.valueCoding?.code}`}>
                    {option.valueCoding?.display}
                  </Label>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <div className="mb-4">
              <Label>{item.text}</Label>
              <RadioGroup
                onValueChange={(value) => handleInputChange(item.linkId, value)}
                value={responses[item.linkId] || ""}
              >
                {item.answerOption?.map((option) => (
                  <div
                    key={option.valueCoding?.code}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={option.valueCoding?.code || ""}
                      id={`${item.linkId}-${option.valueCoding?.code}`}
                    />
                    <Label
                      htmlFor={`${item.linkId}-${option.valueCoding?.code}`}
                    >
                      {option.valueCoding?.display}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        }
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const questionnaireResponse: CareQuestionnaireResponse = {
      resourceType: "QuestionnaireResponse",
      questionnaire: questionnaire.id,
      status: "completed",
      careVersion: questionnaire.careVersion,
      item: questionnaire.item?.map((item: CareQuestionnaireItem) => ({
        linkId: item.linkId,
        text: item.text,
        answer: [{ valueString: responses[item.linkId] }],
      })),
    };
    onSubmit(questionnaireResponse);
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{questionnaire.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {questionnaire.item?.map((item: CareQuestionnaireItem) => (
            <div key={item.linkId}>{renderQuestionnaireItem(item)}</div>
          ))}
          <CardFooter className="flex justify-end">
            <Button type="submit">{t("Submit")}</Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};
