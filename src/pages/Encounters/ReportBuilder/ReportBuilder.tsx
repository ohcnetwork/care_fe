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
    onSuccess: () => {
      toast.success(t("REPORT_BUILDER_TEMPLATE_SAVED"));
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );
    },
  });

  const { mutate: updateReportTemplate } = useMutation({
    mutationFn: mutate(reportTemplateApi.update, {
      pathParams: {
        facility_external_id: facilityId,
        id: reportTemplateId,
      },
    }),
    onSuccess: () => {
      toast.success(t("REPORT_BUILDER_TEMPLATE_UPDATED"));
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );
    },
  });

  const form = useForm<ReportTemplateFormData>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: defaultTemplate,
  });

  useEffect(() => {
    if (templateSchema) {
      form.reset(templateSchema);
    }
  }, [templateSchema, form]);

  const onSubmit = useCallback(
    async (data: ReportTemplateFormData) => {
      const isValid = await form.trigger();
      const currentErrors = form.formState.errors;
      if (!isValid) {
        const firstError = Object.values(currentErrors)[0];
        console.log(firstError);
        return;
      }

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
        console.log(data);
        createReportTemplate(data);
      }
    },
    [reportTemplateId, updateReportTemplate, createReportTemplate, form],
  );

  const handleExport = useCallback(() => {
    console.log("");
  }, []);

  if (reportTemplateId && isTemplateLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-9xl mx-auto">
      <Form {...form}>
        <div className="grid grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues());
            }}
            className="space-y-6"
          >
            <div className="flex justify-end space-x-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
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
