import { t } from "i18next";

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

import {
  SYMPTOM_CLINICAL_STATUS_STYLES,
  SYMPTOM_SEVERITY_STYLES,
  SYMPTOM_VERIFICATION_STATUS_STYLES,
  Symptom,
} from "@/types/emr/symptom/symptom";

interface SymptomTableProps {
  symptoms: Symptom[];
}

export function SymptomTable({ symptoms }: SymptomTableProps) {
  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="first:rounded-l-md h-auto  py-1 px-2  text-gray-600">
            {t("symptom")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("severity")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("status")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("verification")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("onset")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("notes")}
          </TableHead>
          <TableHead className="last:rounded-r-md h-auto py-1 px-2 text-gray-600">
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
            <TableCell className="font-medium first:rounded-l-md">
              {symptom.code.display}
            </TableCell>
            <TableCell>
              {symptom.severity ? (
                <Badge
                  variant="outline"
                  className={`whitespace-nowrap ${
                    SYMPTOM_SEVERITY_STYLES[symptom.severity]
                  }`}
                >
                  {t(symptom.severity)}
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`whitespace-nowrap ${
                  SYMPTOM_CLINICAL_STATUS_STYLES[symptom.clinical_status]
                }`}
              >
                {t(symptom.clinical_status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`whitespace-nowrap capitalize ${
                  SYMPTOM_VERIFICATION_STATUS_STYLES[
                    symptom.verification_status
                  ]
                }`}
              >
                {t(symptom.verification_status)}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {symptom.onset?.onset_datetime
                ? new Date(symptom.onset.onset_datetime).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell className="max-w-[200px]">
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
