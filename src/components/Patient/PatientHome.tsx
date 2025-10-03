import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";
import {
  getTabs,
  patientTabs as tabs,
} from "@/components/Patient/PatientDetailsTab";

import { getPermissions } from "@/common/Permissions";

import { PLUGIN_Component } from "@/PluginEngine";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import patientApi from "@/types/emr/patient/patientApi";

import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import BookAppointmentSheet from "@/pages/Appointments/BookAppointment/BookAppointmentSheet";
import { PatientNotesTab } from "./PatientDetailsTab/PatientNotes";
export const PatientHome = (props: {
  facilityId?: string;
  id: string;
  page: (typeof tabs)[0]["route"];
}) => {
  const { facilityId, id, page } = props;

  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  useShortcutSubContext();
  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: query(patientApi.getPatient, {
      pathParams: {
        id,
      },
    }),
    enabled: !!id,
  });

  const { getPatientTabs } = getTabs(
    patientData?.permissions ?? [],
    hasPermission,
  );

  const { canWriteAppointment } = getPermissions(
    hasPermission,
    patientData?.permissions ?? [],
  );

  if (isLoading) {
    return <Loading />;
  }

  const tabs = getPatientTabs;

  const Tab = tabs.find((t) => t.route === page);

  if (!patientData) {
    return <div>{t("patient_not_found")}</div>;
  }

  return (
    <Page
      title={t("patient_details")}
      options={
        <>
          {facilityId && canWriteAppointment && (
            <BookAppointmentSheet
              patientId={id}
              facilityId={facilityId}
              trigger={
                <Button variant="primary">{t("schedule_appointment")}</Button>
              }
            />
          )}
        </>
      }
    >
      <div className="mt-3 overflow-y-auto" data-testid="patient-dashboard">
        <div className="flex flex-col gap-2">
          <PatientHeader
            patient={patientData}
            className="bg-white shadow-sm border-none rounded-sm"
            facilityId={facilityId}
            isPatientPage={true}
          />
          <PatientDeceasedInfo patient={patientData} />
        </div>

        <div
          className="sticky top-0 z-9 mt-4 w-full border-b border-gray-200 bg-gray-50"
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
            {Tab?.component && (
              <Tab.component
                facilityId={
                  Tab?.route === "appointments" ? undefined : facilityId || ""
                }
                patientId={id}
                patientData={patientData}
              />
            )}
          </div>
          {Tab?.component !== PatientNotesTab && (
            <div className="sticky top-20 mt-8 mx-4 md:mx-0 h-full lg:basis-1/6">
              <section className="mb-4 space-y-2 md:flex">
                <div className="w-full lg:mx-0">
                  <div className="font-semibold text-secondary-900">
                    {t("actions")}
                  </div>
                  {/* Add link to patient home page */}

                  <div className="mt-2 h-full space-y-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link
                        href={`/facility/${facilityId}/patients/verify?${new URLSearchParams(
                          {
                            phone_number: patientData.phone_number,
                            year_of_birth: patientData.year_of_birth.toString(),
                            partial_id: patientData.id.slice(0, 5),
                          },
                        ).toString()}`}
                      >
                        {t("patient_home")}
                      </Link>
                    </Button>
                    <div className="space-y-3 text-left text-lg font-semibold text-secondary-900">
                      <div className="space-y-2">
                        <PLUGIN_Component
                          __name="PatientHomeActions"
                          patient={patientData}
                          facilityId={facilityId}
                          className="w-full bg-white font-semibold text-green-800 hover:bg-secondary-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <hr className="border-gray-200" />
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
                        <RelativeDateTooltip date={patientData.modified_date} />
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
                        <RelativeDateTooltip date={patientData.created_date} />
                      ) : (
                        "--:--"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
