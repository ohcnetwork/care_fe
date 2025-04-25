import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
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
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

interface SectionBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
  facilityId: string;
}

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  diagnosis: "Active Diagnoses",
  symptom: "Symptoms Reported",
  allergy: "Allergies",
  observation: "Observations",
  medication_request: "Medications",
  patient: "Patient Information",
  care_team: "Care Team",
  file: "Files & Documents",
  encounter: "Encounter Details",
};

export function SectionBuilder({ form, facilityId }: SectionBuilderProps) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "config.sections",
  });

  const { data: availableSections } = useQuery({
    queryKey: ["availableSections"],
    queryFn: query(reportTemplateApi.getAvailableSections, {
      pathParams: {
        facility_external_id: facilityId,
      },
    }),
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
          <Card key={field.id} className="relative">
            <div className="absolute left-2 inset-y-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-grab"
                onClick={(e) => e.preventDefault()}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">
                      {SECTION_DISPLAY_NAMES[field.source] || "New Section"}
                    </h3>
                    <Badge variant="outline">
                      {field.source || "No source selected"}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name={`config.sections.${index}.enabled`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel>Enabled</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSection(index, index - 1)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSection(index, index + 1)}
                        disabled={index === fields.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                    <TabsTrigger value="fields">Fields & Columns</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name={`config.sections.${index}.source`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Source</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`config.sections.${index}.options.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter section title"
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
                          <FormLabel>Display as Table</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {!form.watch(`config.sections.${index}.is_table`) && (
                      <FormField
                        control={form.control}
                        name={`config.sections.${index}.options.style`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Style</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="fields" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Fields</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentFields =
                              form.getValues(
                                `config.sections.${index}.options.fields`,
                              ) || [];
                            form.setValue(
                              `config.sections.${index}.options.fields`,
                              [...currentFields, ""],
                            );
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name={`config.sections.${index}.options.fields`}
                        render={() => (
                          <FormItem>
                            {form
                              .watch(
                                `config.sections.${index}.options.fields`,
                                [],
                              )
                              ?.map((_, fieldIndex) => (
                                <div
                                  key={fieldIndex}
                                  className="flex items-center space-x-2 mb-2"
                                >
                                  <FormField
                                    control={form.control}
                                    name={`config.sections.${index}.options.fields.${fieldIndex}`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const currentFields =
                                        form.getValues(
                                          `config.sections.${index}.options.fields`,
                                        ) || [];
                                      form.setValue(
                                        `config.sections.${index}.options.fields`,
                                        currentFields.filter(
                                          (_, i) => i !== fieldIndex,
                                        ),
                                      );
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
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
}
