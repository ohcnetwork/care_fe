import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import _ from "lodash";
import { classNames } from "../../../Utils/utils";
import { useState } from "react";

const TestRow = ({ data, i, onChange, showForm, value, isChanged }: any) => {
  return (
    <tr
      className={classNames(
        i % 2 == 0 ? "bg-gray-50" : "bg-white",
        isChanged && "!bg-primary-300"
      )}
      x-description="Even row"
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {data?.investigation_object?.name || "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.investigation_object.unit || "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.investigation_object.min_value || "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.investigation_object.max_value || "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.investigation_object.ideal_value || "---"}
      </td>
    </tr>
  );
};

export const InvestigationTable = ({
  title,
  data,
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
    <div className="p-4 m-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb">
        {title && <div className="font-bold text-xl">{title}</div>}
        <div className="py-2 flex sm:flex-row flex-col ">
          <ButtonV2
            variant="primary"
            onClick={() => window.print()}
            className="mr-2 my-2"
            disabled={showForm}
          >
            Print Report
          </ButtonV2>
          <ButtonV2
            variant="primary"
            className="mr-2 my-2"
            onClick={() => {
              showForm && handleUpdateCancel();
              setShowForm((prev) => !prev);
            }}
          >
            {!showForm && <CareIcon className="care-l-edit mr-2" />}
            {showForm ? "Cancel" : "Update Details"}
          </ButtonV2>
          {showForm && (
            <ButtonV2
              variant="primary"
              onClick={() => handleSave()}
              className="mr-2 my-2"
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
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Value", "Unit", "Min", "Max", "Ideal"].map(
                  (heading) => (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  )
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
                <tr className="text-center text-gray-500">No tests taken</tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvestigationTable;
