import { t } from "i18next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import { formatName } from "@/Utils/utils";
import { Symptom } from "@/types/emr/symptom/symptom";

export const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "resolved":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "recurrence":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface SymptomTableProps {
  symptoms: Symptom[];
  showHeader?: boolean;
}

export function SymptomTable({
  symptoms,
  showHeader = true,
}: SymptomTableProps) {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow>
            <TableHead>{t("symptom")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("severity")}</TableHead>
            <TableHead>{t("onset")}</TableHead>
            <TableHead>{t("verification")}</TableHead>
            <TableHead>{t("notes")}</TableHead>
            <TableHead>{t("created_by")}</TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {symptoms.map((symptom: Symptom, index: number) => {
          const isEnteredInError =
            symptom.verification_status === "entered_in_error";

          return (
            <>
              <TableRow
                key={index}
                className={
                  isEnteredInError ? "opacity-50 bg-gray-50/50" : undefined
                }
              >
                <TableCell className="font-medium">
                  {symptom.code.display}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${getStatusBadgeStyle(symptom.clinical_status)}`}
                  >
                    {t(symptom.clinical_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={"secondary"} className="whitespace-nowrap">
                    {t(symptom.severity)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {symptom.onset?.onset_datetime
                    ? new Date(
                        symptom.onset.onset_datetime,
                      ).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isEnteredInError ? "destructive" : "outline"}
                    className="whitespace-nowrap capitalize"
                  >
                    {t(symptom.verification_status)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {symptom.note || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap flex items-center gap-2">
                  <Avatar
                    name={formatName(symptom.created_by)}
                    className="w-4 h-4"
                    imageUrl={symptom.created_by?.profile_picture_url}
                  />
                  <span className="text-sm">
                    {formatName(symptom.created_by)}
                  </span>
                </TableCell>
              </TableRow>
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
