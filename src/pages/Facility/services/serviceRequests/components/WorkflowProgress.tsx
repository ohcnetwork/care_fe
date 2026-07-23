import { format } from "date-fns";
import { CheckCircle2, PanelRight } from "lucide-react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

import useBreakpoints from "@/hooks/useBreakpoints";

import { formatName } from "@/Utils/utils";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead } from "@/types/emr/specimen/specimen";
import { useTranslation } from "react-i18next";

interface TimelineEvent {
  title: string;
  description: string;
  additional_info?: string;
  timestamp: string;
  status: "completed" | "pending" | "in_progress";
}

interface WorkflowProgressProps {
  request: ServiceRequestReadSpec;
  className?: string;
  variant?: "sheet" | "card";
}

function TimelineNode({
  event,
  isLatest,
}: {
  event: TimelineEvent;
  isLatest?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative flex gap-8 pl-8 pt-0.5 group">
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div className="absolute w-px bg-gray-200 h-full top-4 group-last:hidden" />
        <div
          className={cn(
            "size-6 rounded-full flex items-center justify-center",
            event.status === "completed" && "bg-green-100",
            event.status === "in_progress" && "bg-blue-100",
            event.status === "pending" && "bg-gray-100",
          )}
        >
          {event.status === "completed" && (
            <CheckCircle2 className="size-4 text-green-600" />
          )}
          {event.status === "in_progress" && (
            <div className="size-2 rounded-full bg-blue-600 animate-pulse" />
          )}
          {event.status === "pending" && (
            <div className="size-2 rounded-full bg-gray-400" />
          )}
        </div>
        {!event.status && <div className="flex-1 w-px bg-gray-200" />}
      </div>
      <div className="flex flex-col gap-1 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-6">
              <h3
                className={cn(
                  "font-medium text-base",
                  event.status === "completed" && "text-gray-900",
                  event.status === "in_progress" && "text-blue-900",
                  event.status === "pending" && "text-gray-500",
                )}
              >
                {event.title}
              </h3>
              {isLatest && <Badge variant="primary">{t("latest")}</Badge>}
            </div>
            <p className="text-sm text-gray-500">{event.description}</p>
            <p className="text-sm text-gray-500">{event.additional_info}</p>
            <time className="text-sm text-gray-500 whitespace-nowrap">
              {format(new Date(event.timestamp), " hh:mm a, MMM d, yyyy")}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowContent({ events }: { events: TimelineEvent[] }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-center gap-2 p-4 border-b">
        <CareIcon icon="l-clipboard-alt" className="size-5" />
        <h2 className="text-lg font-semibold">{t("workflow_progress")}</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="p-4 space-y-2">
          {events.map((event, index) => (
            <TimelineNode key={index} event={event} isLatest={index === 0} />
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

export function WorkflowProgress({
  request,
  className,
  variant = "card",
}: WorkflowProgressProps) {
  const { t } = useTranslation();
  const events: TimelineEvent[] = [];
  const direction = useBreakpoints({
    default: "bottom" as const,
    md: "right" as const,
  });

  // Add service request creation
  if (request.created_by && request.created_date) {
    events.push({
      title: t("service_request_created"),
      description: t("request_initiated_by", {
        name: formatName(request.created_by),
      }),
      timestamp: request.created_date,
      status: "completed",
    });
  }

  // Add specimen collection events
  request.specimens?.forEach((specimen: SpecimenRead) => {
    if (specimen.collection?.collected_date_time) {
      events.push({
        title: t("specimen_collected"),
        description: t("specimen_collected_description", {
          specimen: specimen.specimen_type?.display || t("specimen"),
        }),
        timestamp: specimen.collection.collected_date_time,
        status: "completed",
      });
    }
  });

  // Add specimen processing events
  request.specimens?.forEach((specimen: SpecimenRead) => {
    specimen.processing.forEach((processing) => {
      if (processing.time_date_time) {
        events.push({
          title: t("specimen_processed"),
          description: t("specimen_processed_description", {
            specimen: specimen.specimen_type?.display || t("specimen"),
          }),
          additional_info: processing.method?.display || t("method"),
          timestamp: processing.time_date_time,
          status: "completed",
        });
      }
    });
  });

  request.diagnostic_reports?.forEach((report: DiagnosticReportRead) => {
    const diagnosticReportName =
      report.code?.display ?? report.service_request?.title ?? t("diagnostic");
    events.push({
      title:
        report.status === "final"
          ? t("diagnostic_report_approved")
          : t("diagnostic_report_in_progress"),
      description:
        report.status === "final"
          ? t("diagnostic_report_approved_description", {
              name: diagnosticReportName,
            })
          : t("diagnostic_report_in_progress_description", {
              name: diagnosticReportName,
            }),
      timestamp:
        report.status === "final" ? report.modified_date : report.created_date,
      status: report.status === "final" ? "completed" : "in_progress",
    });
  });

  // Add diagnostic report events
  request.diagnostic_reports?.forEach((report: DiagnosticReportRead) => {
    events.push({
      title: t("diagnostic_report_created"),
      description: t("diagnostic_report_created_description", {
        name:
          report.code?.display ??
          report.service_request?.title ??
          t("diagnostic"),
      }),
      timestamp: report.created_date,
      status: "completed",
    });
  });

  // Sort events by timestamp (latest first)
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (variant === "sheet") {
    return (
      <Drawer direction={direction}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border border-gray-400"
          >
            <PanelRight />
          </Button>
        </DrawerTrigger>
        <DrawerContent
          className={cn(
            "p-0",
            direction === "bottom" ? "h-[80vh]" : "h-screen max-w-md",
          )}
        >
          <Card className="h-full rounded-none border-none shadow-none">
            <WorkflowContent events={events} />
          </Card>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Card className={className}>
      <WorkflowContent events={events} />
    </Card>
  );
}
