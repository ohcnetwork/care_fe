import { format } from "date-fns";
import { t } from "i18next";
import { useState } from "react";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeDatePicker } from "@/components/ui/relative-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface DateQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  classes?: string;
}

export function DateQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
}: DateQuestionProps) {
  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    "absolute",
  );
  const currentValue = questionnaireResponse.values[0]?.value
    ? new Date(questionnaireResponse.values[0].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    clearError();
    updateQuestionnaireResponseCB(
      [
        {
          type: "dateTime",
          value: date,
        },
      ],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const handleRelativeDateChange = (date: Date) => {
    handleSelect(date);
  };

  return (
    <div className="flex sm:gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !currentValue && "text-gray-500",
              classes,
            )}
            disabled={disabled}
          >
            <CareIcon icon="l-calender" className="mr-2 size-4" />
            {currentValue ? format(currentValue, "PPP") : t("pick_a_date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "absolute" | "relative")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="absolute">{t("absolute_date")}</TabsTrigger>
              <TabsTrigger value="relative">{t("relative_date")}</TabsTrigger>
            </TabsList>
            <TabsContent value="absolute" className="p-0">
              <Calendar
                mode="single"
                selected={currentValue}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="relative" className="p-0">
              <RelativeDatePicker
                value={currentValue}
                onDateChange={handleRelativeDateChange}
              />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
