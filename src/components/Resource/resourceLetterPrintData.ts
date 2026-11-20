import type { TFunction } from "i18next";

import type { ResourceRequestRead } from "@/types/resourceRequest/resourceRequest";
import { getResourceRequestCategoryEnum } from "@/types/resourceRequest/resourceRequest";
import { formatDateTime, formatName } from "@/Utils/utils";

export interface ResourceLetterPrintContent {
  title: string;
  reference: string;
  date: string;
  from: { label: string; value: string };
  subject: string;
  intro: string;
  fields: { label: string; value: string }[];
  reason: { label: string; value: string };
  status: { label: string; value: string };
  signatures: { label: string; name: string; date: string }[];
}

export function buildResourceLetterPrintContent({
  request,
  t,
}: {
  request: ResourceRequestRead;
  t: TFunction;
}): ResourceLetterPrintContent {
  const status = t(`resource_request_status__${request.status}`);

  return {
    title: t("request_letter"),
    reference: `${t("reference_no")}: ${request.id}`,
    date: `${t("date")}: ${formatDateTime(request.created_date)}`,
    from: { label: t("from"), value: request.origin_facility.name },
    subject: `${t("subject")}: ${t("request_for")} ${request.title}`,
    intro: `${t("request_the_following_resource")}${request.emergency ? t("on_emergency_basis") : ""}:`,
    fields: [
      { label: t("request_title"), value: request.title },
      {
        label: t("category"),
        value: t(
          `resource_request_category__${getResourceRequestCategoryEnum(request.category)}`,
        ),
      },
    ],
    reason: {
      label: t("reason_for_request"),
      value: request.reason || "--",
    },
    status: { label: t("current_status"), value: status },
    signatures: [
      {
        label: `${t("requested_by")}:`,
        name: request.created_by ? formatName(request.created_by) : "--",
        date: formatDateTime(request.created_date),
      },
      ...(["approved", "rejected"].includes(request.status)
        ? [
            {
              label: `${status} ${t("by")}:`,
              name: request.updated_by ? formatName(request.updated_by) : "--",
              date: formatDateTime(request.modified_date),
            },
          ]
        : []),
    ],
  };
}
