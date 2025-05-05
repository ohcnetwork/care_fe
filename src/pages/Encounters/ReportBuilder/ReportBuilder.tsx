"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        [
          {
            type: "text",
            text: "Central Diagnostic Laboratory",
            size: "24pt",
            weight: 400,
            align: "center",
          },
        ],
        [
          {
            type: "rule",
            length: "100%",
            stroke: "mygray",
          },
        ],
        [
          {
            type: "text",
            text: "Patient Discharge Summary",
            size: "15pt",
            weight: 400,
          },
          {
            type: "image",
            file_name: "care-black-logo.png",
            url: "https://en.wikipedia.org/static/images/icons/wikipedia.png",
            width: "20%",
            align: "right",
          },
        ],
        [
          {
            type: "datetime",
            label: "Created on",
            format: "[day]/[month]/[year]",
            style: {
              fill: "mygray",
              weight: 500,
            },
            align: "right",
          },
        ],
        [
          {
            type: "rule",
            length: "100%",
            stroke: "mygray",
          },
        ],
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
    ],
  },
};

export default function ReportBuilder({
  facilityId,
  reportTemplateId,
}: ReportBuilderProps) {
  const [activeTab, setActiveTab] = useState("layout");
  const { t } = useTranslation();

  const { data: templateSchema } = useQuery({
    queryKey: ["report-template", reportTemplateId],
    queryFn: query(reportTemplateApi.get, {
      pathParams: {
        facility_external_id: facilityId,
        id: reportTemplateId,
      },
    }),
    enabled: !!reportTemplateId,
  });

  const { mutate: createReportTemplate } = useMutation({
    mutationFn: mutate(reportTemplateApi.create, {
      pathParams: {
        facility_external_id: facilityId,
      },
    }),
  });

  const { mutate: updateReportTemplate } = useMutation({
    mutationFn: mutate(reportTemplateApi.update, {
      pathParams: {
        facility_external_id: facilityId,
        id: reportTemplateId,
      },
    }),
  });

  const form = useForm<ReportTemplateFormData>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: templateSchema ?? defaultTemplate,
  });

  const onSubmit = useCallback(
    (data: ReportTemplateFormData) => {
      data = {
        ...data,
        config: {
          ...data.config,
          layout: {
            ...data.config.layout,
            text: {
              ...data.config.layout.text,
              size: data.config.layout.text.size + "pt",
            },
          },
        },
      };
      if (reportTemplateId) {
        updateReportTemplate(data);
      } else {
        createReportTemplate(data);
      }
    },
    [reportTemplateId, updateReportTemplate, createReportTemplate],
  );

  const handleExport = useCallback(() => {
    console.log("");
  }, []);

  return (
    <div className="max-w-9xl mx-auto">
      <Form {...form}>
        <div className="grid grid-cols-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-end space-x-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
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
              <Button type="button" variant="outline" onClick={handleExport}>
                {t("export")}
              </Button>
              <Button type="submit">{t("REPORT_BUILDER_SAVE_TEMPLATE")}</Button>
            </div>
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
          </form>
          <ReportBuilderPreview form={form} />
        </div>
      </Form>
    </div>
  );
}
