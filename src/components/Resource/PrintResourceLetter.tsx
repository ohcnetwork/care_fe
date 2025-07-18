import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";

import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

export default function PrintResourceLetter({ id }: { id: string }) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["resource_request_letter", id],
    queryFn: query(routes.getResourceDetails, {
      pathParams: { id: id },
    }),
  });

  if (isLoading || !data) {
    return <Loading />;
  }
  return (
    <PrintPreview title={t("request_letter")}>
      <div className="min-h-screen bg-white">
        <div className="mx-4">
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
                <span className="font-semibold">
                  {t("reason_for_request")}:
                </span>
                <p className="mt-1">{data.reason || "--"}</p>
              </div>
            </div>

            {/* Status Section */}
            <div className="mb-4">
              <span className="font-semibold">{t("current_status")}: </span>
              <span className="rounded bg-gray-100 px-2 py-1">
                {t(`resource_status__${data.status}`)}
              </span>
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

            {["approved", "rejected"].includes(data.status) && (
              <div>
                <div className="mb-20">
                  <div className="font-semibold">
                    {t(`resource_status__${data.status}`)} {t("by")}:
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
    </PrintPreview>
  );
}
