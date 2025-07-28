import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import { formatDateTime, formatName } from "@/Utils/utils";
import {
  MEDICATION_STATEMENT_STATUS_STYLES,
  MedicationStatementRead,
} from "@/types/emr/medicationStatement";

export const MedicationStatementTable = ({
  statements,
}: {
  statements: MedicationStatementRead[];
}) => {
  const { t } = useTranslation();
  return (
    <Table className="border-separate border-gray-200 border-spacing-y-0.5">
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
        {statements.map((statement) => (
          <TableRow
            key={statement.id}
            className={`rounded-md overflow-hidden bg-gray-50 ${
              statement.status === "entered_in_error" ? "opacity-50" : ""
            }`}
          >
            <TableCell className="font-medium first:rounded-l-md">
              {statement.medication.display ?? statement.medication.code}
            </TableCell>
            <TableCell>{statement.dosage_text}</TableCell>
            <TableCell>
              <Badge
                variant={MEDICATION_STATEMENT_STATUS_STYLES[statement.status]}
                className="whitespace-nowrap capitalize"
              >
                {t(`medication_status__${statement.status}`)}
              </Badge>
            </TableCell>
            <TableCell>
              {[
                statement.effective_period?.start,
                statement.effective_period?.end,
              ]
                .map((date, ind) =>
                  date ? formatDateTime(date) : ind === 1 ? t("ongoing") : "",
                )
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
                  name={formatName(statement.created_by, true)}
                  className="size-4"
                  imageUrl={statement.created_by.profile_picture_url}
                />
                <span className="text-sm">
                  {formatName(statement.created_by)}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
