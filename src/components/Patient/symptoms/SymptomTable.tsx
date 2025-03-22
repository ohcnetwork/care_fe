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
    <div>
      <div className="md:hidden">
        {symptoms.map((symptom) => (
          <div
            key={symptom.id}
            className={`bg-white rounded-lg p-4 mb-4 border-t ${
              symptom.verification_status === "entered_in_error"
                ? "opacity-50"
                : ""
            }`}
          >
            <div className="space-y-3">
              <div className="flex">
                <span className="text-gray-500 w-32">Symptom:</span>
                <span className="font-medium text-right flex-1">
                  {symptom.code.display}
                </span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-32">Severity:</span>
                <div className="flex justify-end flex-1">
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
                </div>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-32">Status:</span>
                <div className="flex justify-end flex-1">
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${
                      SYMPTOM_CLINICAL_STATUS_STYLES[symptom.clinical_status]
                    }`}
                  >
                    {t(symptom.clinical_status)}
                  </Badge>
                </div>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-32">Verification:</span>
                <div className="flex justify-end flex-1">
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
                </div>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-32">Onset:</span>
                <span className="text-right flex-1">
                  {symptom.onset?.onset_datetime
                    ? new Date(
                        symptom.onset.onset_datetime,
                      ).toLocaleDateString()
                    : "-"}
                </span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-32">Notes:</span>
                <span className="text-right flex-1">
                  {symptom.note ? (
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
                  ) : (
                    "-"
                  )}
                </span>
              </div>

              <div className="flex">
                <span className="text-gray-500 w-32">Logged by:</span>
                <div className="flex items-center justify-end gap-2 flex-1">
                  <Avatar
                    name={symptom.created_by.username}
                    className="w-5 h-5"
                    imageUrl={symptom.created_by.profile_picture_url}
                  />
                  <span>{symptom.created_by.username}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Table className="border-separate border-spacing-y-0.5 hidden md:table">
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
                    className="w-4 h-4"
                    imageUrl={symptom.created_by.profile_picture_url}
                  />

                  <span className="text-sm">{symptom.created_by.username}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
