import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import {
  Control,
  Controller,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import { ReportTemplateFormData } from "@/pages/Encounters/ReportBuilder/schema";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

interface SectionBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
  facilityId: string;
}

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  diagnosis: "REPORT_BUILDER_SECTION_DIAGNOSIS",
  symptom: "REPORT_BUILDER_SECTION_SYMPTOM",
  allergy_intolerance: "REPORT_BUILDER_SECTION_ALLERGY",
  observation: "REPORT_BUILDER_SECTION_OBSERVATION",
  medication_request: "REPORT_BUILDER_SECTION_MEDICATION",
  patient_info: "REPORT_BUILDER_SECTION_PATIENT_INFO",
  care_team: "REPORT_BUILDER_SECTION_CARE_TEAM",
  file_upload: "REPORT_BUILDER_SECTION_FILE_UPLOAD",
  encounter: "REPORT_BUILDER_SECTION_ENCOUNTER",
  discharge_summary_advice: "REPORT_BUILDER_SECTION_DISCHARGE_ADVICE",
  custom_section: "REPORT_BUILDER_SECTION_CUSTOM",
};

const SectionFields = React.memo(function SectionFields({
  control,
  index,
}: {
  control: Control<ReportTemplateFormData>;
  index: number;
}) {
  const { t } = useTranslation();
  const isEnabled = useWatch({
    control,
    name: `config.sections.${index}.enabled`,
  });
  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name={`config.sections.${index}.options.fields`}
        render={({ field: { value = [], onChange } }) => {
          const fields = (Array.isArray(value) ? value : []).map((field) =>
            typeof field === "string" ? { label: field, value: field } : field,
          ) as Array<{ label: string; value: string }>;

          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">
                  {t("REPORT_BUILDER_FIELDS")}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!isEnabled}
                  onClick={() =>
                    onChange([...fields, { label: "", value: "" }])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("REPORT_BUILDER_ADD_FIELD")}
                </Button>
              </div>

              {fields.map((fieldValue, fieldIndex) => (
                <div
                  key={fieldIndex}
                  className="flex items-center space-x-2 mb-2"
                >
                  <Input
                    value={fieldValue.value}
                    disabled={!isEnabled}
                    onChange={(e) => {
                      const newFields = [...fields];
                      newFields[fieldIndex] = {
                        ...fieldValue,
                        value: e.target.value,
                      };
                      onChange(newFields);
                    }}
                  />
                  {isEnabled && (
                    <Button
                      variant="ghost"
                      type="button"
                      size="icon"
                      disabled={!isEnabled}
                      onClick={() => {
                        const newFields = [...fields];
                        newFields.splice(fieldIndex, 1);
                        onChange(newFields);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          );
        }}
      />
    </div>
  );
});

const SectionBasicSettings = React.memo(function SectionBasicSettings({
  control,
  index,
  availableSections,
}: {
  control: Control<ReportTemplateFormData>;
  index: number;
  availableSections?: string[];
}) {
  const { t } = useTranslation();
  const isEnabled = useWatch({
    control,
    name: `config.sections.${index}.enabled`,
  });

  const isTable = useWatch({
    control,
    name: `config.sections.${index}.is_table`,
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Controller
        control={control}
        name={`config.sections.${index}.source`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_DATA_SOURCE")}</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!isEnabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("REPORT_BUILDER_SELECT_DATA_SOURCE")}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableSections?.map((section: string) => (
                  <SelectItem key={section} value={section}>
                    {t(SECTION_DISPLAY_NAMES[section] || section)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <Controller
        control={control}
        name={`config.sections.${index}.options.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_SECTION_TITLE")}</FormLabel>
            <FormControl>
              <Input
                disabled={!isEnabled}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={t("REPORT_BUILDER_ENTER_SECTION_TITLE")}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <Controller
        control={control}
        name={`config.sections.${index}.is_table`}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t("REPORT_BUILDER_DISPLAY_AS_TABLE")}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!isEnabled}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <Controller
        control={control}
        name={`config.sections.${index}`}
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>{t("REPORT_BUILDER_DISPLAY_STYLE")}</FormLabel>
              <Select
                disabled={!isEnabled || isTable}
                value={field.value?.options?.style || "list"}
                onValueChange={(value) =>
                  field.onChange({
                    ...field.value,
                    options: { ...field.value.options, style: value },
                  })
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("REPORT_BUILDER_SELECT_DISPLAY_STYLE")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="list">
                    {t("REPORT_BUILDER_STYLE_LIST")}
                  </SelectItem>
                  <SelectItem value="text">
                    {t("REPORT_BUILDER_STYLE_TEXT")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          );
        }}
      />
    </div>
  );
});

const SectionItem = React.memo(function SectionItem({
  index,
  field,
  control,
  activeTab,
  onTabChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  availableSections,
}: {
  index: number;
  field: any;
  control: Control<ReportTemplateFormData>;
  activeTab: string;
  onTabChange: (index: number, value: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  availableSections?: string[];
}) {
  const { t } = useTranslation();
  const values = useWatch({ control, name: "config.sections" });
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="cursor-grab"
                onClick={(e) => e.preventDefault()}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {t(
                  SECTION_DISPLAY_NAMES[field.source] ||
                    "REPORT_BUILDER_NEW_SECTION",
                )}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                control={control}
                name={`config.sections.${index}.enabled`}
                render={({ field: enabledField }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormLabel>{t("REPORT_BUILDER_ENABLED")}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={enabledField.value}
                        onCheckedChange={enabledField.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveDown(index)}
                  disabled={index === values.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="text-destructive"
                >
                  <CareIcon icon="l-trash" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => onTabChange(index, value)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="basic">
                {t("REPORT_BUILDER_BASIC_SETTINGS")}
              </TabsTrigger>
              <TabsTrigger value="fields">
                {t("REPORT_BUILDER_FIELDS_COLUMNS")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <SectionBasicSettings
                control={control}
                index={index}
                availableSections={availableSections}
              />
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 mt-4">
              <SectionFields control={control} index={index} />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
});

export const SectionBuilder = React.memo(function SectionBuilder({
  form,
  facilityId,
}: SectionBuilderProps) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "config.sections",
  });

  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  const { data: availableSections } = useQuery({
    queryKey: ["availableSections"],
    queryFn: query(reportTemplateApi.getAvailableSections, {
      pathParams: {
        facility_external_id: facilityId,
      },
    }),
  });

  const addSection = useCallback(() => {
    append({
      source: "",
      is_table: false,
      enabled: true,
      options: {
        style: "list",
        title: "",
        fields: [],
      },
    });
  }, [append]);

  const moveSection = useCallback(
    (from: number, to: number) => {
      move(from, to);
    },
    [move],
  );

  const moveSectionUp = useCallback(
    (index: number) => {
      if (index > 0) {
        moveSection(index, index - 1);
      }
    },
    [moveSection],
  );

  const moveSectionDown = useCallback(
    (index: number) => {
      if (index < fields.length - 1) {
        moveSection(index, index + 1);
      }
    },
    [moveSection, fields.length],
  );

  const removeSection = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  const handleTabChange = useCallback((index: number, value: string) => {
    setActiveTabs((prev) => ({
      ...prev,
      [index]: value,
    }));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("REPORT_BUILDER_SECTIONS")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("REPORT_BUILDER_SECTIONS_DESCRIPTION")}
          </p>
        </div>
        <Button type="button" onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("REPORT_BUILDER_ADD_SECTION")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <SectionItem
            key={field.id}
            index={index}
            field={field}
            control={form.control}
            activeTab={activeTabs[index] || "basic"}
            onTabChange={handleTabChange}
            onMoveUp={moveSectionUp}
            onMoveDown={moveSectionDown}
            onRemove={removeSection}
            availableSections={availableSections}
          />
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t("REPORT_BUILDER_NO_SECTIONS")}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
