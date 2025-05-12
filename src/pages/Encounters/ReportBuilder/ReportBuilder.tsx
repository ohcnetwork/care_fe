"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HeaderBuilder } from "@/pages/Encounters/ReportBuilder/HeaderBuilder";
import { LayoutBuilder } from "@/pages/Encounters/ReportBuilder/LayoutBuilder";
import { SectionBuilder } from "@/pages/Encounters/ReportBuilder/SectionBuilder";
import {
  ReportTemplateFormData,
  reportTemplateSchema,
} from "@/pages/Encounters/ReportBuilder/schema";
import { REPORT_TEMPLATE_TYPE } from "@/types/reportTemplate/reportTemplate";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

import { ReportBuilderPreview } from "./ReportBuilderPreview";

interface ReportBuilderProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
  reportTemplateId?: string;
}

// Default template configuration
const defaultTemplate: ReportTemplateFormData = {
  type: "discharge_summary",
  slug: "default-template",
  config: {
    layout: {
      page_size: "a4",
      page_margin: {
        mode: "uniform",
        value: "40pt",
      },
      page_numbering: {
        enabled: true,
        format: "1 of 1",
        align: "right + bottom",
      },
      text: {
        font: "DejaVu Sans",
        size: "10pt",
      },
    },
    header: {
      rows: [
        {
          size_ratio: [1],
          columns: [
            {
              type: "text",
              text: "Care Lab",
              size: "24pt",
              weight: 400,
              align: "center",
            },
          ],
        },
        {
          size_ratio: [1],
          columns: [
            {
              type: "rule",
              length: "100%",
              stroke: "mygray",
            },
          ],
        },
        {
          size_ratio: [4, 2],
          columns: [
            {
              type: "text",
              text: "Patient Discharge Summary",
              size: "15pt",
              weight: 400,
            },
            {
              type: "image",
              file_name: "care-black-logo.svg",
              url: "https://raw.githubusercontent.com/ohcnetwork/care/refs/heads/develop/care/static/images/logos/black-logo.svg",
              width: "40%",
              align: "right",
            },
          ],
        },
        {
          size_ratio: [1],
          columns: [
            {
              type: "datetime",
              label: "Created on",
              format: "[day]/[month]/[year]",
              style: {
                fill: "mygray",
                weight: 500,
              },
              align: "left",
            },
          ],
        },
        {
          size_ratio: [1],
          columns: [
            {
              type: "rule",
              length: "100%",
              stroke: "mygray",
            },
          ],
        },
      ],
    },
    sections: [
      {
        source: "patient_info",
        is_table: false,
        enabled: true,
        options: {
          title: "Patient Information",
          fields: [
            "name",
            "gender",
            "phone_number",
            "emergency_phone_number",
            "address",
            "permanent_address",
            "pincode",
            "date_of_birth",
            "deceased_datetime",
            "marital_status",
            "blood_group",
          ],
          style: "list",
        },
      },
      {
        source: "custom_section",
        is_table: false,
        enabled: true,
        options: {
          title: "Emergency Contacts",
          style: "list",
          fields: [
            { label: "Primary Contact", value: "+91-9876543210" },
            { label: "Ambulance", value: "102" },
          ],
        },
      },
    ],
  },
};

interface ErrorEntry {
  path: string;
  section: string;
  message: string;
}

function collectErrors(
  errors: any,
  parentPath: string[] = [],
  section: string | null = null,
): ErrorEntry[] {
  if (!errors) return [];

  // If this is a leaf error node with a message
  if (typeof errors.message === "string") {
    // Find the top-level section (layout, header, sections)
    const topSection =
      section ||
      parentPath.find((p) => ["layout", "header", "sections"].includes(p)) ||
      "";
    return [
      {
        path: parentPath.join("."),
        section: topSection,
        message: errors.message,
      },
    ];
  }

  // If this is an array, recurse into each element
  if (Array.isArray(errors)) {
    return errors.flatMap((err, idx) =>
      collectErrors(err, [...parentPath, `[${idx}]`], section),
    );
  }

  // If this is an object, recurse into each property
  if (typeof errors === "object") {
    return Object.entries(errors).flatMap(([key, value]) =>
      collectErrors(
        value,
        [...parentPath, key],
        section ||
          (["layout", "header", "sections"].includes(key) ? key : null),
      ),
    );
  }

  return [];
}

export default function ReportBuilder({
  facilityId,
  reportTemplateId,
  encounterId,
  patientId,
}: ReportBuilderProps) {
  const [activeTab, setActiveTab] = useState("layout");
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: templateSchema, isLoading: isTemplateLoading } = useQuery({
    queryKey: ["report-template", reportTemplateId],
    queryFn: query(reportTemplateApi.get, {
      pathParams: {
        id: reportTemplateId,
      },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: !!reportTemplateId,
  });

  const { mutate: createReportTemplate } = useMutation({
    mutationFn: mutate(reportTemplateApi.create),
    onSuccess: () => {
      toast.success(t("REPORT_BUILDER_TEMPLATE_SAVED"));
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/files`,
      );
    },
  });

  const { mutate: updateReportTemplate } = useMutation({
    mutationFn: mutate(reportTemplateApi.update, {
      pathParams: {
        id: reportTemplateId,
      },
    }),
    onSuccess: () => {
      toast.success(t("REPORT_BUILDER_TEMPLATE_UPDATED"));
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/files`,
      );
    },
  });

  const form = useForm<ReportTemplateFormData>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: defaultTemplate,
  });

  useEffect(() => {
    if (templateSchema) {
      form.reset({
        ...templateSchema,
        config: {
          ...templateSchema.config,
          header: {
            ...templateSchema.config.header,
            rows: templateSchema.config.header.rows.map((row) => ({
              ...row,
              size_ratio: row.size_ratio ?? Array(row.columns.length).fill(1),
              columns: row.columns.map((column) => ({
                ...column,
                ...(column.type === "rule" && {
                  length: column.length.split("%")[0],
                }),
              })),
            })),
          },
        },
      });
    }
  }, [templateSchema, form]);

  const onSubmit = useCallback(
    async (data: ReportTemplateFormData) => {
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }

      data = {
        ...data,
        config: {
          ...data.config,
          header: {
            ...data.config.header,
            rows: data.config.header.rows.map((row) => ({
              ...row,
              size_ratio:
                row.size_ratio && row.size_ratio.length > 0
                  ? row.size_ratio.map((ratio) => ratio ?? 1)
                  : Array(row.columns.length).fill(1),
              columns: row.columns.map((column) => ({
                ...column,
                ...(column.type === "rule" && {
                  length: column.length + "%",
                }),
              })),
            })),
          },
        },
      };
      if (reportTemplateId) {
        updateReportTemplate({ config: data.config });
      } else {
        createReportTemplate({
          ...data,
          facility: facilityId,
        });
      }
    },
    [reportTemplateId, updateReportTemplate, createReportTemplate, form],
  );

  console.log(form.formState.errors);

  const handleExport = useCallback(() => {
    console.log("");
  }, []);

  if (reportTemplateId && isTemplateLoading) {
    return <Loading />;
  }

  const errorEntries = collectErrors(form.formState.errors);
  const hasHeaderErrors = errorEntries.some((e) => e.section === "header");
  const hasLayoutErrors = errorEntries.some((e) => e.section === "layout");
  const hasSectionsErrors = errorEntries.some((e) => e.section === "sections");

  console.log(form.formState.errors);
  console.log(form.getValues());

  return (
    <div className="max-w-9xl mx-auto">
      <Form {...form}>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues());
            }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!reportTemplateId}
                      >
                        <FormItem>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REPORT_TEMPLATE_TYPE.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </FormItem>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                className="w-full sm:w-auto"
              >
                {t("export")}
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {t("REPORT_BUILDER_SAVE_TEMPLATE")}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("REPORT_BUILDER_TITLE")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="layout">
                        {t("REPORT_BUILDER_LAYOUT")}
                      </TabsTrigger>
                      <TabsTrigger value="header">
                        {t("REPORT_BUILDER_HEADER")}
                      </TabsTrigger>
                      <TabsTrigger value="sections">
                        {t("REPORT_BUILDER_SECTIONS")}
                      </TabsTrigger>
                    </TabsList>
                    {hasLayoutErrors && (
                      <span className="text-red-500 bg-red-100 p-2 rounded-md text-sm">
                        {t("REPORT_BUILDER_LAYOUT_ERROR")}
                      </span>
                    )}
                    {hasHeaderErrors && (
                      <span className="text-red-500 bg-red-100 p-2 rounded-md text-sm">
                        {t("REPORT_BUILDER_HEADER_ERROR")}
                      </span>
                    )}
                    {hasSectionsErrors && (
                      <span className="text-red-500 bg-red-100 p-2 rounded-md text-sm">
                        {t("REPORT_BUILDER_SECTIONS_ERROR")}
                      </span>
                    )}
                    <TabsContent value="layout">
                      <LayoutBuilder form={form} />
                    </TabsContent>
                    <TabsContent value="header">
                      <HeaderBuilder form={form} />
                    </TabsContent>
                    <TabsContent value="sections">
                      <SectionBuilder form={form} facilityId={facilityId} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              <ReportBuilderPreview form={form} />
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
}
