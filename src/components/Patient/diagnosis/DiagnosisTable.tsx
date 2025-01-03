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

import { Diagnosis } from "@/types/emr/diagnosis/diagnosis";

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

interface DiagnosisTableProps {
  diagnoses: Diagnosis[];
  showHeader?: boolean;
}

export function DiagnosisTable({
  diagnoses,
  showHeader = true,
}: DiagnosisTableProps) {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow>
            <TableHead>Diagnosis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Onset</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {diagnoses.map((diagnosis: Diagnosis) => (
          <TableRow>
            <TableCell className="font-medium">
              {diagnosis.code.display}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`whitespace-nowrap ${getStatusBadgeStyle(diagnosis.clinical_status)}`}
              >
                {diagnosis.clinical_status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="whitespace-nowrap">
                {diagnosis.verification_status}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {diagnosis.onset?.onset_datetime
                ? new Date(diagnosis.onset.onset_datetime).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {diagnosis.note || "-"}
            </TableCell>
            <TableCell className="whitespace-nowrap flex items-center gap-2">
              <Avatar
                name={`${diagnosis.created_by?.first_name} ${diagnosis.created_by?.last_name}`}
                className="w-4 h-4"
                imageUrl={diagnosis.created_by?.profile_picture_url}
              />
              <span className="text-sm">
                {diagnosis.created_by?.first_name}{" "}
                {diagnosis.created_by?.last_name}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
