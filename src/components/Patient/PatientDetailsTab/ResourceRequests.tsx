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

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import {
  getResourceRequestCategoryEnum,
  RESOURCE_REQUEST_STATUS_COLORS,
} from "@/types/resourceRequest/resourceRequest";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
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

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">
          {t("resource_requests")}
        </h2>
        {facilityId && (
          <Button
            variant="outline_primary"
            asChild
            data-cy="create-request-button"
          >
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
        {loading ? (
          <TableSkeleton count={5} />
        ) : (
          <Table data-cy="resource-requests-table">
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
              {resourceRequests?.results?.length ? (
                resourceRequests.results.map((request, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {t(
                        `resource_request_category__${getResourceRequestCategoryEnum(request.category)}`,
                      )}
                    </TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          RESOURCE_REQUEST_STATUS_COLORS[
                            request.status as keyof typeof RESOURCE_REQUEST_STATUS_COLORS
                          ]
                        }
                      >
                        {t(`resource_status__${request.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(request.created_date)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(request.modified_date)}
                    </TableCell>
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
        )}
      </div>
    </div>
  );
};
