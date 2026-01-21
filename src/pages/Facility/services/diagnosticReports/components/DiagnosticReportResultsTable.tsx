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

import { Interpretation } from "@/types/base/qualifiedRange/qualifiedRange";
import {
  ObservationComponent,
  ObservationRead,
  ObservationReferenceRange,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";

interface DiagnosticReportResultsTableProps {
  observations: ObservationRead[];
}

export function DiagnosticReportResultsTable({
  observations,
}: DiagnosticReportResultsTableProps) {
  const renderReferenceRange = (
    referenceRange: ObservationReferenceRange[],
    value: QuestionnaireSubmitResultValue,
  ) => {
    if (!referenceRange || !referenceRange[0]) return "-";
    let range = null;
    if (value.value) {
      for (const r of referenceRange) {
        if (r.min && Number(value.value) < r.min) {
          continue;
        }
        if (r.max && Number(value.value) > r.max) {
          continue;
        }
        range = r;
        break;
      }
    }
    if (!range) return "-";
    let innerContent = "";
    if (range.min && range.max) {
      innerContent = `${range.min} - ${range.max}`;
    } else if (range.min) {
      innerContent = `> ${range.min}`;
    } else if (range.max) {
      innerContent = `< ${range.max}`;
    }
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <span>{innerContent}</span>
      </div>
    );
  };

  const parseInterpretationValue = (value: string): Interpretation | string => {
    if (typeof value === "object") {
      return value as Interpretation;
    }

    if (typeof value === "string" && value.startsWith("{")) {
      try {
        const jsonString = value.replace(/'/g, '"');
        return JSON.parse(jsonString) as Interpretation;
      } catch {
        return value;
      }
    }

    return value;
  };

  const renderInterpretation = (interpretationValue: string) => {
    if (!interpretationValue) return "-";

    const parsedInterpretation = parseInterpretationValue(interpretationValue);

    if (typeof parsedInterpretation === "object") {
      const { display, color = "#000000" } = parsedInterpretation;
      return (
        <div className="flex items-center gap-1">
          <span className="capitalize" style={{ color }}>
            {display}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-gray-500">
        <span className="capitalize">{parsedInterpretation}</span>
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
          component.interpretation && "font-semibold",
        )}
      >
        <TableCell className="pl-4 border-r border-b border-gray-300 whitespace-normal wrap-break-word">
          <div className="w-2 h-px bg-gray-400" />
          {component.code?.display}
        </TableCell>
        <TableCell className="border-r border-b border-gray-300 whitespace-normal wrap-break-word">
          <div className="whitespace-normal">
            <span>{component.value.value}</span>
            {component.value.unit && (
              <span className="text-gray-500 ml-1">
                {component.value.unit.code || component.value.unit.display}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="border-r border-b border-gray-300 whitespace-normal wrap-break-word">
          {component.reference_range &&
            renderReferenceRange(component.reference_range, component.value)}
        </TableCell>
        <TableCell className="border-b border-gray-300 whitespace-normal wrap-break-word">
          {renderInterpretation(component.interpretation || "")}
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
            observation.interpretation && "font-semibold",
          )}
        >
          <TableCell className="whitespace-normal wrap-break-word">
            {observation.observation_definition?.title ||
              observation.observation_definition?.code?.display}
          </TableCell>
          <TableCell className="whitespace-normal wrap-break-word">
            {!hasComponents && (
              <div className="whitespace-normal">
                <span>{observation.value.value}</span>
                {observation.value.unit && (
                  <span className="text-gray-500 ml-1">
                    {observation.value.unit.code ||
                      observation.value.unit.display}
                  </span>
                )}
              </div>
            )}
          </TableCell>
          <TableCell className="whitespace-normal wrap-break-word">
            {!hasComponents &&
              renderReferenceRange(
                observation.reference_range || [],
                observation.value,
              )}
          </TableCell>
          <TableCell className="whitespace-normal wrap-break-word">
            {!hasComponents &&
              observation.interpretation &&
              renderInterpretation(observation.interpretation)}
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
    <div className="rounded-md border overflow-hidden">
      <Table className="border-collapse bg-white shadow-sm cursor-default table-fixed w-full">
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x-1 divide-gray-300">
            <TableHead className="font-medium text-sm text-gray-700 w-[25%]">
              {t("test")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700 w-[25%]">
              {t("result")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700 w-[25%] whitespace-normal wrap-break-word">
              {t("reference_range")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700 w-[25%] whitespace-normal wrap-break-word">
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
