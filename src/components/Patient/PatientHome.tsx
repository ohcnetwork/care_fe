import { useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatPatientAge, relativeDate } from "@/Utils/utils";
import { Patient } from "@/types/emr/newPatient";

export const PatientHome = (props: {
  facilityId?: string;
  id: string;
  page: (typeof patientTabs)[0]["route"];
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

  const Tab = patientTabs.find((t) => t.route === page)?.component;

  if (!patientData) {
    return <div>Patient not found</div>;
  }

  return (
    <Page
      title={t("patient_details")}
      options={
        <>
          <Button asChild variant="primary">
            <Link
              href={`/facility/${facilityId}/patient/${id}/book-appointment`}
            >
              {t("schedule_appointment")}
            </Link>
          </Button>
        </>
      }
    >
      <div className="mt-3" data-testid="patient-dashboard">
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
                    <div>
                      <h1
                        id="patient-name"
                        className="text-xl font-bold capitalize text-gray-950"
                      >
                        {patientData.name}
                      </h1>
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
          className="sticky top-0 z-10 mt-4 w-full overflow-x-auto border-b bg-gray-50"
          role="navigation"
        >
          <div className="flex flex-row" role="tablist">
            {patientTabs.map((tab) => (
              <Link
                key={tab.route}
                href={`/facility/${facilityId}/patient/${id}/${tab.route}`}
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

        <div className="h-full lg:flex">
          <div className="h-full lg:mr-7 lg:basis-5/6">
            {Tab && (
              <Tab
                facilityId={facilityId || ""}
                id={id}
                patientData={patientData}
              />
            )}
          </div>
          <div className="sticky top-20 mt-8 h-full lg:basis-1/6">
            <section className="mb-4 space-y-2 md:flex">
              <div className="mx-3 w-full lg:mx-0">
                <div className="font-semibold text-secondary-900">
                  {t("actions")}
                </div>
                <div className="mt-2 h-full space-y-2">
                  <div className="space-y-3 border-b border-dashed text-left text-lg font-semibold text-secondary-900">
                    <div>
                      <Button
                        className="w-full bg-white font-semibold text-green-800 hover:bg-secondary-200"
                        id="upload-patient-files"
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/patient/${id}/files`,
                          )
                        }
                      >
                        <span className="flex w-full items-center justify-start gap-2">
                          <CareIcon icon="l-file-upload" className="text-xl" />
                          {t("view_update_patient_files")}
                        </span>
                      </Button>
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
              <div className="my-1 rounded-sm p-2">
                <div>
                  <div className="text-xs font-normal text-gray-600">
                    {t("last_updated_by")}{" "}
                    <span className="font-semibold text-gray-900">
                      {patientData.updated_by?.first_name}{" "}
                      {patientData.updated_by?.last_name}
                    </span>
                  </div>
                  <div className="whitespace-normal text-sm font-semibold text-gray-900">
                    <div className="tooltip">
                      <span className={`tooltip-text tooltip`}>
                        {patientData.modified_date
                          ? formatDateTime(patientData.modified_date)
                          : "--:--"}
                      </span>
                      {patientData.modified_date
                        ? relativeDate(patientData.modified_date)
                        : "--:--"}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-normal leading-5 text-gray-600">
                    {t("patient_profile_created_by")}{" "}
                    <span className="font-semibold text-gray-900">
                      {patientData.created_by?.first_name}{" "}
                      {patientData.created_by?.last_name}
                    </span>
                  </div>
                  <div className="whitespace-normal text-sm font-semibold text-gray-900">
                    <div className="tooltip">
                      <span className={`tooltip-text tooltip`}>
                        {patientData.created_date
                          ? formatDateTime(patientData.created_date)
                          : "--:--"}
                      </span>
                      {patientData.created_date
                        ? relativeDate(patientData.created_date)
                        : "--:--"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="py-2">
              {patientData.death_datetime && (
                <div>
                  <Button
                    id="death-report"
                    className="my-2 w-full"
                    name="death_report"
                    onClick={() => navigate(`/death_report/${id}`)}
                  >
                    <CareIcon icon="l-file-download" className="text-lg" />
                    {t("death_report")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <ConfirmDialog
        className="w-full justify-between"
        title={t("assign_a_volunteer_to", { name: patientData.name })}
        show={openAssignVolunteerDialog}
        onClose={() => setOpenAssignVolunteerDialog(false)}
        description={
          <div className="mt-6">
            <UserAutocomplete
              value={assignedVolunteer as UserBareMinimum}
              onChange={(user) => setAssignedVolunteer(user.value)}
              userType={"Volunteer"}
              name={"assign_volunteer"}
              error={errors.assignedVolunteer}
            />
          </div>
        }
        action={
          assignedVolunteer || !patientData.assigned_to
            ? t("assign")
            : t("unassign")
        }
        onConfirm={handleAssignedVolunteer}
      /> */}
    </Page>
  );
};
