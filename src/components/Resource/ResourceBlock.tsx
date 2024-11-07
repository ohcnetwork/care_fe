import dayjs from "dayjs";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { ResourceModel } from "@/components/Facility/models";

import { classNames, formatDateTime, formatName } from "@/Utils/utils";

export default function ResourceBlock(props: { resource: ResourceModel }) {
  const { resource } = props;
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        <div className="flex justify-between p-4">
          <div>
            <div className="text-xl font-bold capitalize">{resource.title}</div>
          </div>
          <div>
            {resource.emergency && (
              <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                {t("emergency")}
              </span>
            )}
          </div>
        </div>
        <dl className="flex flex-wrap gap-1">
          {(
            [
              {
                title: "origin_facility",
                icon: "l-plane-departure",
                data: resource.origin_facility_object.name,
              },
              {
                title: "resource_approving_facility",
                icon: "l-user-check",
                data: resource.approving_facility_object?.name,
              },
              {
                title: "assigned_facility",
                icon: "l-plane-arrival",
                data:
                  resource.assigned_facility_object?.name ||
                  t("yet_to_be_decided"),
              },
              {
                title: "last_modified",
                icon: "l-stopwatch",
                data: formatDateTime(resource.modified_date),
                className: dayjs()
                  .subtract(2, "hours")
                  .isBefore(resource.modified_date)
                  ? "text-secondary-900"
                  : "rounded bg-red-500 border border-red-600 text-white w-full font-bold",
              },
              {
                title: "assigned_to",
                icon: "l-user",
                data: resource.assigned_to_object
                  ? formatName(resource.assigned_to_object) +
                    " - " +
                    resource.assigned_to_object.user_type
                  : undefined,
              },
            ] as const
          )
            .filter((d) => d.data)
            .map((datapoint, i) => (
              <div
                className={classNames(
                  "mx-2 flex items-center gap-2 px-2 py-1",
                  "className" in datapoint ? datapoint.className : "",
                )}
                title={t(datapoint.title)}
                key={i}
              >
                <dt className={""}>
                  <CareIcon icon={datapoint.icon} className="text-xl" />
                </dt>
                <dd className="text-sm font-semibold">{datapoint.data}</dd>
              </div>
            ))}
        </dl>
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4">
        <Link
          href={`/resource/${resource.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
        >
          <CareIcon icon="l-eye" className="text-lg" /> {t("all_details")}
        </Link>
      </div>
    </div>
  );
}
