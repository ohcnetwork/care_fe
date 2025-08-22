import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, GripVertical, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Control,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface StandardLayoutProps {
  form: UseFormReturn<ReportTemplateFormData>;
  index: number;
  fieldName: `config.sections.${number}.options.${"fields" | "columns"}`;
  availableFieldsAndColumns?: string[];
  isEnabled: boolean;
  addButtonText: string;
  selectPlaceholder: string;
  emptyText: string;
}

function StandardLayout({
  form,
  index,
  fieldName,
  availableFieldsAndColumns,
  isEnabled,
  addButtonText,
  selectPlaceholder,
  emptyText,
}: StandardLayoutProps) {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string>("");

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: { value = [], onChange } }) => {
        const items = (Array.isArray(value) ? value : []) as string[];
        return (
          <FormItem>
            <FormControl>
              <div className="flex flex-col w-full justify-between mb-4 gap-2">
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectPlaceholder} />
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
                  onClick={() => {
                    onChange([...items, selectedField]);
                    setSelectedField("");
                  }}
                >
                  <Plus className="size-2 mr-2" />
                  {addButtonText}
                </Button>
                {items.length > 0 ? (
                  <div className="flex flex-row flex-wrap gap-2 mt-4">
                    {items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex space-x-2 mb-2 border border-gray-300 rounded-md p-1 pl-2 items-center justify-between"
                      >
                        <span className="text-sm">{t(item)}</span>
                        {isEnabled && (
                          <Button
                            variant="link"
                            type="button"
                            size="xs"
                            disabled={!isEnabled}
                            onClick={() => {
                              const newItems = [...items];
                              newItems.splice(itemIndex, 1);
                              onChange(newItems);
                            }}
                            className="py-0"
                          >
                            <CareIcon icon="l-multiply" className="size-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm mt-2">{emptyText}</p>
                )}
              </div>
            </FormControl>
            <FormMessage className="mt-2">
              {
                form.formState.errors?.config?.sections?.[index]?.options?.[
                  fieldName.split(".").pop() as "fields" | "columns"
                ]?.message
              }
            </FormMessage>
          </FormItem>
        );
      }}
    />
  );
}

function CustomFieldsLayout({
  form,
  index,
  isEnabled,
  addButtonText,
  emptyText,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  index: number;
  isEnabled: boolean;
  addButtonText: string;
  emptyText: string;
}) {
  const { t } = useTranslation();
  const [newField, setNewField] = useState<{ label: string; value: string }>({
    label: "",
    value: "",
  });

  return (
    <FormField
      control={form.control}
      name={`config.sections.${index}.options.fields`}
      render={({ field: { value = [], onChange } }) => {
        const items = (Array.isArray(value) ? value : []).map((field) =>
          typeof field === "string" ? { label: field, value: field } : field,
        );

        return (
          <FormItem>
            <FormControl>
              <div className="flex flex-col w-full justify-between mb-4 gap-2">
                <div className="flex flex-row gap-2 justify-between">
                  <div className="flex flex-col gap-2 w-full">
                    <FormLabel aria-required>{t("label")}</FormLabel>
                    <Input
                      value={newField.label}
                      onChange={(e) =>
                        setNewField({ ...newField, label: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <FormLabel aria-required>{t("value")}</FormLabel>
                    <Input
                      value={newField.value}
                      onChange={(e) =>
                        setNewField({ ...newField, value: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={!newField.label || !newField.value}
                  onClick={() => {
                    onChange([...items, newField]);
                    setNewField({ label: "", value: "" });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addButtonText}
                </Button>
                {items.length > 0 ? (
                  <div className="flex flex-row flex-wrap gap-2 mt-4">
                    {items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex space-x-2 mb-2 border border-gray-300 rounded-md p-2 items-center justify-between"
                      >
                        <div className="flex flex-col gap-2">
                          <span className="text-sm">{t(item.label)}</span>
                          <span className="text-xs text-gray-500">
                            {item.value}
                          </span>
                        </div>
                        {isEnabled && (
                          <Button
                            variant="link"
                            type="button"
                            size="xs"
                            disabled={!isEnabled}
                            onClick={() => {
                              const newItems = [...items];
                              newItems.splice(itemIndex, 1);
                              onChange(newItems);
                            }}
                          >
                            <CareIcon icon="l-multiply" className="size-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm mt-2">{emptyText}</p>
                )}
              </div>
            </FormControl>
            <FormMessage className="mt-2">
              {
                form.formState.errors?.config?.sections?.[index]?.options
                  ?.fields?.message
              }
            </FormMessage>
          </FormItem>
        );
      }}
    />
  );
}

function CustomTextLayout({
  form,
  index,
  isEnabled,
  addButtonText,
  emptyText,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  index: number;
  isEnabled: boolean;
  addButtonText: string;
  emptyText: string;
}) {
  const { t } = useTranslation();
  const [textField, setTextField] = useState<string>("");

  return (
    <FormField
      control={form.control}
      name={`config.sections.${index}.options.text`}
      render={({ field: { value = [], onChange } }) => {
        const items = Array.isArray(value) ? value : [];

        return (
          <FormItem>
            <FormControl>
              <div className="flex flex-col w-full justify-between mb-4 gap-2">
                <div className="flex flex-col gap-2 w-full">
                  <FormLabel aria-required>{t("text")}</FormLabel>
                  <Input
                    value={textField}
                    onChange={(e) => setTextField(e.target.value)}
                    placeholder={t("enter_custom_text")}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={!textField}
                  onClick={() => {
                    onChange([...items, textField]);
                    setTextField("");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addButtonText}
                </Button>
                {items.length > 0 ? (
                  <div className="flex flex-row flex-wrap gap-2 mt-4">
                    {items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex space-x-2 mb-2 border border-gray-300 rounded-md p-2 items-center justify-between"
                      >
                        <span className="text-sm">{t(item)}</span>
                        {isEnabled && (
                          <Button
                            variant="link"
                            type="button"
                            size="xs"
                            disabled={!isEnabled}
                            onClick={() => {
                              const newItems = [...items];
                              newItems.splice(itemIndex, 1);
                              onChange(newItems);
                            }}
                          >
                            <CareIcon icon="l-multiply" className="size-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm mt-2">{emptyText}</p>
                )}
              </div>
            </FormControl>
            <FormMessage className="mt-2">
              {
                form.formState.errors?.config?.sections?.[index]?.options?.text
                  ?.message
              }
            </FormMessage>
          </FormItem>
        );
      }}
    />
  );
}

function CustomTableAndFields({
  form,
  index,
  isEnabled,
  isTable,
  style,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  index: number;
  isEnabled: boolean;
  isTable: boolean;
  style?: "list" | "text";
}) {
  const { t } = useTranslation();

  if (isTable) {
    return (
      <CustomFieldsLayout
        form={form}
        index={index}
        isEnabled={isEnabled}
        addButtonText={t("add_field")}
        emptyText={t("no_fields")}
      />
    );
  }

  return style === "text" ? (
    <CustomTextLayout
      form={form}
      index={index}
      isEnabled={isEnabled}
      addButtonText={t("add_text")}
      emptyText={t("no_text")}
    />
  ) : (
    <CustomFieldsLayout
      form={form}
      index={index}
      isEnabled={isEnabled}
      addButtonText={t("add_field")}
      emptyText={t("no_fields")}
    />
  );
}

function SectionFieldsAndColumns({
  form,
  index,
  availableSections,
  isEnabled,
  isTable,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  index: number;
  availableSections?: Record<string, string[]>;
  isEnabled: boolean;
  isTable: boolean;
}) {
  const { t } = useTranslation();
  const section = useWatch({
    control: form.control,
    name: `config.sections.${index}.source`,
  });
  const style = useWatch({
    control: form.control,
    name: `config.sections.${index}.options.style`,
  }) as "list" | "text" | undefined;

  const isCustomSection = section === "custom_section";
  const availableFieldsAndColumns = availableSections?.[section];

  return (
    <div className="space-y-4">
      {isCustomSection ? (
        <CustomTableAndFields
          form={form}
          index={index}
          isEnabled={isEnabled}
          isTable={isTable}
          style={style || "list"}
        />
      ) : isTable ? (
        <StandardLayout
          form={form}
          index={index}
          fieldName={`config.sections.${index}.options.columns`}
          availableFieldsAndColumns={availableFieldsAndColumns}
          isEnabled={isEnabled}
          addButtonText={t("add_column")}
          selectPlaceholder={t("select_column")}
          emptyText={t("no_columns")}
        />
      ) : (
        <StandardLayout
          form={form}
          index={index}
          fieldName={`config.sections.${index}.options.fields`}
          availableFieldsAndColumns={availableFieldsAndColumns}
          isEnabled={isEnabled}
          addButtonText={t("add_field")}
          selectPlaceholder={t("select_field")}
          emptyText={t("no_fields")}
        />
      )}
    </div>
  );
}

function SectionBasicSettings({
  form,
  index,
  availableSections,
  dataSource,
  isEnabled,
  isTable,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  index: number;
  availableSections?: Record<string, string[]>;
  dataSource?: string;
  isEnabled: boolean;
  isTable: boolean;
}) {
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    if (dataSource) {
      setSelectedDataSource(dataSource);
    }
  }, [dataSource]);

  const handleDataSourceChange = (value: string) => {
    setSelectedDataSource(value);
    form.setValue(`config.sections.${index}.options.title`, "");
    form.setValue(`config.sections.${index}.options.columns`, []);
    form.setValue(`config.sections.${index}.options.fields`, []);
    form.setValue(`config.sections.${index}.options.text`, []);
  };

  const handleTableChange = (value: boolean) => {
    if (dataSource !== "custom_section") {
      if (value) {
        const fields = form.getValues(
          `config.sections.${index}.options.fields`,
        );
        form.setValue(
          `config.sections.${index}.options.columns`,
          fields as string[],
        );
      } else {
        const columns = form.getValues(
          `config.sections.${index}.options.columns`,
        );
        form.setValue(`config.sections.${index}.options.fields`, columns);
      }
    } else {
      if (form.getValues(`config.sections.${index}.options.style`) === "text") {
        form.setValue(`config.sections.${index}.options.fields`, []);
      } else {
        form.setValue(`config.sections.${index}.options.text`, []);
      }
    }
  };

  const handleStyleChange = () => {
    if (dataSource === "custom_section") {
      form.setValue(`config.sections.${index}.options.fields`, []);
    }
  };

  const availableSectionSources = Object.keys(availableSections || {});

  return (
    <div className="grid md:grid-cols-2 gap-4 items-center">
      <FormField
        control={form.control}
        name={`config.sections.${index}.source`}
        render={({ field }) => (
          <FormItem>
            <FormLabel aria-required>{t("data_source")}</FormLabel>
            <Select
              value={selectedDataSource}
              onValueChange={(value) => {
                handleDataSourceChange(value);
                field.onChange(value);
              }}
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
        control={form.control}
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
        control={form.control}
        name={`config.sections.${index}.is_table`}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t("display_as_table")}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(value) => {
                  handleTableChange(value);
                  field.onChange(value);
                }}
                disabled={!isEnabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`config.sections.${index}.options.style`}
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>{t("display_style")}</FormLabel>
              <Select
                disabled={!isEnabled || isTable}
                value={field.value || "list"}
                onValueChange={(value) => {
                  handleStyleChange();
                  field.onChange(value);
                }}
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

  const isEnabled = useWatch({
    control: form.control,
    name: `config.sections.${index}.enabled`,
  });

  const isTable = useWatch({
    control: form.control,
    name: `config.sections.${index}.is_table`,
  });

  const sectionHasErrors = form.formState.errors?.config?.sections?.[index];

  return (
    <Card>
      <CardContent
        className={cn(
          "pt-6",
          sectionHasErrors && "border-red-500 border-1 rounded-md",
        )}
      >
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
                index={index}
                availableSections={availableSections}
                dataSource={dataSource}
                isEnabled={isEnabled}
                isTable={isTable}
              />
            </TabsContent>

            {dataSource && (
              <TabsContent value="fields" className="space-y-4 mt-4">
                <SectionFieldsAndColumns
                  form={form}
                  index={index}
                  availableSections={availableSections}
                  isEnabled={isEnabled}
                  isTable={isTable}
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
          <p className="text-sm">{t("sections_description")}</p>
        </div>
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
          <div className="text-center py-8">{t("no_sections")}</div>
        )}
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={addSection} size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {t("add_section")}
        </Button>
      </CardFooter>
    </Card>
  );
}
