import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "raviger";

import { Badge } from "@/components/ui/badge";
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
import { PaginatedResponse } from "@/Utils/request/types";
import { Encounter } from "@/types/emr/encounter";

interface EncounterListProps {
  encounters?: Encounter[];
  facilityId?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "planned":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "stat":
      return "bg-red-100 text-red-800";
    case "urgent":
      return "bg-orange-100 text-orange-800";
    case "asap":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function EncounterList({
  encounters: propEncounters,
  facilityId,
}: EncounterListProps) {
  const { data: queryEncounters, isLoading } = useQuery<
    PaginatedResponse<Encounter>
  >({
    queryKey: ["encounters", facilityId],
    queryFn: query(routes.encounter.list, {
      pathParams: { facilityId: facilityId || "" },
    }),
    enabled: !propEncounters && !!facilityId, // Only fetch if encounters not provided as prop and facilityId exists
  });

  const encounters = propEncounters || queryEncounters?.results || [];

  if (isLoading) {
    return <div>Loading encounters...</div>;
  }

  if (!encounters.length) {
    return <div>No encounters found</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Start Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {encounters.map((encounter: Encounter) => (
            <TableRow key={encounter.id}>
              <TableCell>
                <Link
                  href={`/patient/${encounter.patient}`}
                  className="hover:text-primary"
                >
                  {encounter.patient.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(encounter.status)}>
                  {encounter.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(encounter.priority)}>
                  {encounter.priority}
                </Badge>
              </TableCell>
              <TableCell>{encounter.encounter_class}</TableCell>
              <TableCell>
                {encounter.period.start &&
                  format(new Date(encounter.period.start), "PPp")}
              </TableCell>
              <TableCell>
                <Link
                  href={`/facility/${facilityId}/encounter/${encounter.id}/updates`}
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
