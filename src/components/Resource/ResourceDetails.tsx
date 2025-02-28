import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FacilityModel } from "@/components/Facility/models";
import CommentSection from "@/components/Resource/ResourceCommentSection";

import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { PatientModel } from "@/types/emr/patient";

function PatientCard({ patient }: { patient: PatientModel }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CareIcon icon="l-user" className="text-lg text-blue-700" />
          <CardTitle className="text-lg">
            {t("linked_patient_details")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("name")}</p>
            <p className="text-sm text-gray-500">{patient.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">{t("phone")}</p>
            {patient.phone_number ? (
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${patient.phone_number}`}
                  className="text-sm text-primary hover:underline"
                >
                  {patient.phone_number}
                </a>
                <a
                  href={`https://wa.me/${patient.phone_number?.replace(/\D+/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-sky-600 hover:text-sky-700"
                >
                  <CareIcon icon="l-whatsapp" className="text-lg" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">--</p>
            )}
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm font-medium">{t("address")}</p>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">
              {[patient.address].filter(Boolean).join(", ") || "--"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FacilityCard({
  title,
  facilityData,
}: {
  title: string;
  facilityData: FacilityModel;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("name")}</p>
            <p className="text-sm text-gray-500">
              {facilityData?.name || "--"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResourceDetails({
  id,
  facilityId,
}: {
  id: string;
  facilityId: string;
}) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["resource_request", id],
    queryFn: query(routes.getResourceDetails, {
      pathParams: { id },
    }),
  });

  if (isLoading || !data) {
    return <Loading />;
  }

  return (
    <Page title={t("request_details")}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              onClick={() =>
                navigate(`/facility/${facilityId}/resource/${id}/print`)
              }
              className="w-full sm:w-auto"
            >
              <CareIcon icon="l-file-alt" className="mr-2 h-4 w-4" />
              {t("request_letter")}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                navigate(`/facility/${facilityId}/resource/${id}/update`)
              }
            >
              <CareIcon icon="l-pen" className="mr-2 h-4 w-4" />
              {t("update_status")}
            </Button>
          </div>
        </div>

        {/* Main Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{data.title}</CardTitle>
              <Badge variant={data.emergency ? "destructive" : "secondary"}>
                {data.emergency ? t("emergency") : t("REGULAR")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("status")}</p>
                <Badge>
                  {t(`resource_status__${data.status.toLowerCase()}`)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("category")}</p>
                <p className="text-sm text-gray-500">
                  {RESOURCE_CATEGORY_CHOICES.find(
                    (item) => item.id === data.category,
                  )?.text || "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("contact_person")}</p>
                <p className="text-sm text-gray-500">
                  {data.referring_facility_contact_name || "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("contact_number")}</p>
                {data.referring_facility_contact_number ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${data.referring_facility_contact_number}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {data.referring_facility_contact_number}
                    </a>
                    <a
                      href={`https://wa.me/${data.referring_facility_contact_number?.replace(/\D+/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:text-sky-700"
                    >
                      <CareIcon icon="l-whatsapp" className="text-lg" />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">--</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("reason")}</p>
              <p className="text-sm text-gray-500 whitespace-pre-wrap">
                {data.reason || "--"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        {data.related_patient && <PatientCard patient={data.related_patient} />}

        {/* Facilities */}
        <div className="grid gap-6 md:grid-cols-2">
          <FacilityCard
            title={t("origin_facility")}
            facilityData={data.origin_facility}
          />
          {data.assigned_facility && (
            <FacilityCard
              title={t("assigned_facility")}
              facilityData={data.assigned_facility}
            />
          )}
        </div>

        {/* Audit Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("audit_information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {data.created_by && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("created_by")}</p>
                  <p className="text-sm text-gray-500">
                    {formatName(data.created_by)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(data.created_date)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("last_modified_by")}</p>
                <p className="text-sm text-gray-500">
                  {formatName(data.updated_by)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(data.modified_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("comments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CommentSection id={id} />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
