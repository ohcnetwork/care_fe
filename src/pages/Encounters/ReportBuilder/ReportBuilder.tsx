"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import { HeaderBuilder } from "@/pages/Encounters/ReportBuilder/HeaderBuilder";
import { LayoutBuilder } from "@/pages/Encounters/ReportBuilder/LayoutBuilder";
import { SectionBuilder } from "@/pages/Encounters/ReportBuilder/SectionBuilder";
import {
  ReportTemplateFormData,
  reportTemplateSchema,
} from "@/pages/Encounters/ReportBuilder/schema";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

interface ReportBuilderProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
  reportTemplateId: string;
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

  const { data: templateSchema } = useQuery({
    queryKey: ["report-template", reportTemplateId],
    queryFn: query(reportTemplateApi.get, {
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

  const onSubmit = useCallback((data: ReportTemplateFormData) => {
    console.log(data);
  }, []);

  const handleExport = useCallback(() => {
    console.log("");
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Template Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleExport}>
            Export
          </Button>
          <Button type="submit">Save Template</Button>
        </div>
      </form>
    </Form>
  );
}
