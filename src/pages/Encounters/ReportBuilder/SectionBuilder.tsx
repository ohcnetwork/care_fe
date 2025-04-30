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
  diagnosis: "Active Diagnoses",
  symptom: "Symptoms Reported",
  allergy_intolerance: "Allergies",
  observation: "Observations",
  medication_request: "Medications",
  patient_info: "Patient Information",
  care_team: "Care Team",
  file_upload: "Files & Documents",
  encounter: "Encounter Details",
  discharge_summary_advice: "Discharge Summary Advice",
  custom_section: "Custom Section",
};

const SectionFields = React.memo(function SectionFields({
  control,
  index,
}: {
  control: Control<ReportTemplateFormData>;
  index: number;
}) {
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
                <h4 className="text-sm font-medium">Fields</h4>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isEnabled}
                  onClick={() =>
                    onChange([...fields, { label: "", value: "" }])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
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
            <FormLabel>Data Source</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!isEnabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableSections?.map((section: string) => (
                  <SelectItem key={section} value={section}>
                    {SECTION_DISPLAY_NAMES[section] || section}
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
            <FormLabel>Section Title</FormLabel>
            <FormControl>
              <Input
                disabled={!isEnabled}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Enter section title"
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
            <FormLabel>Display as Table</FormLabel>
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
          if (isTable) return <></>;

          return (
            <FormItem>
              <FormLabel>Display Style</FormLabel>
              <Select
                disabled={!isEnabled}
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
                    <SelectValue placeholder="Select display style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
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
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-grab"
                onClick={(e) => e.preventDefault()}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {SECTION_DISPLAY_NAMES[field.source] || "New Section"}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                control={control}
                name={`config.sections.${index}.enabled`}
                render={({ field: enabledField }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormLabel>Enabled</FormLabel>
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
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveDown(index)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
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
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="fields">Fields & Columns</TabsTrigger>
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
          <CardTitle>Report Sections Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure, reorder and customize report sections
          </p>
        </div>
        <Button onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
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
            No sections added. Click "Add Section" to begin configuring your
            report sections.
          </div>
        )}
      </CardContent>
    </Card>
  );
});
