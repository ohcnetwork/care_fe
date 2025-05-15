import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Control,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { SECTION_DISPLAY_NAMES } from "@/types/reportTemplate/reportTemplate";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

interface SectionBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
  facilityId: string;
}

function SectionFieldsAndColumns({
  control,
  index,
  availableSections,
}: {
  control: Control<ReportTemplateFormData>;
  index: number;
  availableSections?: Record<string, string[]>;
}) {
  const [selectedField, setSelectedField] = useState<string>("");
  const { t } = useTranslation();
  const isEnabled = useWatch({
    control,
    name: `config.sections.${index}.enabled`,
  });

  const isTable = useWatch({
    control,
    name: `config.sections.${index}.is_table`,
  });

  const section = useWatch({
    control,
    name: `config.sections.${index}.source`,
  });
  const availableFieldsAndColumns = availableSections?.[section];

  return (
    <div className="space-y-4">
      {isTable ? (
        <FormField
          control={control}
          name={`config.sections.${index}.options.columns`}
          render={({ field: { value = [], onChange } }) => {
            const columns = Array.isArray(value) ? value : [];
            return (
              <div>
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                  <Select
                    value={selectedField}
                    onValueChange={setSelectedField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_column")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFieldsAndColumns?.map((field) => (
                        <SelectItem key={field} value={field}>
                          {t(field)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={!selectedField}
                    onClick={() => onChange([...columns, selectedField])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add_column")}
                  </Button>
                </div>

                {columns.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    className="flex space-x-2 mb-2 border rounded-md p-2 items-center justify-between"
                  >
                    <span>{t(column)}</span>
                    {isEnabled && (
                      <Button
                        variant="link"
                        type="button"
                        size="icon"
                        disabled={!isEnabled}
                        onClick={() => {
                          const newColumns = [...columns];
                          newColumns.splice(columnIndex, 1);
                          onChange(newColumns);
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
      ) : (
        <FormField
          control={control}
          name={`config.sections.${index}.options.fields`}
          render={({ field: { value = [], onChange } }) => {
            const fields = (Array.isArray(value) ? value : []).map((field) =>
              typeof field === "string"
                ? { label: field, value: field }
                : field,
            ) as Array<{ label: string; value: string }>;

            return (
              <div>
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                  <Select
                    value={selectedField}
                    onValueChange={setSelectedField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_field")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFieldsAndColumns?.map((field) => (
                        <SelectItem key={field} value={field}>
                          {t(field)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={!selectedField}
                    onClick={() =>
                      onChange([
                        ...fields,
                        { label: selectedField, value: selectedField },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add_field")}
                  </Button>
                </div>

                {fields.map((fieldValue, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="flex space-x-2 mb-2 border rounded-md p-2 items-center justify-between"
                  >
                    <span>{t(fieldValue.label)}</span>
                    {isEnabled && (
                      <Button
                        variant="link"
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
      )}
    </div>
  );
}

function SectionBasicSettings({
  form,
  control,
  index,
  availableSections,
  dataSource,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  control: Control<ReportTemplateFormData>;
  index: number;
  availableSections?: Record<string, string[]>;
  dataSource?: string;
}) {
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const { t } = useTranslation();
  const isEnabled = useWatch({
    control,
    name: `config.sections.${index}.enabled`,
  });

  const isTable = useWatch({
    control,
    name: `config.sections.${index}.is_table`,
  });

  useEffect(() => {
    if (dataSource) {
      setSelectedDataSource(dataSource);
    }
  }, [dataSource]);

  const handleDataSourceChange = (value: string, field: any) => {
    setSelectedDataSource(value);
    field.onChange(value);
    form.setValue(`config.sections.${index}.options.title`, "");
    form.setValue(`config.sections.${index}.options.columns`, []);
    form.setValue(`config.sections.${index}.options.fields`, []);
  };

  const availableSectionSources = Object.keys(availableSections || {});

  return (
    <div className="grid md:grid-cols-2 gap-4 items-center">
      <FormField
        control={control}
        name={`config.sections.${index}.source`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("data_source")}</FormLabel>
            <Select
              value={selectedDataSource}
              onValueChange={(value) => handleDataSourceChange(value, field)}
              disabled={!isEnabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_data_source")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableSectionSources.map((section: string) => (
                  <SelectItem key={section} value={section}>
                    {t(SECTION_DISPLAY_NAMES[section] || section)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`config.sections.${index}.options.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("section_title")}</FormLabel>
            <FormControl>
              <Input
                disabled={!isEnabled}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={t("enter_section_title")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`config.sections.${index}.is_table`}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t("display_as_table")}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!isEnabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`config.sections.${index}`}
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>{t("display_style")}</FormLabel>
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
                    <SelectValue placeholder={t("select_display_style")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="list">{t("style_list")}</SelectItem>
                  <SelectItem value="text">{t("style_text")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}

function SectionItem({
  index,
  form,
  control,
  activeTab,
  onTabChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  availableSections,
}: {
  index: number;
  form: UseFormReturn<ReportTemplateFormData>;
  control: Control<ReportTemplateFormData>;
  activeTab: string;
  onTabChange: (index: number, value: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  availableSections?: Record<string, string[]>;
}) {
  const { t } = useTranslation();
  const values = useWatch({ control, name: "config.sections" });
  const dataSource = useWatch({
    control,
    name: `config.sections.${index}.source`,
  });
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
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
                {t(SECTION_DISPLAY_NAMES[dataSource || ""] || "new_section")}
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <FormField
                control={control}
                name={`config.sections.${index}.enabled`}
                render={({ field: enabledField }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormLabel>{t("enabled")}</FormLabel>
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
          >
            <TabsList className="overflow-x-auto w-full">
              <TabsTrigger value="basic" className="w-full">
                {t("basic_settings")}
              </TabsTrigger>
              {dataSource && (
                <TabsTrigger value="fields" className="w-full">
                  {t("fields_columns")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <SectionBasicSettings
                form={form}
                control={control}
                index={index}
                availableSections={availableSections}
                dataSource={dataSource}
              />
            </TabsContent>

            {dataSource && (
              <TabsContent value="fields" className="space-y-4 mt-4">
                <SectionFieldsAndColumns
                  control={control}
                  index={index}
                  availableSections={availableSections}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SectionBuilder({ form }: SectionBuilderProps) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "config.sections",
  });

  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  const { data: availableSections } = useQuery({
    queryKey: ["availableSections"],
    queryFn: query(reportTemplateApi.getAvailableSections),
  });

  const addSection = () => {
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
  };

  const moveSection = (from: number, to: number) => {
    move(from, to);
  };

  const moveSectionUp = (index: number) => {
    if (index > 0) {
      moveSection(index, index - 1);
    }
  };

  const moveSectionDown = (index: number) => {
    if (index < fields.length - 1) {
      moveSection(index, index + 1);
    }
  };

  const removeSection = (index: number) => {
    remove(index);
  };

  const handleTabChange = (index: number, value: string) => {
    setActiveTabs((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
        <div>
          <CardTitle>{t("sections")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("sections_description")}
          </p>
        </div>
        <Button
          type="button"
          onClick={addSection}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("add_section")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <SectionItem
            key={field.id}
            index={index}
            form={form}
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
            {t("no_sections")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
