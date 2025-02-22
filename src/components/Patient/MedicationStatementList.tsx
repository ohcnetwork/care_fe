import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import PrintTable from "@/components/Common/PrintTable";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import {
  MEDICATION_STATEMENT_STATUS_STYLES,
  MedicationStatementRead,
} from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";

interface MedicationStatementListProps {
  patientId: string;
  className?: string;
  isPrintPreview?: boolean;
}

interface MedicationRowProps {
  statement: MedicationStatementRead;
  isEnteredInError?: boolean;
}

function MedicationRow({ statement, isEnteredInError }: MedicationRowProps) {
  const { t } = useTranslation();

  return (
    <TableRow
      className={`rounded-md overflow-hidden bg-gray-50 ${
        isEnteredInError ? "opacity-50" : ""
      }`}
    >
      <TableCell className="font-medium first:rounded-l-md">
        {statement.medication.display ?? statement.medication.code}
      </TableCell>
      <TableCell>{statement.dosage_text}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`whitespace-nowrap capitalize ${
            MEDICATION_STATEMENT_STATUS_STYLES[statement.status]
          }`}
        >
          {statement.status}
        </Badge>
      </TableCell>
      <TableCell>
        {[statement.effective_period?.start, statement.effective_period?.end]
          .map((date) => formatDateTime(date))
          .join(" - ")}
      </TableCell>
      <TableCell>{statement.reason}</TableCell>
      <TableCell className="max-w-[200px]">
        {statement.note ? (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                >
                  {t("see_note")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {statement.note}
                </p>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="last:rounded-r-md">
        <div className="flex items-center gap-2">
          <Avatar
            name={formatName(statement.created_by)}
            className="w-4 h-4"
            imageUrl={statement.created_by.read_profile_picture_url}
          />
          <span className="text-sm">{formatName(statement.created_by)}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function MedicationStatementList({
  patientId,
  className = "",
  isPrintPreview = false,
}: MedicationStatementListProps) {
  const { t } = useTranslation();
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medication_statements", patientId],
    queryFn: query(medicationStatementApi.list, {
      pathParams: { patientId },
    }),
  });

  if (isLoading) {
    return (
      <MedicationStatementListLayout
        className={className}
        isPrintPreview={isPrintPreview}
      >
        <Skeleton className="h-[100px] w-full" />
      </MedicationStatementListLayout>
    );
  }

  const filteredMedications = medications?.results?.filter(
    (medication) =>
      showEnteredInError || medication.status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = medications?.results?.some(
    (medication) => medication.status === "entered_in_error",
  );

  if (!filteredMedications?.length) {
    return (
      <MedicationStatementListLayout
        className={className}
        isPrintPreview={isPrintPreview}
      >
        <p className="text-gray-500">{t("no_ongoing_medications")}</p>
      </MedicationStatementListLayout>
    );
  }

  return (
    <MedicationStatementListLayout
      medicationsCount={
        isPrintPreview ? medications?.count : filteredMedications.length
      }
      className={className}
      isPrintPreview={isPrintPreview}
    >
      {isPrintPreview ? (
        <PrintTable
          headers={[
            { key: "medication", title: t("medication") },
            { key: "dosage", title: t("dosage") },
            { key: "status", title: t("status") },
            {
              key: "medication_taken_between",
              title: t("medication_taken_between"),
            },
            { key: "reason", title: t("reason") },
            { key: "notes", title: t("notes") },
            { key: "logged_by", title: t("logged_by") },
          ]}
          rows={medications?.results.map((medication) => ({
            medication:
              medication.medication.display ?? medication.medication.code,
            dosage: medication.dosage_text,
            status: medication.status,
            medication_taken_between: [
              medication.effective_period?.start,
              medication.effective_period?.end,
            ]
              .map((date) => formatDateTime(date))
              .join(" - "),
            reason: medication.reason,
            notes: medication.note,
            logged_by: formatName(medication.created_by),
          }))}
        />
      ) : (
        <>
          <Table className="border-separate border-spacing-y-0.5">
            <TableHeader>
              <TableRow className="rounded-md overflow-hidden bg-gray-100">
                <TableHead className="first:rounded-l-md h-auto py-1 px-2 text-gray-600">
                  {t("medication")}
                </TableHead>
                <TableHead className="h-auto py-1 px-2 text-gray-600">
                  {t("dosage")}
                </TableHead>
                <TableHead className="h-auto py-1 px-2 text-gray-600">
                  {t("status")}
                </TableHead>
                <TableHead className="h-auto py-1 px-2 text-gray-600">
                  {t("medication_taken_between")}
                </TableHead>
                <TableHead className="h-auto py-1 px-2 text-gray-600">
                  {t("reason")}
                </TableHead>
                <TableHead className="h-auto py-1 px-2 text-gray-600">
                  {t("notes")}
                </TableHead>
                <TableHead className="last:rounded-r-md h-auto py-1 px-2 text-gray-600">
                  {t("logged_by")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ...filteredMedications.filter(
                  (medication) => medication.status !== "entered_in_error",
                ),
                ...(showEnteredInError
                  ? filteredMedications.filter(
                      (medication) => medication.status === "entered_in_error",
                    )
                  : []),
              ].map((statement) => (
                <MedicationRow
                  key={statement.id}
                  statement={statement}
                  isEnteredInError={statement.status === "entered_in_error"}
                />
              ))}
            </TableBody>
          </Table>
          {hasEnteredInErrorRecords && !showEnteredInError && (
            <>
              <div className="border-b border-dashed border-gray-200 my-2" />
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowEnteredInError(true)}
                  className="text-xs underline text-gray-500"
                >
                  {t("view_all")}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </MedicationStatementListLayout>
  );
}

const MedicationStatementListLayout = ({
  children,
  className,
  isPrintPreview = false,
  medicationsCount,
}: {
  children: React.ReactNode;
  className?: string;
  isPrintPreview?: boolean;
  medicationsCount?: number | undefined;
}) => {
  return (
    <Card
      className={cn(
        "rounded-sm ",
        className,
        isPrintPreview && "shadow-none border-none",
      )}
    >
      <CardHeader
        className={cn(
          "flex justify-between flex-row",
          !isPrintPreview && "px-4 pt-4 pb-2",
          isPrintPreview && "px-0 py-2 ",
        )}
      >
        <CardTitle>
          {t("ongoing_medications")}{" "}
          {medicationsCount ? `(${medicationsCount})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          !isPrintPreview && "px-2 pb-2",
          isPrintPreview && "px-0 py-0",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
