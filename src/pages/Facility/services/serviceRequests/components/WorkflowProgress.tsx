import { format } from "date-fns";
import { CheckCircle2, PanelRight } from "lucide-react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";

import { formatName } from "@/Utils/utils";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead } from "@/types/emr/specimen/specimen";

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

function TimelineNode({ event }: { event: TimelineEvent }) {
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
  return (
    <>
      <div className="flex items-center gap-2 p-4 border-b">
        <CareIcon icon="l-clipboard-alt" className="size-5" />
        <h2 className="text-lg font-semibold">Workflow Progress</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="p-4 space-y-2">
          {events.map((event, index) => (
            <TimelineNode key={index} event={event} />
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
  const events: TimelineEvent[] = [];
  const sheetPosition = useBreakpoints({
    default: "bottom",
    md: "right",
  });

  // Add service request creation
  if (request.created_by && request.created_date) {
    events.push({
      title: "Service Request Created",
      description: `Request initiated by ${formatName(request.created_by)}`,
      timestamp: request.created_date,
      status: "completed",
    });
  }

  // Add specimen collection events
  request.specimens?.forEach((specimen: SpecimenRead) => {
    if (specimen.collection?.collected_date_time) {
      events.push({
        title: "Specimen Collected",
        description: `${specimen.specimen_type?.display || "Specimen"} collected`,
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
          title: "Specimen Processed",
          description: `${specimen.specimen_type?.display || "Specimen"} processed`,
          additional_info: `${processing.method?.display || "Method"}`,
          timestamp: processing.time_date_time,
          status: "completed",
        });
      }
    });
  });

  // Add diagnostic report events
  request.diagnostic_reports?.forEach((report: DiagnosticReportRead) => {
    events.push({
      title:
        report.status === "final"
          ? "Diagnostic Report Approved"
          : "Diagnostic Report In Progress",
      description:
        report.status === "final"
          ? `Report approved and finalized`
          : `Report created and pending approval`,
      timestamp: report.created_date,
      status: report.status === "final" ? "completed" : "in_progress",
    });
  });

  // Sort events by timestamp
  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (variant === "sheet") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border border-gray-400"
          >
            <PanelRight />
          </Button>
        </SheetTrigger>
        <SheetContent
          side={sheetPosition === "bottom" ? "bottom" : "right"}
          className={cn(
            "p-0",
            sheetPosition === "bottom" ? "h-[80vh]" : "h-screen max-w-md",
          )}
        >
          <Card className="h-full rounded-none border-none shadow-none">
            <WorkflowContent events={events} />
          </Card>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className={className}>
      <WorkflowContent events={events} />
    </Card>
  );
}
