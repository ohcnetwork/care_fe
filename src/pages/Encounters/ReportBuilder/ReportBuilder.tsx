"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

import { HeaderBuilder } from "./HeaderBuilder";
import { LayoutBuilder } from "./LayoutBuilder";
import { SectionBuilder } from "./SectionBuilder";
import { ReportTemplateFormData, reportTemplateSchema } from "./schema";

interface ReportBuilderProps {
  patientId: string;
  encounterId: string;
}

export default function ReportBuilder(props: ReportBuilderProps) {
  const { encounterId, patientId } = props;
  const { data: encounterData } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { patient: patientId },
    }),
    enabled: !!encounterId,
  });
  const form = useForm<ReportTemplateFormData>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: {
      id: "",
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
            format: "Page {page} of {pages}",
            align: "right + bottom",
          },
          text: {
            font: "helvetica",
            size: "12",
          },
        },
        header: {
          facility_name: "",
          facility_heading: {
            align: "center",
            size: "16",
            weight: "bold",
          },
          divider: {
            length: "100%",
            stroke: "1px",
          },
          title: {
            text: "Patient Discharge Summary",
            size: "14",
          },
          logo: {
            file_name: "",
          },
          created_on: {
            label: "Created On",
            style: {
              fill: "black",
              weight: "normal",
            },
            date_format: "DD/MM/YYYY",
          },
        },
        sections: [],
      },
    },
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Report Builder Configurator</h1>
          <p className="text-muted-foreground">
            Customize your patient discharge summary reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <span className="mr-2">↓</span>
            Export Config
          </Button>
          <Button>
            <span className="mr-2">💾</span>
            Save Changes
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="mb-4 w-full flex justify-between">
              <TabsTrigger value="layout" className="w-full">
                Layout
              </TabsTrigger>
              <TabsTrigger value="header" className="w-full">
                Header
              </TabsTrigger>
              <TabsTrigger value="sections" className="w-full">
                Sections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layout">
              <LayoutBuilder form={form} />
            </TabsContent>

            <TabsContent value="header">
              <HeaderBuilder form={form} />
            </TabsContent>

            <TabsContent value="sections">
              <SectionBuilder
                form={form}
                facilityId={encounterData?.facility?.id || ""}
              />
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
