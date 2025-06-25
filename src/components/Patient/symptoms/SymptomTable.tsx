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
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";

import {
  SYMPTOM_CLINICAL_STATUS_COLORS,
  SYMPTOM_SEVERITY_COLORS,
  SYMPTOM_VERIFICATION_STATUS_COLORS,
  Symptom,
} from "@/types/emr/symptom/symptom";

interface SymptomTableProps {
  symptoms: Symptom[];
}

export function SymptomTable({ symptoms }: SymptomTableProps) {
  const { t } = useTranslation();

  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="first:rounded-l-md h-auto  py-1 px-2  text-gray-600">
            {t("symptom")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("severity")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("status")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("verification")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("onset")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600 text-center">
            {t("notes")}
          </TableHead>
          <TableHead className="last:rounded-r-md h-auto py-1 px-2 text-gray-600 text-center">
            {t("logged_by")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {symptoms.map((symptom) => (
          <TableRow
            key={symptom.id}
            className={`rounded-md overflow-hidden bg-gray-50 ${
              symptom.verification_status === "entered_in_error"
                ? "opacity-50"
                : ""
            }`}
          >
            <TableCell className="font-medium first:rounded-l-md md:whitespace-normal">
              {symptom.code.display}
            </TableCell>
            <TableCell>
              {symptom.severity ? (
                <Badge variant={SYMPTOM_SEVERITY_COLORS[symptom.severity]}>
                  {t(symptom.severity)}
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  SYMPTOM_CLINICAL_STATUS_COLORS[symptom.clinical_status]
                }
                className="whitespace-nowrap"
              >
                {t(symptom.clinical_status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  SYMPTOM_VERIFICATION_STATUS_COLORS[
                    symptom.verification_status
                  ]
                }
                className="whitespace-nowrap capitalize"
              >
                {t(symptom.verification_status)}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap text-center">
              {symptom.onset?.onset_datetime ? (
                <RelativeDateTooltip date={symptom.onset.onset_datetime} />
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="max-w-[200px] text-center">
              {symptom.note ? (
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
                        {symptom.note}
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
                  name={symptom.created_by.username}
                  className="size-4"
                  imageUrl={symptom.created_by.profile_picture_url}
                />

                <span className="text-sm">{symptom.created_by.username}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
