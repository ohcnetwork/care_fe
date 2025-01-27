import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

interface MedicationStatementListProps {
  patientId: string;
}

interface MedicationRowProps {
  statement: any;
  isEnteredInError?: boolean;
  index: number;
}

function MedicationRow({
  statement,
  isEnteredInError,
  index,
}: MedicationRowProps) {
  return (
    <TableRow
      key={index}
      className={isEnteredInError ? "opacity-50 bg-gray-50/50" : undefined}
    >
      <TableCell className="font-medium">
        <Tooltip>
          <TooltipTrigger asChild className="max-w-60 truncate">
            <p>{statement.medication.display ?? statement.medication.code}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statement.medication.display ?? statement.medication.code}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild className="max-w-36 truncate">
            <p>{statement.dosage_text}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statement.dosage_text}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Badge
          variant={isEnteredInError ? "destructive" : "outline"}
          className="whitespace-nowrap capitalize"
        >
          {statement.status}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {[statement.effective_period?.start, statement.effective_period?.end]
          .map((date) => formatDateTime(date))
          .join(" - ")}
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild className="max-w-60 truncate">
            <p>{statement.reason}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statement.reason}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild className="max-w-60 truncate">
            <p>{statement.note}</p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statement.note}</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export function MedicationStatementList({
  patientId,
}: MedicationStatementListProps) {
  const { t } = useTranslation();
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medication_statements", patientId],
    queryFn: query(routes.medicationStatement.list, {
      pathParams: { patientId },
    }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("ongoing_medications")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>{t("ongoing_medications")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("no_ongoing_medications")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-4 py-0 pt-4">
        <CardTitle>
          {t("ongoing_medications")} ({filteredMedications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("medication")}</TableHead>
              <TableHead>{t("dosage")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("medication_taken_between")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead>{t("note")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedications.map((statement, index) => {
              const isEnteredInError = statement.status === "entered_in_error";

              return (
                <>
                  <MedicationRow
                    key={statement.id}
                    statement={statement}
                    isEnteredInError={isEnteredInError}
                    index={index}
                  />
                </>
              );
            })}
          </TableBody>
        </Table>
        {hasEnteredInErrorRecords && !showEnteredInError && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowEnteredInError(true)}
              className="text-xs underline text-gray-500"
            >
              {t("view_all")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
