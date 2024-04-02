import ButtonV2 from "../Common/components/ButtonV2";
import { navigate } from "raviger";
import { lazy, useState } from "react";
import { externalResultList } from "../../Redux/actions";
import ListFilter from "./ListFilter";
import FacilitiesSelectDialogue from "./FacilitiesSelectDialogue";
import { FacilityModel } from "../Facility/models";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ExportMenu from "../Common/Export";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import CountBlock from "../../CAREUI/display/Count";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import Page from "../Common/components/Page";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { parsePhoneNumber } from "../../Utils/utils";
import useAuthUser from "../../Common/hooks/useAuthUser";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";

const Loading = lazy(() => import("../Common/Loading"));

export default function ResultList() {
  const authUser = useAuthUser();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({
    limit: 14,
    cacheBlacklist: ["mobile_number", "name"],
  });
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const [resultId, setResultId] = useState(-1);
  const [dataList, setDataList] = useState({ lsgList: [], wardList: [] });

  const [phone_number, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");

  const setPhoneNum = (mobile_number: string) => {
    setPhoneNumber(mobile_number);
    if (mobile_number.length >= 13) {
      setPhoneNumberError("");
      updateQuery({ mobile_number });
      return;
    }

    if (mobile_number === "+91" || mobile_number === "") {
      setPhoneNumberError("");
      updateQuery({ mobile_number: "" });
      return;
    }

    setPhoneNumberError("Enter a valid number");
  };
  const params = {
    page: qParams.page || 1,
    name: qParams.name || "",
    mobile_number: qParams.mobile_number
      ? parsePhoneNumber(qParams.mobile_number) ?? ""
      : "",
    wards: qParams.wards || undefined,
    local_bodies: qParams.local_bodies || undefined,
    created_date_before: qParams.created_date_before || undefined,
    created_date_after: qParams.created_date_after || undefined,
    result_date_before: qParams.result_date_before || undefined,
    result_date_after: qParams.result_date_after || undefined,
    sample_collection_date_after:
      qParams.sample_collection_date_after || undefined,
    sample_collection_date_before:
      qParams.sample_collection_date_before || undefined,
    offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    srf_id: qParams.srf_id || undefined,
  };

  const { data, loading } = useQuery(routes.externalResultList, {
    query: params,
  });

  let manageResults: any = null;

  const removeLSGFilter = (paramKey: any, id: any) => {
    const updatedLsgList = dataList.lsgList.filter((x: any) => x.id !== id);
    const lsgParams = updatedLsgList.map((x: any) => x.id);
    const updatedWardList = dataList.wardList.filter(
      (x: any) => x.local_body_id !== id
    );
    const wardParams = updatedWardList.map((x: any) => x.id);
    updateQuery({ [paramKey]: lsgParams, ["wards"]: wardParams });
    setDataList({ lsgList: updatedLsgList, wardList: updatedWardList });
  };

  const removeWardFilter = (paramKey: any, id: any) => {
    const updatedList = dataList.wardList.filter((x: any) => x.id !== id);
    const params = updatedList.map((x: any) => x.id);
    updateQuery({ [paramKey]: params });
    setDataList({ ...dataList, wardList: updatedList });
  };

  const lsgWardData = (lsgs: any, wards: any) =>
    setDataList({ lsgList: lsgs, wardList: wards });

  const lsgWardBadge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span
          key={`${key}-${value.id}`}
          className="inline-flex h-full items-center rounded-full border bg-white px-3 py-1 text-xs font-medium leading-4 text-gray-600"
        >
          {`${key}: ${value.name}`}
          <CareIcon
            icon="l-times"
            className="ml-2 cursor-pointer rounded-full text-base hover:bg-gray-500"
            onClick={() =>
              paramKey === "local_bodies"
                ? removeLSGFilter(paramKey, value.id)
                : paramKey === "wards"
                ? removeWardFilter(paramKey, value.id)
                : null
            }
          />
        </span>
      )
    );
  };

  let resultList: any[] = [];
  if (data?.results.length) {
    resultList = data.results.map((result: any) => {
      const resultUrl = `/external_results/${result.id}`;
      return (
        <tr key={`usr_${result.id}`} className="bg-white">
          <td
            onClick={() => navigate(resultUrl)}
            className="text-md whitespace-nowrap px-6 py-4 leading-5 text-gray-900"
          >
            <div className="flex">
              <a
                href="#"
                className="group inline-flex space-x-2 text-sm leading-5"
              >
                <p className="text-gray-800 transition duration-150 ease-in-out group-hover:text-gray-900">
                  {`${result.name}`} - {result.age} {result.age_in}
                </p>
              </a>
            </div>
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
            <span className="font-medium text-gray-900">
              {result.test_type}
            </span>
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize leading-4 text-blue-800">
              {result.result}
            </span>
            {result.patient_created ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium capitalize leading-4 text-green-800">
                Patient Created
              </span>
            ) : null}
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-800">
            {result.result_date || "-"}
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
            <ButtonV2
              variant="primary"
              disabled={
                authUser.user_type === "Nurse" || authUser.user_type === "Staff"
              }
              authorizeFor={NonReadOnlyUsers}
              border
              ghost
              onClick={() => {
                setShowDialog(true);
                setResultId(result.id);
              }}
            >
              CREATE
            </ButtonV2>
          </td>
        </tr>
      );
    });
  }

  if (loading) {
    manageResults = (
      <tr className="bg-white">
        <td colSpan={5}>
          <Loading />
        </td>
      </tr>
    );
  } else if (data?.results.length) {
    manageResults = <>{resultList}</>;
  } else if (data?.results.length === 0) {
    manageResults = (
      <tr className="bg-white">
        <td colSpan={5}>
          <div className="w-full rounded-lg bg-white p-3">
            <div className="mt-4 flex w-full  justify-center text-2xl font-bold text-gray-600">
              No Results Found
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <FacilitiesSelectDialogue
        show={showDialog}
        setSelected={(e) => setSelectedFacility(e)}
        selectedFacility={selectedFacility}
        handleOk={() =>
          navigate(`facility/${selectedFacility.id}/patient`, {
            query: { extId: resultId },
          })
        }
        handleCancel={() => setShowDialog(false)}
      />

      <Page
        title="External Results"
        hideBack
        breadcrumbs={false}
        options={
          <ExportMenu
            label="Import/Export"
            exportItems={[
              ...(authUser.user_type !== "Nurse" &&
              authUser.user_type !== "Staff"
                ? [
                    {
                      label: "Import Results",
                      action: () => navigate("/external_results/upload"),
                      options: {
                        icon: <CareIcon icon="l-import" />,
                      },
                    },
                  ]
                : []),
              {
                label: "Export Results",
                action: () =>
                  externalResultList(
                    { ...qParams, csv: true },
                    "externalResultList"
                  ),
                filePrefix: "external_results",
                options: {
                  icon: <CareIcon icon="l-export" />,
                },
              },
            ]}
          />
        }
      >
        <div className="relative my-4 grid-cols-1 gap-5 px-2 sm:grid-cols-3 md:px-0 lg:grid">
          <CountBlock
            text="Total Results"
            count={data?.count || 0}
            loading={loading}
            icon="l-clipboard-notes"
            className="flex-1"
          />
          <div className="mt-2">
            <SearchInput
              name="name"
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              value={qParams.name}
              placeholder="Search by name"
            />
            <div className="w-full max-w-sm">
              <PhoneNumberFormField
                label="Search by number"
                name="mobile_number"
                labelClassName="my-2 text-sm font-medium"
                value={phone_number}
                onChange={(e) => setPhoneNum(e.value)}
                error={phoneNumberError}
                placeholder="Search by Phone Number"
                types={["mobile", "landline"]}
              />
            </div>
          </div>
          <div className="ml-auto mt-4 flex flex-col justify-evenly gap-4 lg:mt-0">
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {qParams.local_bodies &&
            dataList.lsgList.map((x) => lsgWardBadge("LSG", x, "local_bodies"))}
          {qParams.wards &&
            dataList.wardList.map((x) => lsgWardBadge("Ward", x, "wards"))}
        </div>

        <FilterBadges
          badges={({ badge, phoneNumber, dateRange }) => [
            badge("Name", "name"),
            phoneNumber("Phone no.", "mobile_number"),
            ...dateRange("Created", "created_date"),
            ...dateRange("Result", "result_date"),
            ...dateRange("Sample created", "sample_collection_date"),
            badge("SRF ID", "srf_id"),
          ]}
        />

        <div
          className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-t-lg"
          id="external-result-table"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                  Name
                </th>
                <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                  Test Type
                </th>
                <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wide text-gray-500">
                  Status
                </th>
                <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                  Result Date
                </th>
                <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                  Create Patient
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {manageResults}
            </tbody>
          </table>
        </div>
        <Pagination totalCount={data?.count || 0} />
        <ListFilter
          {...advancedFilter}
          dataList={lsgWardData}
          key={window.location.search}
        />
      </Page>
    </div>
  );
}
