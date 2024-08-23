import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import { classNames } from "../../../Utils/utils";
import { useState } from "react";

const TestRow = ({ data, i, onChange, showForm, value, isChanged }: any) => {
  return (
    <tr
      className={classNames(
        i % 2 == 0 ? "bg-secondary-50" : "bg-white",
        isChanged && "!bg-primary-300",
      )}
      x-description="Even row"
    >
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
        {data?.investigation_object?.name || "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
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
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.investigation_object.unit || "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.investigation_object.min_value || "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.investigation_object.max_value || "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.investigation_object.ideal_value || "---"}
      </td>
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
}: any) => {
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
      <div className="mb flex flex-col items-center justify-between sm:flex-row">
        {title && <div className="text-xl font-bold">{title}</div>}
        <div className="flex flex-col py-2 sm:flex-row">
          <ButtonV2
            variant="primary"
            onClick={() => window.print()}
            className="my-2 mr-2"
            disabled={showForm}
          >
            Print Report
          </ButtonV2>
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
              onClick={() => handleSave()}
              className="my-2 mr-2"
            >
              Save
            </ButtonV2>
          )}
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
      <div id="section-to-print">
        <div className="overflow-x-scroll border-b border-secondary-200 shadow sm:rounded-lg">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                {["Name", "Value", "Unit", "Min", "Max", "Ideal"].map(
                  (heading) => (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-800"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody x-max="2">
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
                          t?.investigation_object?.investigation_type ===
                          "Float"
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
                  No tests taken
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvestigationTable;
