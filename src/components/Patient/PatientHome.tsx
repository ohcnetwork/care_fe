import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { patientTabs as tabs } from "@/components/Patient/PatientDetailsTab";

import { PLUGIN_Component } from "@/PluginEngine";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatPatientAge, relativeTime } from "@/Utils/utils";
import { Patient } from "@/types/emr/newPatient";

export const PatientHome = (props: {
  facilityId?: string;
  id: string;
  page: (typeof tabs)[0]["route"];
}) => {
  const { facilityId, id, page } = props;

  const { t } = useTranslation();

  const { data: patientData, isLoading } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: query(routes.patient.getPatient, {
      pathParams: {
        id,
      },
    }),
    enabled: !!id,
  });

  if (isLoading) {
    return <Loading />;
  }

  const Tab = tabs.find((t) => t.route === page)?.component;

  if (!patientData) {
    return <div>{t("patient_not_found")}</div>;
  }

  return (
    <Page
      title={t("patient_details")}
      options={
        <>
          {facilityId && (
            <Button asChild variant="primary">
              <Link
                href={`/facility/${facilityId}/patient/${id}/book-appointment`}
              >
                {t("schedule_appointment")}
              </Link>
            </Button>
          )}
        </>
      }
    >
      <div className="mt-3 overflow-y-auto" data-testid="patient-dashboard">
        <div className="px-3 md:px-0">
          <div className="rounded-md bg-white p-3 shadow-sm">
            <div>
              <div className="flex flex-col justify-between gap-4 gap-y-2 md:flex-row">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex flex-row gap-x-4">
                    <div className="h-10 w-10 flex-shrink-0 md:h-14 md:w-14">
                      <Avatar
                        className="size-10 font-semibold text-secondary-800 md:size-auto"
                        name={patientData.name}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-col md:flex-row gap-x-4">
                        <h1
                          id="patient-name"
                          className="text-base md:text-xl font-semibold capitalize text-gray-950 mb-2 leading-tight"
                        >
                          {patientData.name}
                        </h1>
                        {patientData.death_datetime && (
                          <Badge
                            variant="destructive"
                            className="border-2 border-red-700 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
                          >
                            <h3 className="text-xs font-normal sm:text-sm sm:font-medium">
                              {t("time_of_death")}
                              {": "}
                              {dayjs(patientData.death_datetime).format(
                                "DD MMM YYYY, hh:mm A",
                              )}
                            </h3>
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-medium text-gray-600 capitalize">
                        {formatPatientAge(patientData, true)},{"  "}
                        {t(`GENDER__${patientData.gender}`)}, {"  "}
                        {patientData.blood_group?.replace("_", " ")}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="sticky top-0 z-10 mt-4 w-full border-b bg-gray-50"
          role="navigation"
        >
          <div className="overflow-x-auto pb-3">
            <div className="flex flex-row" role="tablist">
              {tabs.map((tab) => (
                <Link
                  key={tab.route}
                  data-cy={`tab-${tab.route}`}
                  href={
                    facilityId
                      ? `/facility/${facilityId}/patient/${id}/${tab.route}`
                      : `/patient/${id}/${tab.route}`
                  }
                  className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${
                    page === tab.route
                      ? "border-b-4 border-green-800 text-green-800 md:border-b-2"
                      : "rounded-t-lg text-gray-600 hover:bg-gray-100"
                  }`}
                  role="tab"
                  aria-selected={page === tab.route}
                  aria-controls={`${tab.route}-panel`}
                >
                  {t(tab.route)}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:flex">
          <div className="h-full lg:mr-7 lg:basis-5/6">
            {Tab && (
              <Tab
                facilityId={facilityId || ""}
                patientId={id}
                patientData={patientData}
              />
            )}
          </div>
          <div className="sticky top-20 mt-8 mx-4 md:mx-0 h-full lg:basis-1/6">
            <section className="mb-4 space-y-2 md:flex">
              <div className="w-full lg:mx-0">
                <div className="font-semibold text-secondary-900">
                  {t("actions")}
                </div>
                <div className="mt-2 h-full space-y-2">
                  <div className="space-y-3 text-left text-lg font-semibold text-secondary-900">
                    <div className="space-y-2">
                      <PLUGIN_Component
                        __name="PatientHomeActions"
                        patient={patientData}
                        className="w-full bg-white font-semibold text-green-800 hover:bg-secondary-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <hr />
            <div
              id="actions"
              className="my-2 flex h-full flex-col justify-between space-y-2"
            >
              <div className="my-1 rounded-sm py-2">
                <div>
                  <div className="text-xs font-normal leading-5 text-gray-600">
                    {t("last_updated_by")}
                    <div className="font-semibold text-gray-900">
                      {patientData.updated_by?.first_name}{" "}
                      {patientData.updated_by?.last_name}
                    </div>
                  </div>

                  <div className="whitespace-normal text-xs font-normal text-gray-900">
                    {patientData.modified_date ? (
                      <TooltipComponent
                        content={formatDateTime(patientData.modified_date)}
                      >
                        <span>{relativeTime(patientData.modified_date)}</span>
                      </TooltipComponent>
                    ) : (
                      "--:--"
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-normal leading-5 text-gray-600">
                    {t("patient_profile_created_by")}
                    <div className="font-semibold text-gray-900">
                      {patientData.created_by?.first_name}{" "}
                      {patientData.created_by?.last_name}
                    </div>
                  </div>
                  <div className="whitespace-normal text-xs font-normal text-gray-900">
                    {patientData.created_date ? (
                      <TooltipComponent
                        content={formatDateTime(patientData.created_date)}
                      >
                        <span>{relativeTime(patientData.created_date)}</span>
                      </TooltipComponent>
                    ) : (
                      "--:--"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};
