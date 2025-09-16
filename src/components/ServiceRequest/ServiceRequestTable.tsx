import { useQueryClient } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
}

export default function ServiceRequestTable({
  requests,
  facilityId,
  locationId,
  showPatientInfo = true,
}: ServiceRequestTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleViewDetails = (request: ServiceRequestReadSpec) => {
    const baseUrl = locationId
      ? `/facility/${facilityId}/locations/${locationId}/service_requests`
      : `/facility/${facilityId}/services_requests`;
    navigate(`${baseUrl}/${request.id}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            {showPatientInfo && <TableHead>{t("patient_name")}</TableHead>}
            <TableHead>{t("service_type")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("priority")}</TableHead>
            <TableHead>{t("tags", { count: 2 })}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {requests.map((request) => (
            <TableRow key={request.id} className="divide-x divide-gray-200">
              {showPatientInfo && (
                <TableCell className="font-medium">
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
                  <div className="text-lg">{request.title || "-"}</div>
                  {request.code?.display && (
                    <div className="text-xs text-gray-500">
                      {request.code.display}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
                  {t(request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
                >
                  {t(request.priority)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {request.tags && request.tags.length > 0 && (
                    <>
                      {request.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag.display}
                        </Badge>
                      ))}
                      <TagAssignmentSheet
                        entityType="service_request"
                        entityId={request.id}
                        facilityId={facilityId}
                        currentTags={request.tags}
                        onUpdate={() => {
                          queryClient.invalidateQueries({
                            queryKey: [
                              "serviceRequests",
                              facilityId,
                              locationId,
                            ],
                          });
                        }}
                        patientId={request.encounter.patient.id}
                        trigger={
                          <Button variant="outline" size="xs">
                            <Hash className="size-3" /> {t("tags")}
                          </Button>
                        }
                      />
                    </>
                  )}
                  {(!request.tags || request.tags.length === 0) && (
                    <TagAssignmentSheet
                      entityType="service_request"
                      entityId={request.id}
                      facilityId={facilityId}
                      currentTags={[]}
                      onUpdate={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["serviceRequests", facilityId, locationId],
                        });
                      }}
                      patientId={request.encounter.patient.id}
                      trigger={
                        <Button variant="outline" size="xs">
                          <Hash className="size-3" /> {t("add_tags")}
                        </Button>
                      }
                    />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-left">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(request)}
                >
                  <CareIcon icon="l-edit" />
                  {t("see_details")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
