import { useQueries } from "@tanstack/react-query";
import { Link, useFullPath, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatDosage } from "@/components/Medicine/utils";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import useAuthUser from "@/hooks/useAuthUser";
import {
  displayMedicationName,
  fhirDosageToFrequencyValue,
  type MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import type { MedicationStatementRead } from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { currentMedicationsConfigSchema } from "@/types/workspace/widgetConfigSchemas";
import query from "@/Utils/request/query";
import { formatDateTime, formatName, relativeDate } from "@/Utils/utils";

interface CurrentMedicationsWidgetProps {
  patientId: string;
  facilityId?: string;
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

interface MedicationRow {
  id: string;
  name: string;
  dosage: string;
  since?: string;
  prescriber: "you" | "outside" | { name: string };
}

function requestRow(
  request: MedicationRequestRead,
  currentUsername: string,
): MedicationRow {
  const prescriber = request.requester ?? request.created_by;
  return {
    id: request.id,
    name: displayMedicationName(request),
    dosage: request.dosage_instruction
      .map((instruction) =>
        [formatDosage(instruction), fhirDosageToFrequencyValue(instruction)]
          .filter(Boolean)
          .join(" · "),
      )
      .filter(Boolean)
      .join("; "),
    since: request.authored_on,
    prescriber:
      prescriber.username === currentUsername
        ? "you"
        : { name: formatName(prescriber) },
  };
}

function statementRow(statement: MedicationStatementRead): MedicationRow {
  return {
    id: statement.id,
    name: statement.medication.display,
    dosage: statement.dosage_text,
    since: statement.effective_period?.start ?? statement.created_date,
    prescriber: "outside",
  };
}

export function CurrentMedicationsWidget({
  patientId,
  facilityId,
  title,
  showEmpty = false,
  config = {},
}: CurrentMedicationsWidgetProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const path = useFullPath();
  const [queryParams] = useQueryParams<Record<string, string>>();
  const parsedConfig = currentMedicationsConfigSchema.safeParse(config);
  const limit = parsedConfig.data?.limit ?? 10;
  const sources = parsedConfig.data?.sources ?? "both";
  const includeRequests = sources !== "statements";
  const includeStatements = sources !== "prescriptions";
  const [requests, statements] = useQueries({
    queries: [
      {
        queryKey: ["medication_requests", patientId, "current", limit],
        queryFn: query(medicationRequestApi.list, {
          pathParams: { patientId },
          queryParams: {
            status: "active",
            medications_only: true,
            limit,
            ordering: "-authored_on",
          },
          silent: true,
        }),
        enabled: parsedConfig.success && includeRequests,
      },
      {
        queryKey: ["medication_statements", patientId, "current", limit],
        queryFn: query(medicationStatementApi.list, {
          pathParams: { patientId },
          queryParams: { status: "active", limit },
          silent: true,
        }),
        enabled: parsedConfig.success && includeStatements,
      },
    ],
  });

  const heading = title ?? t("workspace_current_medications");
  if (!parsedConfig.success) {
    return (
      <section aria-label={heading}>
        <Alert variant="destructive">
          <AlertDescription>
            {t("encounter_widget_config_invalid")}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const isLoading =
    (includeRequests && requests.isLoading) ||
    (includeStatements && statements.isLoading);
  const isError =
    (includeRequests && requests.isError) ||
    (includeStatements && statements.isError);
  const rows = [
    ...(includeRequests ? (requests.data?.results ?? []) : []).map((request) =>
      requestRow(request, user.username),
    ),
    ...(includeStatements ? (statements.data?.results ?? []) : []).map(
      statementRow,
    ),
  ]
    .sort((a, b) => Date.parse(b.since ?? "") - Date.parse(a.since ?? ""))
    .slice(0, limit);
  if (!isLoading && !isError && !rows.length && !showEmpty) return null;

  const search = new URLSearchParams(queryParams).toString();
  const sourceUrl = search ? `${path}?${search}` : path;
  const patientPath = facilityId
    ? `/facility/${facilityId}/patient/${patientId}`
    : `/patient/${patientId}`;
  const historyLink = (
    <Link
      href={`${patientPath}/history/medications?sourceUrl=${encodeURIComponent(sourceUrl)}`}
      className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
    >
      {t("medication_history")}
    </Link>
  );

  return (
    <section aria-label={heading} className="min-w-0">
      <EncounterAccordionLayout
        title={heading}
        readOnly
        presentation="panel"
        actionButton={historyLink}
        className="min-w-0 overflow-hidden"
      >
        {isLoading ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ClinicalListError
            isFetching={requests.isFetching || statements.isFetching}
            onRetry={() => {
              if (requests.isError) requests.refetch();
              if (statements.isError) statements.refetch();
            }}
          />
        ) : !rows.length ? (
          <p className="px-2 py-5 text-sm text-soft-foreground">
            {t("no_active_medication_recorded")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-soft-background">
                <TableHead className="h-8 text-xs">{t("medicine")}</TableHead>
                <TableHead className="h-8 text-xs">{t("dosage")}</TableHead>
                <TableHead className="h-8 text-xs">{t("duration")}</TableHead>
                <TableHead className="h-8 text-xs">
                  {t("prescribed_by")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-2 text-sm font-medium break-words whitespace-normal text-foreground">
                    {row.name}
                  </TableCell>
                  <TableCell className="py-2 text-sm break-words whitespace-normal text-muted-foreground">
                    {row.dosage || "-"}
                  </TableCell>
                  <TableCell className="py-2 text-sm whitespace-nowrap text-muted-foreground">
                    {row.since ? (
                      <>
                        <time
                          dateTime={row.since}
                          title={formatDateTime(row.since)}
                        >
                          {t("workspace_medications_since", {
                            date: formatDateTime(row.since, "DD MMM YYYY"),
                          })}
                        </time>
                        <span className="block text-xs text-soft-foreground">
                          {relativeDate(row.since, true)}
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-sm whitespace-nowrap text-muted-foreground">
                    {row.prescriber === "you" ? (
                      <span className="font-medium text-primary-700">
                        {t("workspace_medications_prescribed_by_you")}
                      </span>
                    ) : row.prescriber === "outside" ? (
                      <span className="text-soft-foreground">
                        {t("workspace_medications_outside_rx")}
                      </span>
                    ) : (
                      row.prescriber.name
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}
