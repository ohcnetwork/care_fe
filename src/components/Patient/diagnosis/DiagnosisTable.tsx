import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";

import {
  DIAGNOSIS_CLINICAL_STATUS_COLORS,
  DIAGNOSIS_VERIFICATION_STATUS_COLORS,
  Diagnosis,
} from "@/types/emr/diagnosis/diagnosis";

interface DiagnosisTableProps {
  diagnoses: Diagnosis[];
  title?: string;
}

export function DiagnosisTable({ diagnoses, title }: DiagnosisTableProps) {
  const { t } = useTranslation();

  title = title ?? t("diagnosis");

  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="first:rounded-l-md h-auto  py-1 px-2  text-gray-600">
            {title}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("status")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2 text-gray-600 text-center">
            {t("verification")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("onset")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("notes")}
          </TableHead>
          <TableHead className="last:rounded-r-md h-auto  py-1 px-2 text-gray-600 text-center">
            {t("logged_by")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diagnoses.map((diagnosis) => (
          <TableRow
            key={diagnosis.id}
            className={cn(
              "rounded-md overflow-hidden",
              diagnosis.verification_status === "entered_in_error"
                ? "opacity-50"
                : "bg-gray-50",
            )}
          >
            <TableCell className="font-medium first:rounded-l-md">
              <div className="flex items-center gap-2 md:whitespace-normal">
                {diagnosis.code.display}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant={
                  DIAGNOSIS_CLINICAL_STATUS_COLORS[diagnosis.clinical_status]
                }
                className="whitespace-nowrap"
              >
                {t(diagnosis.clinical_status)}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant={
                  DIAGNOSIS_VERIFICATION_STATUS_COLORS[
                    diagnosis.verification_status
                  ]
                }
                className="whitespace-nowrap capitalize"
              >
                {t(diagnosis.verification_status)}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap text-center">
              {diagnosis.onset?.onset_datetime ? (
                <RelativeDateTooltip date={diagnosis.onset.onset_datetime} />
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="max-w-[200px] text-center">
              {diagnosis.note ? (
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
                        {diagnosis.note}
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="last:rounded-r-md text-center">
              <div className="flex items-center gap-2">
                <Avatar
                  name={diagnosis.created_by.username}
                  className="size-4"
                  imageUrl={diagnosis.created_by.profile_picture_url}
                />

                <span className="text-sm">{diagnosis.created_by.username}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
