import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
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

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

interface MedicationStatementListProps {
  patientId: string;
}

export function MedicationStatementList({
  patientId,
}: MedicationStatementListProps) {
  const { t } = useTranslation();

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medication_statement", patientId],
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

  if (!medications?.results?.length) {
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

  const getStatusBadgeStyle = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "on_hold":
        return "bg-gray-100 text-gray-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="p-0">
      <CardHeader className="px-4 py-0 pt-4">
        <CardTitle>
          {t("ongoing_medications")} ({medications.count})
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
            {medications.results.map((statement) => (
              <TableRow>
                <TableCell className="font-medium">
                  {statement.medication.display ?? statement.medication.code}
                </TableCell>
                <TableCell>{statement.dosage_text}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap",
                      getStatusBadgeStyle(statement.status),
                    )}
                  >
                    {statement.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {[
                    statement.effective_period?.start,
                    statement.effective_period?.end,
                  ].join(" - ")}
                </TableCell>
                <TableCell>{statement.reason}</TableCell>
                <TableCell>{statement.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
