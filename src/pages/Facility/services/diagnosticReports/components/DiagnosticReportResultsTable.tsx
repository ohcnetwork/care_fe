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
  Interpretation,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import {
  ObservationComponent,
  ObservationRead,
  ObservationReferenceRange,
} from "@/types/emr/observation/observation";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";

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
  const hasComponentQualifiedRanges = observations.some((observation) =>
    observation.observation_definition?.component?.some(
      (dc) => dc.qualified_ranges && dc.qualified_ranges.length > 0,
    ),
  );
  const hasComponentInterpretation = observations.some(
    (observation) =>
      observation.component &&
      observation.component.some(
        (component) => component.interpretation?.display,
      ),
  );
  const showReferenceRange =
    hasReferenceRange ||
    hasComponentReferenceRange ||
    hasComponentQualifiedRanges;
  const showInterpretation = hasInterpretation || hasComponentInterpretation;

  const renderReferenceRange = (
    qualifiedRanges: QualifiedRange[],
    referenceRange?: ObservationReferenceRange[],
  ) => {
    if (!qualifiedRanges.length) return "-";

    return (
      <div className="flex flex-col items-start gap-1 text-gray-500">
        {qualifiedRanges.flatMap((qr, qrIndex) => {
          const isApplicable =
            !!referenceRange?.length &&
            qr.ranges.length === referenceRange.length &&
            qr.ranges.every((range, i) => {
              const ref = referenceRange[i];
              const minMatch =
                range.min == null
                  ? ref.min == null
                  : ref.min != null && Number(range.min) === Number(ref.min);
              const maxMatch =
                range.max == null
                  ? ref.max == null
                  : ref.max != null && Number(range.max) === Number(ref.max);
              return minMatch && maxMatch;
            });
          return qr.ranges.map((range, rangeIndex) => {
            let rangeContent = "";
            if (range.min && range.max) {
              rangeContent = `${range.min} - ${range.max}`;
            } else if (range.min) {
              rangeContent = `> ${range.min}`;
            } else if (range.max) {
              rangeContent = `< ${range.max}`;
            }
            const label = range.interpretation?.display;
            return (
              <span
                key={`${qrIndex}-${rangeIndex}`}
                className={isApplicable ? "font-semibold text-gray-900" : ""}
              >
                {label ? `${label}: ${rangeContent}` : rangeContent}
              </span>
            );
          });
        })}
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

  const renderObservationComponents = (
    components: ObservationComponent[],
    observationDefinition: ObservationDefinitionReadSpec | null | undefined,
  ) => {
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
            {renderReferenceRange(
              observationDefinition?.component?.find(
                (dc) => dc.code.code === component.code?.code,
              )?.qualified_ranges ?? [],
              component.reference_range,
            )}
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
            observation.interpretation && "font-semibold",
          )}
        >
          <TableCell
            className={cn(
              "whitespace-normal wrap-break-word",
              hasComponents && "border-b border-gray-300",
            )}
          >
            {observation.observation_definition?.title ||
              observation.observation_definition?.code?.display}
          </TableCell>
          <TableCell
            className={cn(
              "whitespace-normal wrap-break-word",
              hasComponents && "border-b border-gray-300",
            )}
          >
            {" "}
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
            <TableCell
              className={cn(
                "whitespace-normal wrap-break-word",
                hasComponents && "border-b border-gray-300",
              )}
            >
              {!hasComponents &&
                renderReferenceRange(
                  observation.observation_definition?.qualified_ranges ?? [],
                  observation.reference_range,
                )}
            </TableCell>
          )}
          {showInterpretation && (
            <TableCell
              className={cn(
                "whitespace-normal wrap-break-word",
                hasComponents && "border-b border-gray-300",
              )}
            >
              {!hasComponents &&
                observation.interpretation &&
                renderInterpretation(observation.interpretation)}
            </TableCell>
          )}
        </TableRow>
        {hasComponents &&
          observation.component &&
          renderObservationComponents(
            observation.component,
            observation.observation_definition,
          )}
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
