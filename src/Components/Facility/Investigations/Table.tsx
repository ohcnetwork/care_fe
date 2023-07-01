import { FieldChangeEvent } from "../../Form/FormFields/Utils";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import _ from "lodash";
import { useState } from "react";

const TestRow = ({ data, value, onChange, i }: any) => {
  return (
    <tr className={i % 2 == 0 ? "bg-gray-50" : "bg-white"}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {data.name}
      </td>
      <td className="px-6 py-4 min-w-[200px] whitespace-nowrap text-sm text-gray-700 text-right">
        {data.investigation_type === "Choice" ? (
          <SelectFormField
            name={data.name}
            value={value}
            options={data?.choices.split(",")}
            optionLabel={(o: string) => o}
            optionValue={(o: string) => o}
            onChange={onChange}
            errorClassName="hidden"
          />
        ) : (
          <TextFormField
            name={data.name}
            value={value}
            onChange={onChange}
            type={data.investigation_type === "Float" ? "number" : "text"}
            placeholder="Enter value"
          />
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.unit || "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.min_value ?? "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.max_value ?? "---"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {data.ideal_value || "---"}
      </td>
    </tr>
  );
};

export const TestTable = ({ title, data, state, dispatch }: any) => {
  const [searchFilter, setSearchFilter] = useState("");

  const filterTests = data.filter((i: any) => {
    const result = !(
      String(i.name).toLowerCase().search(searchFilter.toLowerCase()) === -1
    );
    return result;
  });

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state };
    _.set(form, name, value);
    dispatch({ type: "set_form", form });
  };

  return (
    <div className="md:p-4 md:m-4">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}
      <br />
      <TextFormField
        name="test_search"
        label="Search Test"
        className="mt-2"
        placeholder="Search test"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.value)}
      />
      <br />
      <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-x-scroll">
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
              filterTests.map((t: any, i: number) => {
                return (
                  <TestRow
                    data={t}
                    i={i}
                    key={t.external_id}
                    value={
                      state[t.external_id] && t.investigation_type === "Float"
                        ? state[t.external_id].value
                        : state[t.external_id].notes
                    }
                    onChange={(e: FieldChangeEvent<string>) =>
                      handleValueChange(
                        t.investigation_type === "Float"
                          ? Number(e.value)
                          : e.value,
                        `${t.external_id}.${
                          t.investigation_type === "Float" ? "value" : "notes"
                        }`
                      )
                    }
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
  );
};

export default TestTable;
