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
import { Symptom } from "@/types/questionnaire/symptom";

import { Avatar } from "../../Common/Avatar";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
}

export function SymptomsList({ patientId, encounterId }: SymptomsListProps) {
  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(routes.getSymptom, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!symptoms?.results?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No symptoms recorded</p>
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
        <CardTitle>Symptoms</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symptom</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Onset Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {symptoms.results.map((symptom: Symptom) => (
              <TableRow key={symptom.code.code}>
                <TableCell className="font-medium">
                  {symptom.code.display}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${getStatusBadgeStyle(symptom.clinical_status)}`}
                  >
                    {symptom.clinical_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {symptom.severity}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {symptom.onset?.onset_datetime
                    ? new Date(
                        symptom.onset.onset_datetime,
                      ).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {symptom.note || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap flex items-center gap-2">
                  <Avatar
                    name={`${symptom.created_by?.first_name} ${symptom.created_by?.last_name}`}
                    className="w-4 h-4"
                    imageUrl={symptom.created_by?.profile_picture_url}
                  />
                  <span className="text-sm">
                    {symptom.created_by?.first_name}{" "}
                    {symptom.created_by?.last_name}
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
