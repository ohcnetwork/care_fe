import { useQuery } from "@tanstack/react-query";
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

import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

import { PatientProps } from ".";

export const ResourceRequests = (props: PatientProps) => {
  const { patientData, facilityId, id } = props;
  const { t } = useTranslation();

  const { data: resourceRequests, isLoading: loading } = useQuery({
    queryKey: ["resourceRequests", id],
    queryFn: query(routes.listResourceRequests, {
      queryParams: {
        related_patient: id,
      },
    }),
    enabled: !!id,
  });

  const getStatusBadge = (status: ResourceRequest["status"]) => {
    const statusColors: Record<ResourceRequest["status"], string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">
          {t("resource_requests")}
        </h2>
        <Button
          variant="outline_primary"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/resource/new?related_patient=${patientData.id}`,
            )
          }
        >
          <CareIcon icon="l-plus" className="mr-2" />
          {t("create_resource_request")}
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("resource_type")}</TableHead>
              <TableHead className="capitalize">{t("title")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("created_on")}</TableHead>
              <TableHead>{t("modified_on")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : resourceRequests?.results?.length ? (
              resourceRequests.results.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {RESOURCE_CATEGORY_CHOICES.find(
                      (item) => item.id === request.category,
                    )?.text || "--"}
                  </TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{formatDateTime(request.created_date)}</TableCell>
                  <TableCell>{formatDateTime(request.modified_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/resource/${request.id}`)}
                    >
                      <CareIcon icon="l-eye" className="mr-2" />
                      {t("view")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {t("no_resource_requests_found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
