import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
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
  const { patientData, facilityId } = props;
  const patientId = patientData.id;
  const { t } = useTranslation();

  const { data: resourceRequests, isLoading: loading } = useQuery({
    queryKey: ["resourceRequests", patientId],
    queryFn: query(routes.listResourceRequests, {
      queryParams: {
        related_patient: patientId,
      },
    }),
    enabled: !!patientId,
  });

  const getStatusBadge = (status: ResourceRequest["status"]) => {
    const statusColors: Record<ResourceRequest["status"], string> = {
      PENDING:
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900",
      APPROVED:
        "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
      REJECTED: "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
      COMPLETED:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
      DEFAULT:
        "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
    };

    return (
      <Badge className={statusColors[status] || statusColors.DEFAULT}>
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
        {facilityId && (
          <Button variant="outline_primary" asChild>
            <Link
              href={`/facility/${facilityId}/resource/new?related_patient=${patientData.id}`}
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("create_resource_request")}
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
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
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/facility/${request.origin_facility.id}/resource/${request.id}`}
                      >
                        <CareIcon icon="l-eye" className="mr-2" />
                        {t("view")}
                      </Link>
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
