import { useQuery } from "@tanstack/react-query";

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
import { Diagnosis } from "@/types/questionnaire/diagnosis";

import { Avatar } from "../../Common/Avatar";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
}

export function DiagnosisList({ patientId, encounterId }: DiagnosisListProps) {
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query(routes.getDiagnosis, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!diagnoses?.results?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No diagnoses recorded</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeStyle = (status: string) => {
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

  return (
    <Card className="p-0">
      <CardHeader className="px-4 py-0 pt-4">
        <CardTitle>Diagnoses</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Onset Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnoses.results.map((diagnosis: Diagnosis) => (
              <TableRow key={diagnosis.code.code}>
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
                    ? new Date(
                        diagnosis.onset.onset_datetime,
                      ).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {diagnosis.note || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap flex items-center gap-2">
                  <Avatar
                    name={`${diagnosis.created_by.first_name} ${diagnosis.created_by.last_name}`}
                    className="w-4 h-4"
                    imageUrl={diagnosis.created_by.profile_picture_url}
                  />
                  <span className="text-sm">
                    {diagnosis.created_by.first_name}{" "}
                    {diagnosis.created_by.last_name}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
