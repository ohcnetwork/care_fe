"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import HeaderBuilder from "@/pages/Encounters/ReportBuilder/HeaderBuilder";
import LayoutBuilder from "@/pages/Encounters/ReportBuilder/LayoutBuilder";
import SectionBuilder from "@/pages/Encounters/ReportBuilder/SectionBuilder";
import {
  ReportTemplateFormData,
  useReportTemplateSchema,
} from "@/pages/Encounters/ReportBuilder/schema";
import {
  REPORT_TEMPLATE_TYPE,
  ReportTemplateModel,
} from "@/types/reportTemplate/reportTemplate";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

import ReportBuilderPreview from "./ReportBuilderPreview";

interface ReportBuilderProps {
  facilityId: string;
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
        align: "right",
      },
      text: {
        font: "Times New Roman",
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
              length: 100,
              stroke: "#000000",
              align: "left",
            },
          ],
        },
        {
          size_ratio: [4, 2],
          columns: [
            {
              type: "text",
              text: "Patient Discharge Summary",
              size: "16pt",
              weight: 400,
              align: "left",
            },
            {
              type: "image",
              file_name: "care-black-logo.svg",
              url: "https://raw.githubusercontent.com/ohcnetwork/care/refs/heads/develop/care/static/images/logos/black-logo.svg",
              width: "40",
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
                fill: "#000000",
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
              length: 100,
              stroke: "#000000",
              align: "left",
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
}: ReportBuilderProps) {
  const [activeTab, setActiveTab] = useState("layout");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reportTemplateSchema = useReportTemplateSchema();

  const { data: templateSchema, isLoading: isTemplateLoading } = useQuery({
    queryKey: ["report-template", reportTemplateId],
    queryFn: query(reportTemplateApi.get, {
      pathParams: {
        id: reportTemplateId ?? "",
      },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: !!reportTemplateId,
  });

  const { mutate: createReportTemplate, isPending: isCreatePending } =
    useMutation({
      mutationFn: mutate(reportTemplateApi.create),
      onSuccess: (data: ReportTemplateModel) => {
        toast.success(t("template_saved"));
        navigate(`/reportbuilder/${data.id}`);
      },
    });

  const { mutate: updateReportTemplate, isPending: isUpdatePending } =
    useMutation({
      mutationFn: mutate(reportTemplateApi.update, {
        pathParams: {
          id: reportTemplateId ?? "",
        },
        queryParams: {
          facility: facilityId,
        },
      }),
      onSuccess: () => {
        toast.success(t("template_updated"));
      },
    });

  const form = useForm<ReportTemplateFormData>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: defaultTemplate,
  });

  useEffect(() => {
    if (templateSchema && !isTemplateLoading) {
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
                ...(column.type === "image" && {
                  width:
                    column.width?.match("[0-9][0-9]?[0-9]?")?.[0] ||
                    column.width,
                }),
                ...(column.type === "rule" && {
                  length:
                    Number(
                      column.length?.toString().match("[0-9][0-9]?[0-9]?")?.[0],
                    ) || 100,
                }),
              })),
            })),
          },
          layout: {
            ...templateSchema.config.layout,
            page_margin:
              templateSchema.config.layout.page_margin.mode === "custom"
                ? {
                    mode: "custom",
                    values: {
                      top: templateSchema.config.layout.page_margin.values.top.split(
                        "pt",
                      )[0],
                      right:
                        templateSchema.config.layout.page_margin.values.right.split(
                          "pt",
                        )[0],
                      bottom:
                        templateSchema.config.layout.page_margin.values.bottom.split(
                          "pt",
                        )[0],
                      left: templateSchema.config.layout.page_margin.values.left.split(
                        "pt",
                      )[0],
                    },
                  }
                : {
                    mode: "uniform",
                    value:
                      templateSchema.config.layout.page_margin.value.split(
                        "pt",
                      )[0],
                  },
          },
        },
      });
    }
  }, [templateSchema, form, isTemplateLoading]);

  const onSubmit = async (data: ReportTemplateFormData, exit: boolean) => {
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
              ...(column.type === "image" && {
                width: column.width + "%",
              }),
            })),
          })),
        },
        layout: {
          ...data.config.layout,
          page_margin:
            data.config.layout.page_margin.mode === "custom"
              ? {
                  mode: "custom",
                  values: {
                    top: data.config.layout.page_margin.values.top + "pt",
                    right: data.config.layout.page_margin.values.right + "pt",
                    bottom: data.config.layout.page_margin.values.bottom + "pt",
                    left: data.config.layout.page_margin.values.left + "pt",
                  },
                }
              : {
                  mode: "uniform",
                  value: data.config.layout.page_margin.value + "pt",
                },
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
    if (exit) {
      navigate(`/reportbuilder`);
    }
  };

  // TODO: Implement export functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExport = () => {
    console.log("");
  };

  if (reportTemplateId && isTemplateLoading) {
    return <Loading />;
  }

  const errorEntries = collectErrors(form.formState.errors);
  const hasHeaderErrors = errorEntries.some((e) => e.section === "header");
  const hasLayoutErrors = errorEntries.some((e) => e.section === "layout");
  const hasSectionsErrors = errorEntries.some((e) => e.section === "sections");

  return (
    <div className="max-w-9xl mx-auto -mt-4">
      <Form {...form}>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues(), false);
            }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="">
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
                  disabled={!!reportTemplateId}
                  render={({ field }) => (
                    <FormItem className="">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {/*                 <Button
                  type="button"
                  variant="outline"
                  onClick={handleExport}
                  className="w-full sm:w-auto"
                >
                  {t("export")}
                </Button> */}
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={() => onSubmit(form.getValues(), false)}
                  disabled={isCreatePending || isUpdatePending}
                >
                  {isCreatePending || isUpdatePending
                    ? t("saving")
                    : t("save_template")}
                </Button>
                {reportTemplateId && (
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    onClick={() => onSubmit(form.getValues(), true)}
                    disabled={isUpdatePending}
                  >
                    {isUpdatePending ? t("saving") : t("save_and_exit")}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>{t("report_builder_title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="layout">{t("layout")}</TabsTrigger>
                      <TabsTrigger value="header">{t("header")}</TabsTrigger>
                      <TabsTrigger value="sections">
                        {t("sections")}
                      </TabsTrigger>
                    </TabsList>
                    {hasLayoutErrors && (
                      <Badge variant="destructive" size="sm">
                        {t("layout_error")}
                      </Badge>
                    )}
                    {hasHeaderErrors && (
                      <Badge variant="destructive" size="sm">
                        {t("header_error")}
                      </Badge>
                    )}
                    {hasSectionsErrors && (
                      <Badge variant="destructive" size="sm">
                        {t("sections_error")}
                      </Badge>
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
