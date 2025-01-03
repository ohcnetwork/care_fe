import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import CommentSection from "@/components/Resource/ResourceCommentSection";

import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime, formatName } from "@/Utils/utils";
import { PatientModel } from "@/types/emr/patient";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

import { FacilityModel } from "../Facility/models";

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
            <p className="text-sm text-muted-foreground">{patient.name}</p>
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
              <p className="text-sm text-muted-foreground">--</p>
            )}
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm font-medium">{t("address")}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
            <p className="text-sm text-muted-foreground">
              {facilityData?.name || "--"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const RequestLetter = (data: ResourceRequest) => {
  const { t } = useTranslation();
  return (
    <div id="section-to-print" className="print bg-white">
      <div className="mx-4 p-4 lg:mx-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold">{t("request_letter")}</div>
          <div className="mt-2 text-sm text-gray-600">
            {t("reference_no")}: {data.id}
          </div>
        </div>

        {/* Date */}
        <div className="mb-6 text-right">
          <div className="font-semibold">
            {t("date")}: {formatDateTime(data.created_date)}
          </div>
        </div>

        {/* From Address */}
        <div className="mb-6">
          <div className="font-semibold">{t("from")}:</div>
          <div className="mt-1">{data.origin_facility.name}</div>
        </div>

        {/* Subject Line */}
        <div className="mb-6">
          <div className="font-semibold">
            {t("subject")}: {t("request_for")} {data.title}
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6 leading-relaxed">
          <p className="mb-4">
            {t("request_the_following_resource")}
            {data.emergency ? t("on_emergency_basis") : ""}:
          </p>

          <div className="mb-4 ml-4">
            <div>
              <span className="font-semibold">{t("request_title")}:</span>{" "}
              {data.title}
            </div>
            <div>
              <span className="font-semibold">{t("category")}:</span>{" "}
              {RESOURCE_CATEGORY_CHOICES.find(
                (item) => item.id === data.category,
              )?.text || "--"}
            </div>
            <div>
              <span className="font-semibold">{t("quantity_required")}:</span>{" "}
              {data.requested_quantity}
            </div>
            <div className="mt-2">
              <span className="font-semibold">{t("reason_for_request")}:</span>
              <p className="mt-1">{data.reason || "--"}</p>
            </div>
          </div>

          {/* Status Section */}
          <div className="mb-4">
            <span className="font-semibold">{t("current_status")}: </span>
            <span className="rounded bg-gray-100 px-2 py-1">{data.status}</span>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 flex justify-between">
          <div>
            <div className="mb-20">
              <div className="font-semibold">{t("requested_by")}:</div>
              <div>{formatName(data.created_by)}</div>
              <div className="text-sm text-gray-600">
                {formatDateTime(data.created_date)}
              </div>
            </div>
          </div>

          {data.status !== "PENDING" && (
            <div>
              <div className="mb-20">
                <div className="font-semibold">
                  {data.status === "REJECTED" ? t("rejected") : t("approved")}
                  {t("by")}:
                </div>
                <div>{formatName(data.updated_by)}</div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(data.modified_date)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ResourceDetails(props: { id: string }) {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const { t } = useTranslation();
  const { data, loading } = useTanStackQueryInstead(routes.getResourceDetails, {
    pathParams: { id: props.id },
    onResponse: ({ res, data }) => {
      if (!res && !data) {
        navigate("/not-found");
      }
    },
  });

  if (loading || !data) {
    return <Loading />;
  }

  return (
    <Page
      title="Request Details"
      crumbsReplacements={{ [props.id]: { name: data.title } }}
      backUrl="/resource/board"
    >
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={() => setIsPrintMode(true)}>
              <CareIcon icon="l-file-alt" className="mr-2 h-4 w-4" />
              {t("request_letter")}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/resource/${data.id}/update`)}
            >
              <CareIcon icon="l-edit" className="mr-2 h-4 w-4" />
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
                <Badge>{data.status}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("category")}</p>
                <p className="text-sm text-muted-foreground">
                  {RESOURCE_CATEGORY_CHOICES.find(
                    (item) => item.id === data.category,
                  )?.text || "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("contact_person")}</p>
                <p className="text-sm text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">--</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("reason")}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
                  <p className="text-sm text-muted-foreground">
                    {formatName(data.created_by)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(data.created_date)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("last_modified_by")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatName(data.updated_by)}
                </p>
                <p className="text-xs text-muted-foreground">
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
            <CommentSection id={props.id} />
          </CardContent>
        </Card>
      </div>

      {/* Print Mode */}
      {isPrintMode && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="mx-auto max-w-4xl p-4">
            <div className="mb-4 flex justify-end gap-2">
              <Button onClick={() => window.print()}>
                <CareIcon icon="l-print" className="mr-2 h-4 w-4" />
                {t("print")}
              </Button>
              <Button variant="outline" onClick={() => setIsPrintMode(false)}>
                <CareIcon icon="l-times" className="mr-2 h-4 w-4" />
                {t("close")}
              </Button>
            </div>
            {RequestLetter(data)}
          </div>
        </div>
      )}
    </Page>
  );
}
