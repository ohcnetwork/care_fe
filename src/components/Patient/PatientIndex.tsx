import dayjs from "dayjs";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionTabs } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import FacilitiesSelectDialogue from "@/components/ExternalResult/FacilitiesSelectDialogue";
import { FacilityModel } from "@/components/Facility/models";
import { PatientManager } from "@/components/Patient/ManagePatients";
import PatientFilter, {
  PatientFilterBadges,
} from "@/components/Patient/PatientFilter";
import { getPatientUrl } from "@/components/Patient/Utils";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { GENDER_TYPES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatPatientAge, parsePhoneNumber } from "@/Utils/utils";

export default function PatientIndex(props: {
  tab?: "live" | "discharged" | "search";
}) {
  const { t } = useTranslation();
  const { tab = "search" } = props;
  const [showDialog, setShowDialog] = useState<"create" | "list-discharged">();
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const {
    qParams,
    updateQuery,
    advancedFilter,
    Pagination,
    resultsPerPage,
    clearSearch,
  } = useFilters({
    limit: 12,
    cacheBlacklist: [
      "name",
      "patient_no",
      "phone_number",
      "emergency_phone_number",
    ],
  });

  const searchOptions = [
    {
      key: "name",
      type: "text" as const,
      placeholder: t("search_by_patient_name"),
      value: qParams.name || "",
      shortcutKey: "n",
    },
    {
      key: "patient_no",
      type: "text" as const,
      placeholder: t("search_by_patient_no"),
      value: qParams.patient_no || "",
      shortcutKey: "u",
    },
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: t("search_by_phone_number"),
      value: qParams.phone_number || "",
      shortcutKey: "p",
    },

    {
      key: "emergency_phone_number",
      type: "phone" as const,
      placeholder: t("search_by_emergency_phone_number"),
      value: qParams.emergency_phone_number || "",
      shortcutKey: "e",
    },
  ];

  const authUser = useAuthUser();

  const handleSearch = useCallback(
    (key: string, value: string) => {
      const updatedQuery: Record<string, string | undefined> = {};

      switch (key) {
        case "phone_number":
        case "emergency_phone_number":
          if (value.length >= 13 || value === "") {
            updatedQuery[key] = value;
          } else {
            updatedQuery[key] = "";
          }
          break;
        case "name":
        case "patient_no":
          updatedQuery[key] = value;
          break;
        default:
          break;
      }

      updateQuery(updatedQuery);
    },
    [updateQuery],
  );

  const getCleanedParams = (
    params: Record<string, string | number | undefined | boolean>,
  ) => {
    const cleaned: typeof params = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== 0 && params[key] !== "") {
        cleaned[key] = params[key];
      }
    });
    return cleaned;
  };

  const params = getCleanedParams({
    ...qParams,
    page: qParams.page || 1,
    limit: resultsPerPage,
    is_active:
      tab === "search" ? undefined : tab === "discharged" ? false : true,
    phone_number: qParams.phone_number
      ? parsePhoneNumber(qParams.phone_number)
      : undefined,
    emergency_phone_number: qParams.emergency_phone_number
      ? parsePhoneNumber(qParams.emergency_phone_number)
      : undefined,
    local_body: qParams.lsgBody || undefined,
    offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    last_menstruation_start_date_after:
      (qParams.is_antenatal === "true" &&
        dayjs().subtract(9, "month").format("YYYY-MM-DD")) ||
      undefined,
  });

  const isValidSearch = searchOptions.some((o) => !!o.value);

  const listingQuery = useQuery(routes.patientList, {
    query: params,
    prefetch: isValidSearch,
  });

  const { data: permittedFacilities } = useQuery(
    routes.getPermittedFacilities,
    {
      query: { limit: 1 },
    },
  );

  const onlyAccessibleFacility =
    permittedFacilities?.count === 1 ? permittedFacilities.results[0] : null;

  const handleAddPatient = () => {
    let facilityId = "";
    const showAllFacilityUsers = ["DistrictAdmin", "StateAdmin"];
    const userCanSeeAllFacilities = showAllFacilityUsers.includes(
      authUser?.user_type,
    );
    const userHomeFacilityId = authUser?.home_facility_object?.id;
    if (qParams.facility && userCanSeeAllFacilities)
      facilityId = qParams.facility;
    else if (
      qParams.facility &&
      !userCanSeeAllFacilities &&
      userHomeFacilityId !== qParams.facility
    )
      Notification.Error({
        msg: t("permission_denied"),
      });
    else if (!userCanSeeAllFacilities && userHomeFacilityId) {
      facilityId = userHomeFacilityId;
    } else if (onlyAccessibleFacility)
      facilityId = onlyAccessibleFacility.id || "";
    else if (!userCanSeeAllFacilities && !userHomeFacilityId) {
      Notification.Error({
        msg: t("no_home_facility_found"),
      });
      return;
    } else {
      setShowDialog("create");
      return;
    }
    navigate(`/facility/${facilityId}/patient/create`);
  };

  function AddPatientButton(props: { outline?: boolean }) {
    useKeyboardShortcut(["Shift", "P"], handleAddPatient);
    return (
      <Button
        variant={props.outline ? "outline_primary" : "primary_gradient"}
        className="gap-3 group"
        onClick={handleAddPatient}
      >
        <CareIcon icon="l-plus" />
        {t("add_new_patient")}
        <div
          className={cn(
            "border border-white/50 rounded-md opacity-50 px-2 py-0.5 text-xs",
            props.outline && "border-black/50 group-hover:border-white/50",
          )}
        >
          SHIFT P
        </div>
      </Button>
    );
  }

  return (
    <Page
      title="Patients"
      hideBack
      breadcrumbs={false}
      options={<AddPatientButton />}
    >
      <SectionTabs
        activeTab={tab}
        onChange={(value) => {
          if (value === "discharged") {
            // for a user that has access to just one facility, or if the user is filtering by one facility, take them to the dedicated facility discharge page
            const id = qParams.facility || onlyAccessibleFacility?.id;
            if (id) {
              navigate(`/patients/discharged?facility=${id}`);
              return;
            }

            // only state admins can view all discharged patients
            if (
              authUser.user_type === "StateAdmin" ||
              authUser.user_type === "StateReadOnlyAdmin"
            ) {
              navigate("/patients/discharged?is_active=false");
              return;
            }

            // for other users, ask what facility they would like to view discharged patients of
            setShowDialog("list-discharged");
          } else if (value === "search") {
            navigate("/patients");
          } else if (value === "live") {
            navigate("/patients/live");
          }
        }}
        tabs={[
          {
            label: t("search"),
            value: "search",
          },
          {
            label: t("live"),
            value: "live",
          },
          {
            label: t("discharged"),
            value: "discharged",
          },
        ]}
      />
      {tab === "search" ? (
        <div className="flex items-center flex-col w-full lg:w-[800px] mx-auto">
          <div className="w-full mt-4">
            <div className="flex flex-col md:flex-row justify-between mb-2 md:items-center gap-2">
              <div>
                <PatientFilterBadges />
              </div>
              <Button
                variant={"secondary"}
                className="gap-1 text-gray-700"
                onClick={() => advancedFilter.setShow(true)}
              >
                <CareIcon icon="l-filter" />
                {t("filters")}
              </Button>
            </div>
            <SearchByMultipleFields
              id="patient-search"
              options={searchOptions}
              onFieldChange={() => {
                updateQuery({
                  name: "",
                  patient_no: "",
                  phone_number: "",
                  emergency_phone_number: "",
                });
              }}
              onSearch={handleSearch}
              clearSearch={clearSearch}
              className="w-full"
            />
          </div>
          {isValidSearch &&
            (!listingQuery.loading && !listingQuery.data?.results.length ? (
              <div className="py-10 text-gray-600 text-sm flex flex-col gap-4 text-center">
                {t("no_records_found")}
                <br />
                {t("to_proceed_with_registration")}
                <AddPatientButton outline />
              </div>
            ) : listingQuery.loading ? (
              <Loading />
            ) : (
              !!listingQuery.data?.results.length && (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="">{t("name")}/IP/OP</TableHead>
                      <TableHead className="">
                        {t("primary_phone_no")}
                      </TableHead>
                      <TableHead className="">
                        {t("dob")}/{t("age")}
                      </TableHead>
                      <TableHead className="">{t("sex")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listingQuery.data?.results.map((patient) => (
                      <TableRow
                        className="bg-white cursor-pointer"
                        key={patient.id}
                        onClick={() => navigate(getPatientUrl(patient))}
                      >
                        <TableCell className="min-w-[200px]">
                          {patient.name}

                          <br />
                          <span>{patient.last_consultation?.patient_no}</span>
                        </TableCell>
                        <TableCell className="">
                          {patient.phone_number}
                        </TableCell>
                        <TableCell className="">
                          {!!patient.date_of_birth &&
                            dayjs(patient.date_of_birth).format(
                              "DD-MM-YYYY",
                            )}{" "}
                          ({formatPatientAge(patient)})
                        </TableCell>
                        <TableCell className="">
                          {
                            GENDER_TYPES.find((g) => g.id === patient.gender)
                              ?.text
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ))}
          {listingQuery.data && (
            <Pagination totalCount={listingQuery?.data?.count} />
          )}
        </div>
      ) : (
        <PatientManager />
      )}
      <PatientFilter
        {...advancedFilter}
        key={JSON.stringify(advancedFilter.filter)}
      />
      <FacilitiesSelectDialogue
        show={!!showDialog}
        setSelected={(e) => setSelectedFacility(e)}
        selectedFacility={selectedFacility}
        handleOk={() => {
          switch (showDialog) {
            case "create":
              navigate(`/facility/${selectedFacility.id}/patient/create`);
              break;
            case "list-discharged":
              navigate(`/patients/discharged?facility=${selectedFacility.id}`);
              break;
          }
          setShowDialog(undefined);
        }}
        handleCancel={() => {
          setShowDialog(undefined);
          setSelectedFacility({ name: "" });
        }}
      />
    </Page>
  );
}
