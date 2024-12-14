import dayjs from "dayjs";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { KeyboardShortcutKey } from "@/CAREUI/interactive/KeyboardShortcut";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { GENDER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatPatientAge, parsePhoneNumber } from "@/Utils/utils";

import * as Notification from "../../Utils/Notifications";
import Page from "../Common/Page";
import SearchByMultipleFields from "../Common/SearchByMultipleFields";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import { FacilityModel } from "../Facility/models";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TabbedSections } from "../ui/tabs";
import { PatientManager } from "./ManagePatients";
import PatientFilter, { PatientFilterBadges } from "./PatientFilter";
import { getPatientUrl } from "./Utils";

export default function PatientIndex() {
  const { t } = useTranslation();
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
      placeholder: "search_by_patient_name",
      value: qParams.name || "",
      shortcutKey: "n",
    },
    {
      key: "patient_no",
      type: "text" as const,
      placeholder: "search_by_patient_no",
      value: qParams.patient_no || "",
      shortcutKey: "u",
    },
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: "Search_by_phone_number",
      value: qParams.phone_number || "",
      shortcutKey: "p",
    },

    {
      key: "emergency_contact_number",
      type: "phone" as const,
      placeholder: "search_by_emergency_phone_number",
      value: qParams.emergency_phone_number || "",
      shortcutKey: "e",
    },
  ];

  const authUser = useAuthUser();

  const handleSearch = useCallback(
    (key: string, value: string) => {
      const updatedQuery = {
        phone_number:
          key === "phone_number"
            ? value.length >= 13 || value === ""
              ? value
              : undefined
            : undefined,
        name: key === "name" ? value : undefined,
        patient_no: key === "patient_no" ? value : undefined,
        emergency_phone_number:
          key === "emergency_contact_number"
            ? value.length >= 13 || value === ""
              ? value
              : undefined
            : undefined,
      };

      updateQuery(updatedQuery);
    },
    [updateQuery],
  );

  const getCleanedParams = (
    params: Record<string, string | number | undefined>,
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
      !qParams.last_consultation__new_discharge_reason &&
      (qParams.is_active || "True"),
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

  function AddPatientButton(props: { outline?: boolean }) {
    return (
      <Button
        variant={props.outline ? "outline_primary" : "primary"}
        className="gap-3"
        onClick={() => {
          let facilityId = "";
          const showAllFacilityUsers = ["DistrictAdmin", "StateAdmin"];
          const userCanSeeAllFacilities = showAllFacilityUsers.includes(
            authUser.user_type,
          );
          const userHomeFacilityId = authUser.home_facility_object?.id;
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
          navigate(`/facility/${facilityId}/register-patient`);
        }}
      >
        <CareIcon icon="l-plus" />
        {t("add_new_patient")}
        <KeyboardShortcutKey shortcut={["Shift", "P"]} />
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
      <TabbedSections
        tabs={[
          {
            label: t("search_patients"),
            value: "search",
            section: (
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
                    onSearch={handleSearch}
                    clearSearch={clearSearch}
                    className="w-full"
                  />
                </div>
                {isValidSearch && !listingQuery.data?.results.length && (
                  <div className="py-10 text-gray-600 text-sm flex flex-col gap-4 text-center">
                    {t("no_records_found")}
                    <br />
                    {t("to_proceed_with_registration")}
                    <AddPatientButton outline />
                  </div>
                )}
                {isValidSearch && !!listingQuery.data?.results.length && (
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="">{t("name")}/IP/OP</TableHead>
                        <TableHead className="">
                          {t("primary_phone_no")}
                        </TableHead>
                        <TableHead className="">{t("dob")}</TableHead>
                        <TableHead className="">{t("sex")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingQuery.data?.results.map((patient, i) => (
                        <TableRow
                          className="bg-white cursor-pointer"
                          key={i}
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
                            {patient.date_of_birth} ({formatPatientAge(patient)}
                            )
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
                )}
                {listingQuery.data && (
                  <Pagination totalCount={listingQuery?.data?.count} />
                )}
              </div>
            ),
          },
          {
            label: t("all_patients"),
            value: "all",
            section: <PatientManager />,
          },
        ]}
      />
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
              navigate(`facility/${selectedFacility.id}/register-patient`);
              break;
            case "list-discharged":
              navigate(`facility/${selectedFacility.id}/discharged-patients`);
              break;
          }
        }}
        handleCancel={() => {
          setShowDialog(undefined);
          setSelectedFacility({ name: "" });
        }}
      />
    </Page>
  );
}
