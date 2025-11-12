import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import query from "@/Utils/request/query";
import templateApi from "@/types/emr/template/templateApi";

interface ContextConfigSection {
  fields: string[];
}

interface TemplateBuilderFormData {
  sections: {
    key: string;
    config: ContextConfigSection;
  }[];
}

export default function TemplateBuilder() {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState<string>("");

  const form = useForm<TemplateBuilderFormData>({
    defaultValues: {
      sections: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  const { data: schema, isLoading } = useQuery({
    queryKey: ["templateSchema"],
    queryFn: query(templateApi.retrieveSchema),
  });

  // Get all available section keys (both single_objects and querysets)
  const availableSectionKeys = schema
    ? [
        ...Object.keys(schema.single_objects || {}),
        ...Object.keys(schema.querysets || {}),
      ]
    : [];

  // Get already added section keys
  const addedSectionKeys = fields.map((field) => field.key);

  // Filter out already added sections
  const availableSections = availableSectionKeys.filter(
    (key) => !addedSectionKeys.includes(key),
  );

  // Get section schema (either from single_objects or querysets)
  const getSectionSchema = (sectionKey: string) => {
    if (!schema) return null;
    return (
      schema.single_objects?.[sectionKey] || schema.querysets?.[sectionKey]
    );
  };

  const addSection = () => {
    if (!selectedSection) return;
    append({
      key: selectedSection,
      config: {
        fields: [],
      },
    });
    setSelectedSection("");
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  const removeSection = (index: number) => {
    remove(index);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("template_builder")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("template_builder_description")}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {/* Add Section Dropdown */}
              <div className="flex gap-2">
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("select_section_to_add")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((sectionKey) => {
                      const sectionSchema = getSectionSchema(sectionKey);
                      return (
                        <SelectItem key={sectionKey} value={sectionKey}>
                          {sectionSchema?.display || sectionKey}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={addSection}
                  disabled={!selectedSection}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("add_section")}
                </Button>
              </div>

              {/* Section List */}
              <div className="space-y-4">
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("no_sections_added")}
                  </div>
                ) : (
                  fields.map((field, index) => {
                    const sectionSchema = getSectionSchema(field.key);
                    const availableFields =
                      sectionSchema?.fields.map((f) => ({
                        label: f.display,
                        value: f.key,
                      })) || [];

                    return (
                      <Card key={field.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-grab"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </Button>
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {sectionSchema?.display || field.key}
                                  </h3>
                                  {sectionSchema?.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {sectionSchema.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveUp(index)}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveDown(index)}
                                  disabled={index === fields.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSection(index)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Field Multi-Select */}
                            <FormField
                              control={form.control}
                              name={`sections.${index}.config.fields`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("select_fields")}
                                    <span className="text-destructive ml-1">
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <MultiSelect
                                      options={availableFields}
                                      value={formField.value || []}
                                      onValueChange={formField.onChange}
                                      placeholder={t(
                                        "select_fields_to_include",
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {t("sections_count", { count: fields.length })}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
