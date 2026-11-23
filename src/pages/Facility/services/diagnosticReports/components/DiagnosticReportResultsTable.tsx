import { t } from "i18next";
import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ObservationDetailSheet } from "@/components/Common/Charts/ObservationDetailSheet";

import { ConditionOperationSummary } from "@/types/base/condition/condition";
import {
  Interpretation,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import {
  ObservationRead,
  ObservationReferenceRange,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";

interface DiagnosticReportResultsTableProps {
  observations: ObservationRead[];
  patientId?: string;
  encounterId?: string;

  showObservationHistory?: boolean;
}

const CELL = "px-3 py-2.5 align-top whitespace-normal wrap-break-word";
const HEAD =
  "h-auto min-h-0 bg-transparent px-3 pt-2 pb-1.5 text-sm font-normal whitespace-normal text-soft-foreground";
// Reference range and interpretation get their own columns from sm up.
const WIDE_ONLY = "hidden sm:table-cell";

function formatRange(min?: number | string, max?: number | string) {
  if (min != null && max != null) return `${min} - ${max}`;
  if (min != null) return `> ${min}`;
  if (max != null) return `< ${max}`;
  return "";
}

function rangeLine(key: number, label?: string, range = "") {
  if (!label && !range) return null;
  return (
    <span key={key} className="block">
      {label ? `${label}: ` : ""}
      {range}
    </span>
  );
}

function renderReferenceRange(
  referenceRange?: ObservationReferenceRange[],
  qualifiedRanges?: QualifiedRange[],
): ReactNode {
  if (referenceRange?.length) {
    const lines = referenceRange
      .map((range, index) =>
        rangeLine(
          index,
          range.interpretation?.display,
          formatRange(range.min, range.max),
        ),
      )
      .filter(Boolean);
    return lines.length ? lines : null;
  }
  if (!qualifiedRanges?.length) return null;
  return (
    <div className="divide-y divide-soft-border">
      {qualifiedRanges.map((qualifiedRange, index) => (
        <div
          key={qualifiedRange.id ?? index}
          className="py-1.5 first:pt-0 last:pb-0"
        >
          {!!qualifiedRange.conditions?.length && (
            <span className="block text-sm font-medium text-foreground">
              {qualifiedRange.conditions.map((condition, conditionIndex) => (
                <Fragment key={conditionIndex}>
                  {conditionIndex > 0 && " · "}
                  <ConditionOperationSummary
                    condition={condition}
                    shortDisplay
                  />
                </Fragment>
              ))}
            </span>
          )}
          {qualifiedRange.ranges?.map((range, rangeIndex) =>
            rangeLine(
              rangeIndex,
              range.interpretation?.display,
              formatRange(range.min, range.max),
            ),
          )}
        </div>
      ))}
    </div>
  );
}

function interpretationLabel(interpretation?: Interpretation) {
  return interpretation?.code?.display || interpretation?.display;
}

export function DiagnosticReportResultsTable({
  observations,
  patientId,
  encounterId,
  showObservationHistory = false,
}: DiagnosticReportResultsTableProps) {
  const showInterpretation = observations.some(
    (observation) =>
      observation.interpretation?.display ||
      observation.component?.some(
        (component) => component.interpretation?.display,
      ),
  );

  const renderResultRow = ({
    key,
    title,
    value,
    interpretation,
    referenceRange,
    nested = false,
  }: {
    key: string;
    title: ReactNode;
    value: QuestionnaireSubmitResultValue;
    interpretation?: Interpretation;
    referenceRange: ReactNode;
    nested?: boolean;
  }) => {
    const highlight = interpretation?.highlight ?? false;
    const label = interpretationLabel(interpretation);
    return (
      <TableRow key={key} className="border-soft-border">
        <TableCell className={cn(CELL, nested && "pl-6")}>
          {title}
          {referenceRange && (
            <div className="mt-1 text-sm text-soft-foreground sm:hidden">
              {referenceRange}
            </div>
          )}
        </TableCell>
        <TableCell className={CELL}>
          <span className={cn(highlight && "font-semibold")}>
            {value.value}
            {value.unit && (
              <span className="ml-1 text-soft-foreground">
                {value.unit.code || value.unit.display}
              </span>
            )}
          </span>
          {label && (
            <span
              className={cn(
                "mt-1 block text-sm sm:hidden",
                highlight ? "font-semibold" : "text-soft-foreground",
              )}
            >
              {label}
            </span>
          )}
        </TableCell>
        <TableCell className={cn(CELL, WIDE_ONLY, "text-soft-foreground")}>
          {referenceRange ?? "-"}
        </TableCell>
        {showInterpretation && (
          <TableCell
            className={cn(CELL, WIDE_ONLY, highlight && "font-semibold")}
          >
            {label}
          </TableCell>
        )}
      </TableRow>
    );
  };

  const renderObservation = (observation: ObservationRead) => {
    const definition = observation.observation_definition;
    const observationTitle =
      definition?.title || definition?.code?.display || t("observation");
    const title =
      !!observation.main_code && !!patientId && showObservationHistory ? (
        <ObservationDetailSheet
          codes={[observation.main_code]}
          title={observationTitle}
          patientId={patientId}
          encounterId={encounterId}
          trigger={
            <Button
              variant="link"
              className="h-auto justify-start p-0 text-left font-medium tracking-normal whitespace-normal"
            >
              {observationTitle}
            </Button>
          }
        />
      ) : (
        observationTitle
      );

    if (!observation.component?.length) {
      return renderResultRow({
        key: observation.id,
        title,
        value: observation.value,
        interpretation: observation.interpretation,
        referenceRange: renderReferenceRange(
          observation.reference_range,
          definition?.qualified_ranges,
        ),
      });
    }

    // A panel: its name heads the rows of its component results.
    return (
      <Fragment key={observation.id}>
        <TableRow className="border-b-0">
          <TableCell className={cn(CELL, "pb-0.5 font-medium")}>
            {title}
          </TableCell>
          <TableCell className={CELL} />
          <TableCell className={cn(CELL, WIDE_ONLY)} />
          {showInterpretation && <TableCell className={cn(CELL, WIDE_ONLY)} />}
        </TableRow>
        {observation.component.map((component, index) =>
          renderResultRow({
            key: `${observation.id}-${component.code?.code ?? index}`,
            title: component.code?.display,
            value: component.value,
            interpretation: component.interpretation,
            referenceRange: renderReferenceRange(
              component.reference_range,
              definition?.component?.find(
                (c) => c.code?.code === component.code?.code,
              )?.qualified_ranges,
            ),
            nested: true,
          }),
        )}
      </Fragment>
    );
  };

  if (!observations?.length) {
    return null;
  }

  return (
    <Table className="w-full table-fixed cursor-default bg-background">
      <TableHeader>
        <TableRow className="border-soft-border">
          <TableHead className={cn(HEAD, "w-[60%] sm:w-[30%]")}>
            {t("test")}
          </TableHead>
          <TableHead className={cn(HEAD, "w-[40%] sm:w-[22%]")}>
            {t("result")}
          </TableHead>
          <TableHead className={cn(HEAD, WIDE_ONLY, "sm:w-[28%]")}>
            {t("reference_range")}
          </TableHead>
          {showInterpretation && (
            <TableHead className={cn(HEAD, WIDE_ONLY, "sm:w-[20%]")}>
              {t("interpretation")}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>{observations.map(renderObservation)}</TableBody>
    </Table>
  );
}
