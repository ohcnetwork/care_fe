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
  DIAGNOSIS_CLINICAL_STATUS_STYLES,
  DIAGNOSIS_VERIFICATION_STATUS_STYLES,
  Diagnosis,
} from "@/types/emr/diagnosis/diagnosis";

interface DiagnosisTableProps {
  diagnoses: Diagnosis[];
}

export function DiagnosisTable({ diagnoses }: DiagnosisTableProps) {
  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="first:rounded-l-md h-auto  py-1 px-2  text-gray-600">
            {t("diagnosis")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("status")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2 text-gray-600">
            {t("verification")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("onset")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("notes")}
          </TableHead>
          <TableHead className="last:rounded-r-md h-auto  py-1 px-2 text-gray-600">
            {t("logged_by")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diagnoses.map((diagnosis) => {
          const note = diagnosis.note || "";
          const MAX_NOTE_LENGTH = 15;
          const isLongNote = note.length > MAX_NOTE_LENGTH;
          const displayNote = isLongNote
            ? `${note.slice(0, MAX_NOTE_LENGTH)}..`
            : note;

          return (
            <TableRow
              key={diagnosis.id}
              className={`rounded-md overflow-hidden bg-gray-50 ${
                diagnosis.verification_status === "entered_in_error"
                  ? "opacity-50"
                  : ""
              }`}
            >
              <TableCell className="font-medium first:rounded-l-md">
                {diagnosis.code.display}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`whitespace-nowrap ${
                    DIAGNOSIS_CLINICAL_STATUS_STYLES[diagnosis.clinical_status]
                  }`}
                >
                  {t(diagnosis.clinical_status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`whitespace-nowrap capitalize ${
                    DIAGNOSIS_VERIFICATION_STATUS_STYLES[
                      diagnosis.verification_status
                    ]
                  }`}
                >
                  {t(diagnosis.verification_status)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {diagnosis.onset?.onset_datetime
                  ? new Date(
                      diagnosis.onset.onset_datetime,
                    ).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell className="max-w-[200px]">
                {note ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-950 truncate">
                      {displayNote}
                    </span>
                    {isLongNote && (
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
                            {note}
                          </p>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="last:rounded-r-md">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={diagnosis.created_by.username}
                    className="w-4 h-4"
                    imageUrl={diagnosis.created_by.profile_picture_url}
                  />
                  <span className="text-sm">
                    {diagnosis.created_by.username}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
