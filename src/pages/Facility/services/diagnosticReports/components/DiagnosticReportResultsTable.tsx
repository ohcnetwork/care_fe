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
  const hasReferenceRange = observations.some(
    (observation) =>
      observation.reference_range && observation.reference_range.length > 0,
  );
  const hasInterpretation = observations.some(
    (observation) => observation.interpretation?.display,
  );
  const hasComponentReferenceRange = observations.some(
    (observation) =>
      observation.component &&
      observation.component.some(
        (component) =>
          component.reference_range && component.reference_range.length > 0,
      ),
  );
  const hasComponentInterpretation = observations.some(
    (observation) =>
      observation.component &&
      observation.component.some(
        (component) => component.interpretation?.display,
      ),
  );
  const showReferenceRange = hasReferenceRange || hasComponentReferenceRange;
  const showInterpretation = hasInterpretation || hasComponentInterpretation;

  const renderReferenceRange = (
    referenceRange: ObservationReferenceRange[],
    value: QuestionnaireSubmitResultValue,
  ) => {
    if (!referenceRange || !referenceRange[0]) return "-";

    const numericValue = value.value != null ? Number(value.value) : null;

    const isApplicable = (r: ObservationReferenceRange) => {
      if (numericValue === null || isNaN(numericValue)) return false;
      if (r.min != null && numericValue < r.min) return false;
      if (r.max != null && numericValue > r.max) return false;
      return true;
    };

    const rows = referenceRange.map((r, i) => {
      let rangeText = "";
      if (r.min != null && r.max != null) {
        rangeText = `${r.min} - ${r.max}`;
      } else if (r.min != null) {
        rangeText = `> ${r.min}`;
      } else if (r.max != null) {
        rangeText = `< ${r.max}`;
      }
      if (!rangeText && !r.interpretation?.display) return null;

      const label = r.interpretation?.display;
      const applicable = isApplicable(r);

      return (
        <span key={i} className={applicable ? "font-bold text-gray-900" : ""}>
          {label ? `${label}: ` : ""}
          {rangeText}
        </span>
      );
    });

    const validRows = rows.filter(Boolean);
    if (!validRows.length) return "-";

    return (
      <div className="flex flex-col items-start gap-0.5 text-gray-500">
        {validRows}
      </div>
    );
  };

  const renderInterpretation = (interpretationValue: Interpretation) => {
    if (!interpretationValue) return "-";

    const { display, color = "#000000" } = interpretationValue;
    return (
      <div className="flex items-center gap-1">
        <span className="capitalize" style={{ color }}>
          {display}
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
        {showReferenceRange && (
          <TableCell className="border-r border-b border-gray-300 whitespace-normal wrap-break-word">
            {component.reference_range &&
              renderReferenceRange(component.reference_range, component.value)}
          </TableCell>
        )}
        {showInterpretation && (
          <TableCell className="border-b border-gray-300 whitespace-normal wrap-break-word">
            {component.interpretation &&
              renderInterpretation(component.interpretation)}
          </TableCell>
        )}
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
          {showReferenceRange && (
            <TableCell className="whitespace-normal wrap-break-word">
              {!hasComponents &&
                observation.reference_range &&
                renderReferenceRange(
                  observation.reference_range,
                  observation.value,
                )}
            </TableCell>
          )}
          {showInterpretation && (
            <TableCell className="whitespace-normal wrap-break-word">
              {!hasComponents &&
                observation.interpretation &&
                renderInterpretation(observation.interpretation)}
            </TableCell>
          )}
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
            {showReferenceRange && (
              <TableHead className="font-medium text-sm text-gray-700 w-[25%] whitespace-normal wrap-break-word">
                {t("reference_range")}
              </TableHead>
            )}
            {showInterpretation && (
              <TableHead className="font-medium text-sm text-gray-700 w-[25%] whitespace-normal wrap-break-word">
                {t("interpretation")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {observations.map((observation) => renderObservation(observation))}
        </TableBody>
      </Table>
    </div>
  );
}
