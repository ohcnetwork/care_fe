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

import { Separator } from "@/components/ui/separator";
import { ConditionOperationSummary } from "@/types/base/condition/condition";
import {
  Interpretation,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import {
  ObservationComponent,
  ObservationRead,
  ObservationReferenceRange,
} from "@/types/emr/observation/observation";
import { BaseObservationDefinitionSpec } from "@/types/emr/observationDefinition/observationDefinition";

interface DiagnosticReportResultsTableProps {
  observations: ObservationRead[];
}

export function DiagnosticReportResultsTable({
  observations,
}: DiagnosticReportResultsTableProps) {
  const hasInterpretation = observations.some(
    (observation) => observation.interpretation?.display,
  );
  const hasComponentInterpretation = observations.some(
    (observation) =>
      observation.component &&
      observation.component.some(
        (component) => component.interpretation?.display,
      ),
  );
  const showInterpretation = hasInterpretation || hasComponentInterpretation;

  const renderConditionsWithReferenceRange = (
    qualifiedRanges: QualifiedRange[],
  ) => {
    if (!qualifiedRanges || qualifiedRanges.length === 0) return "-";
    return qualifiedRanges.map((qr, ind) => {
      return (
        <div
          key={qr.id}
          className="flex flex-col gap-1 text-sm text-gray-500 font-normal"
        >
          <div className="flex flex-row text-sm divide-x divide-gray-300 space-x-2">
            {qr.conditions?.map((c, ind) => (
              <span className="text-gray-900 pr-2" key={`condition-${ind}`}>
                <ConditionOperationSummary condition={c} shortDisplay={true} />
              </span>
            ))}
          </div>
          {qr.ranges?.map((r, i) => {
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

            return (
              <span key={i} className="text-gray-900 self-start ml-2">
                {label ? `${label}: ` : ""}
                {rangeText}
              </span>
            );
          })}
          {ind < qualifiedRanges.length - 1 && (
            <Separator className="bg-gray-200 mb-2" />
          )}
        </div>
      );
    });
  };

  const renderInterpretation = (interpretationValue: Interpretation) => {
    if (!interpretationValue) return "-";

    const { display, highlight = false, code } = interpretationValue;
    return (
      <div className="flex items-center gap-1">
        <span className={cn(highlight ? "font-bold" : "font-normal")}>
          {code && code.display ? code.display : display}
        </span>
      </div>
    );
  };

  const renderObservationReferenceRange = (
    referenceRange: ObservationReferenceRange[],
  ) => {
    if (!referenceRange?.length) return "-";

    return referenceRange.map((range, index) => {
      let rangeText = "";
      if (range.min != null && range.max != null) {
        rangeText = `${range.min} - ${range.max}`;
      } else if (range.min != null) {
        rangeText = `> ${range.min}`;
      } else if (range.max != null) {
        rangeText = `< ${range.max}`;
      }

      const label = range.interpretation?.display;
      if (!label && !rangeText) return null;

      return (
        <span key={`observation-reference-range-${index}`} className="block">
          {label ? `${label}: ` : ""}
          {rangeText}
        </span>
      );
    });
  };

  const renderObservationComponents = (
    components: ObservationComponent[],
    observationDefinition: BaseObservationDefinitionSpec,
  ) => {
    return components.map((component, index) => {
      const componentQualifiedRange = observationDefinition.component.find(
        (c) => c.code?.code === component.code?.code,
      )?.qualified_ranges;
      const highlight = component.interpretation?.highlight ?? false;
      return (
        <TableRow
          key={component.code?.code}
          className={cn(
            "bg-gray-50/50 border-0 text-sm text-gray-950",
            index === components.length - 1 && "border-b",
          )}
        >
          <TableCell className="pl-4 border-r border-b border-gray-300 whitespace-normal wrap-break-word align-top">
            <div className="w-2 h-px bg-gray-400" />
            {component.code?.display}
          </TableCell>
          <TableCell className="border-r border-b border-gray-300 whitespace-normal wrap-break-word align-top">
            <div
              className={cn(
                "whitespace-normal",
                highlight ? "font-bold" : "font-normal",
              )}
            >
              <span>{component.value.value}</span>
              {component.value.unit && (
                <span className="text-gray-500 ml-1">
                  {component.value.unit.code || component.value.unit.display}
                </span>
              )}
            </div>
          </TableCell>
          <TableCell className="border-r border-b border-gray-300 whitespace-normal wrap-break-word align-top">
            {component.reference_range?.length
              ? renderObservationReferenceRange(component.reference_range)
              : componentQualifiedRange &&
                renderConditionsWithReferenceRange(componentQualifiedRange)}
          </TableCell>
          {showInterpretation && (
            <TableCell className="border-b border-gray-300 whitespace-normal wrap-break-word align-top">
              {component.interpretation &&
                renderInterpretation(component.interpretation)}
            </TableCell>
          )}
        </TableRow>
      );
    });
  };

  const renderObservation = (observation: ObservationRead) => {
    const hasComponents =
      observation.component && observation.component.length > 0;
    const highlight = observation.interpretation?.highlight ?? false;

    return (
      <>
        <TableRow
          key={observation.id}
          className={cn(
            "divide-x divide-gray-300 text-sm text-gray-950",
            hasComponents && "border-b-0",
          )}
        >
          <TableCell className="whitespace-normal wrap-break-word align-top">
            {observation.observation_definition?.title ||
              observation.observation_definition?.code?.display}
          </TableCell>
          <TableCell className="whitespace-normal wrap-break-word align-top">
            {!hasComponents && (
              <div
                className={cn(
                  "whitespace-normal",
                  highlight ? "font-bold" : "font-normal",
                )}
              >
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
          {
            <TableCell className="whitespace-normal wrap-break-word align-top">
              {!hasComponents &&
                (observation.reference_range?.length
                  ? renderObservationReferenceRange(observation.reference_range)
                  : observation.observation_definition &&
                    renderConditionsWithReferenceRange(
                      observation.observation_definition.qualified_ranges,
                    ))}
            </TableCell>
          }
          {showInterpretation && (
            <TableCell className="whitespace-normal wrap-break-word align-top">
              {!hasComponents &&
                observation.interpretation &&
                renderInterpretation(observation.interpretation)}
            </TableCell>
          )}
        </TableRow>
        {hasComponents &&
          observation.component &&
          observation.observation_definition &&
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
            <TableHead className="font-medium text-sm text-gray-700 w-[25%] align-top pt-2">
              {t("test")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700 w-[25%] align-top pt-2">
              {t("result")}
            </TableHead>
            <TableHead className="font-medium text-sm text-gray-700 w-[25%] whitespace-normal wrap-break-word align-top pt-2">
              {t("reference_range")}
            </TableHead>
            {showInterpretation && (
              <TableHead className="font-medium text-sm text-gray-700 w-[25%] whitespace-normal wrap-break-word align-top pt-2">
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
