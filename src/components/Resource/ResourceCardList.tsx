import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { formatDateTime } from "@/Utils/utils";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

interface ResourceCardListProps {
  data: ResourceRequest[];
}

const ResourceCardList = ({ data }: ResourceCardListProps) => {
  const { t } = useTranslation();

  if (data && !data.length) {
    return (
      <div className="w-full mt-64 flex flex-1 justify-center text-secondary-600">
        {t("no_results_found")}
      </div>
    );
  }

  return data.map((resource: ResourceRequest, i) => (
    <div
      key={i}
      className="w-full border border-b-2 border-gray-200  col-span-6"
    >
      <div className=" flex grid w-full gap-1 overflow-hidden bg-white p-4    sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-5">
        <div className="col-span-1 px-3 text-left">
          <div className="text-sm font-bold capitalize">{resource.title}</div>
        </div>

        <div className="col-span-1 flex flex-col px-3 text-left">
          <div className="3xl:flex-row mb-2 flex gap-2 sm:flex-row md:flex-row lg:flex-col xl:flex-row 2xl:flex-row ">
            {resource.status === "TRANSPORTATION TO BE ARRANGED" ? (
              <dt
                title={t("resource_status")}
                className="w-3/4 mt-1 h-fit flex h-5 shrink-0 items-center  overflow-hidden whitespace-nowrap text-ellipsis truncate"
              >
                <Chip
                  size="small"
                  variant="secondary"
                  startIcon="l-truck"
                  text={t(`${resource.status}`)}
                  className="text-lg font-bold text-sky-600 truncate bg-gray-300 rounded-full uppercase text-center"
                />
              </dt>
            ) : (
              <dt
                title={t("resource_status")}
                className="w-fit mt-1 h-fit flex h-5 shrink-0 items-center rounded-full  leading-4"
              >
                <Chip
                  size="small"
                  variant={
                    resource.status === "APPROVED" ? "primary" : "secondary"
                  }
                  startIcon="l-truck"
                  text={t(`${resource.status}`)}
                  className={`text-lg font-bold rounded-full uppercase ${
                    resource.status === "APPROVED"
                      ? "bg-sky-200"
                      : "bg-yellow-200 "
                  }`}
                />
              </dt>
            )}

            <div>
              {resource.emergency && (
                <span className="mt-1.5 inline-block shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-medium leading-4 text-red-800">
                  {t("emergency")}
                </span>
              )}
            </div>
          </div>

          <div className="text-center">
            <dt
              title={t("last_modified")}
              className={"flex items-center text-sm font-medium leading-5"}
            >
              <CareIcon icon="l-stopwatch" className="mr-1" />
              <dd className="text-xs font-medium leading-5">
                {formatDateTime(resource.modified_date) || "--"}
              </dd>
            </dt>
          </div>
        </div>

        <div className="col-span-1 text-left">
          <dt
            title={t("origin_facility")}
            className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
          >
            <CareIcon icon="l-plane-departure" className="mr-2" />
            <dd className="text-sm font-bold leading-5 text-secondary-900">
              {resource.origin_facility?.name}
            </dd>
          </dt>

          <dt
            title={t("resource_approving_facility")}
            className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
          >
            <CareIcon icon="l-user-check" className="mr-2" />
            <dd className="text-sm font-bold leading-5 text-secondary-900">
              {resource.approving_facility?.name}
            </dd>
          </dt>

          <dt
            title={t("assigned_facility")}
            className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
          >
            <CareIcon icon="l-plane-arrival" className="mr-2" />
            <dd className="text-sm font-bold leading-5 text-secondary-900">
              {resource.assigned_facility?.name || t("yet_to_be_decided")}
            </dd>
          </dt>
        </div>
        <div className="col-span-1 mt-2 flex flex-col text-left">
          <Link
            href={`/resource/${resource.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
          >
            <CareIcon icon="l-eye" className="text-lg" /> {t("all_details")}
          </Link>
        </div>
      </div>
    </div>
  ));
};

export default ResourceCardList;
