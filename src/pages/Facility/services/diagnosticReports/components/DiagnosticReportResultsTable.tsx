import { t } from "i18next";

import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ObservationComponent,
  ObservationRead,
} from "@/types/emr/observation/observation";

interface DiagnosticReportResultsTableProps {
  observations: ObservationRead[];
}

export function DiagnosticReportResultsTable({
  observations,
}: DiagnosticReportResultsTableProps) {
  const renderReferenceRange = (referenceRange: any) => {
    if (!referenceRange || !referenceRange[0]) return "-";
    const range = referenceRange[0];
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <span>
          {range.low?.value} - {range.high?.value}{" "}
          {range.low?.unit?.display || range.high?.unit?.display}
        </span>
      </div>
    );
  };

  const renderObservationComponents = (components: ObservationComponent[]) => {
    return components.map((component, index) => (
      <TableRow
        key={component.code?.code}
        className={cn(
          "bg-gray-50/50 border-0 text-sm text-gray-950",
          index === components.length - 1 && "border-b",
          component.interpretation == "abnormal" && "font-semibold",
        )}
      >
        <TableCell className="pl-4 border-r border-b border-gray-300">
          <div className="flex items-center gap-1">
            <div className="w-2 h-px bg-gray-400" />
            {component.code?.display}
          </div>
        </TableCell>
        <TableCell className="border-r border-b border-gray-300">
          <div className="flex items-center gap-2">
            <span>{component.value.value}</span>
            {component.value.unit && (
              <span className="text-gray-500">
                {component.value.unit.display}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="border-r border-b border-gray-300">
          {renderReferenceRange(component.reference_range)}
        </TableCell>
        <TableCell className="border-b border-gray-300">
          <span className="capitalize">
            {t(component.interpretation || "")}
          </span>
        </TableCell>
      </TableRow>
    ));
  };

  const renderObservation = (observation: ObservationRead) => {
    const hasComponents =
      observation.component && observation.component.length > 0;

    return (
      <>
        <TableRow
          key={observation.id}
          className={cn(
            "divide-x divide-gray-300 text-sm text-gray-950",
            hasComponents && "border-b-0",
            observation.interpretation == "abnormal" && "font-semibold",
          )}
        >
          <TableCell>
            {observation.observation_definition?.title ||
              observation.observation_definition?.code?.display}
          </TableCell>
          <TableCell>
            {!hasComponents && (
              <div className="flex items-center gap-2">
                <span>{observation.value.value}</span>
                {observation.value.unit && (
                  <span className="text-gray-500">
                    {observation.value.unit.display}
                  </span>
                )}
              </div>
            )}
          </TableCell>
          <TableCell>
            {!hasComponents &&
              renderReferenceRange(observation.reference_range)}
          </TableCell>
          <TableCell>
            {!hasComponents && observation.interpretation && (
              <span className="capitalize">
                {t(observation.interpretation)}
              </span>
            )}
          </TableCell>
        </TableRow>
        {hasComponents &&
          observation.component &&
          renderObservationComponents(observation.component)}
      </>
    );
  };

  if (!observations?.length) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table className="border-collapse bg-white shadow-sm cursor-default">
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x-1 divide-gray-300">
            <TableHead className="font-medium text-sm text-gray-700">
              {t("test")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700">
              {t("result")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700">
              {t("reference_range")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700">
              {t("interpretation")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {observations.map((observation) => renderObservation(observation))}
        </TableBody>
      </Table>
    </div>
  );
}
