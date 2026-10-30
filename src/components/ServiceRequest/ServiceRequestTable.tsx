import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { TagBadges } from "@/components/Tags/TagBadges";

import { LocationNode } from "@/components/Location/LocationTree";
import { cn } from "@/lib/utils";
import {
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";

interface ServiceRequestTableProps {
  requests: ServiceRequestReadSpec[];
  facilityId: string;
  locationId?: string;
  showPatientInfo?: boolean;
  readOnly?: boolean;
  onPatientClick?: (request: ServiceRequestReadSpec) => void;
}

export default function ServiceRequestTable({
  requests,
  facilityId,
  locationId,
  showPatientInfo = true,
  readOnly = false,
  onPatientClick,
}: ServiceRequestTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleViewDetails = (request: ServiceRequestReadSpec) => {
    const baseUrl = locationId
      ? `/facility/${facilityId}/locations/${locationId}/service_requests`
      : `/facility/${facilityId}/service_requests`;
    navigate(`${baseUrl}/${request.id}`);
  };

  return (
    <div className="min-w-0">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            {showPatientInfo && <TableHead>{t("patient_name")}</TableHead>}
            <TableHead>{t("service_type")}</TableHead>
            <TableHead>
              {t("status")}/{t("priority")}
            </TableHead>
            <TableHead>{t("tags", { count: 2 })}</TableHead>
            <TableHead>{t("location")}</TableHead>
            {!readOnly && (
              <TableHead className="w-px whitespace-nowrap">
                {t("actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className="divide-x divide-gray-200 group"
            >
              {showPatientInfo && (
                <TableCell
                  className={cn("font-medium", onPatientClick)}
                  onClick={() => onPatientClick?.(request)}
                >
                  <div className="font-semibold text-gray-900">
                    {request.encounter.patient.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.encounter.patient.id}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div>
                  <div>{request.title || "-"}</div>
                  {request.code?.display && (
                    <div className="text-xs text-gray-500">
                      {request.code.display}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Badge
                    variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}
                  >
                    {t(request.status)}
                  </Badge>
                  <Badge
                    variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
                  >
                    {t(request.priority)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {readOnly ? (
                  <TagBadges tags={request.tags ?? []} />
                ) : (
                  <TagAssignmentSheet
                    entityType="service_request"
                    entityId={request.id}
                    facilityId={facilityId}
                    currentTags={request.tags ?? []}
                    onUpdate={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["serviceRequests", facilityId],
                      });
                    }}
                    patientId={request.encounter.patient.id}
                  />
                )}
              </TableCell>
              <TableCell>
                <div className="text-xs text-gray-500">
                  {request.encounter.current_location && (
                    <LocationNode
                      location={request.encounter.current_location}
                      isLast={true}
                    />
                  )}
                </div>
              </TableCell>
              {!readOnly && (
                <TableCell className="w-px text-left whitespace-nowrap">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => handleViewDetails(request)}
                  >
                    {t("see_details")}
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
