import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import { classNames } from "@/Utils/utils";

const TestRow = ({ data, i, onChange, showForm, value, isChanged }: any) => {
  const { t } = useTranslation();
  return (
    <tr
      className={classNames(
        i % 2 == 0 ? "bg-secondary-50" : "bg-white",
        isChanged && "!bg-primary-300",
      )}
      x-description="Even row"
    >
      <td className="whitespace-nowrap px-6 py-4 text-xs">
        <p className="text-sm font-medium text-secondary-900">
          {data?.investigation_object.name || "---"}
        </p>
        <p className="flex flex-row gap-x-2">
          <span>
            {t("investigations__range")}:{" "}
            {data?.investigation_object.min_value || ""}
            {data?.investigation_object.min_value ? " - " : ""}
            {data?.investigation_object.max_value || ""}
          </span>
        </p>
        <p className="text-secondary-600">
          {t("investigations__unit")}:{" "}
          {data?.investigation_object.unit || "---"}
        </p>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-secondary-700 xl:px-6">
        {showForm ? (
          data?.investigation_object?.investigation_type === "Choice" ? (
            <SelectFormField
              name={data?.investigation_object?.name}
              options={data?.investigation_object?.choices.split(",")}
              optionLabel={(o: string) => o}
              optionValue={(o: string) => o}
              value={value}
              onChange={onChange}
            />
          ) : (
            <TextFormField
              name={data?.investigation_object?.name}
              value={value}
              onChange={onChange}
              type={
                data?.investigation_object?.investigation_type === "Float"
                  ? "number"
                  : "string"
              }
              placeholder="Enter value"
            />
          )
        ) : (
          value || "---"
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-secondary-700">
        {data.investigation_object.ideal_value || "---"}
      </td>
    </tr>
  );
};

const HeadingRow = () => {
  const { t } = useTranslation();
  const commonClass =
    "px-6 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-800";
  return (
    <tr>
      <th
        key={t("investigations__name")}
        scope="col"
        className={`w-1/6 text-left md:w-1/6 ${commonClass}`}
      >
        {t("investigations__name")}
      </th>
      <th
        key={t("investigations__result")}
        scope="col"
        className={`w-2/6 text-center md:w-1/6 ${commonClass}`}
      >
        {t("investigations__result")}
      </th>
      <th
        key={t("investigations__ideal_value")}
        scope="col"
        className={`w-3/6 text-center md:w-4/6 ${commonClass}`}
      >
        {t("investigations__ideal_value")}
      </th>
    </tr>
  );
};

export const InvestigationTable = ({
  title,
  data,
  isDischargedPatient,
  handleValueChange,
  changedFields,
  handleUpdateCancel,
  handleSave,
  facilityId,
  patientId,
  consultationId,
  sessionId,
}: any) => {
  const { t } = useTranslation();
  const [searchFilter, setSearchFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filterTests = Object.values(data).filter((i: any) => {
    const result = !(
      String(i.investigation_object.name)
        .toLowerCase()
        .search(searchFilter.toLowerCase()) === -1
    );
    return result;
  });

  return (
    <div className="m-4 p-4">
      <div className="mb flex flex-col items-center justify-between gap-x-3 sm:flex-row">
        {title && <div className="text-xl font-bold">{title}</div>}
        <div className="flex flex-col py-2 sm:flex-row">
          <ButtonV2
            disabled={isDischargedPatient}
            variant="primary"
            className="my-2 mr-2"
            onClick={() => {
              showForm && handleUpdateCancel();
              setShowForm((prev) => !prev);
            }}
          >
            {!showForm && <CareIcon icon="l-edit" className="mr-2" />}
            {showForm ? "Cancel" : "Update Details"}
          </ButtonV2>
          {showForm && (
            <ButtonV2
              variant="primary"
              onClick={() => {
                handleSave();
                setShowForm((prev) => !prev);
              }}
              className="my-2 mr-2"
            >
              {t("save")}
            </ButtonV2>
          )}
          <ButtonV2
            className="my-2 mr-2"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/${sessionId}/print`,
              )
            }
          >
            <CareIcon icon="l-print" className="text-lg" />
            {t("print")}
          </ButtonV2>
        </div>
      </div>
      <TextFormField
        name="test_search"
        label="Search Test"
        className="mt-2"
        placeholder="Search test"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.value)}
      />
      <br />
      <div className="overflow-x-scroll border-b border-secondary-200 shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <HeadingRow />
          </thead>
          <tbody>
            {filterTests.length > 0 ? (
              filterTests.map((t: any, i) => {
                const value =
                  changedFields[t.id]?.notes ??
                  changedFields[t.id]?.value ??
                  null;
                const isChanged = changedFields[t.id]?.initialValue !== value;
                return (
                  <TestRow
                    data={t}
                    key={t.id}
                    i={i}
                    showForm={showForm}
                    value={value}
                    isChanged={isChanged}
                    onChange={(e: any) => {
                      const { target, value } =
                        t?.investigation_object?.investigation_type === "Float"
                          ? {
                              target: `${t.id}.value`,
                              value: Number(e.value) || null,
                            }
                          : {
                              target: `${t.id}.notes`,
                              value: e.value,
                            };
                      handleValueChange(value, target);
                    }}
                  />
                );
              })
            ) : (
              <tr className="text-center text-secondary-500">
                <td className="col-span-6">{t("no_tests_taken")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestigationTable;
