import { set } from "lodash-es";
import { useState } from "react";

import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

const TestRow = ({ data, value, onChange, i }: any) => {
  return (
    <tr className={i % 2 == 0 ? "bg-secondary-50" : "bg-white"}>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
        {data.name}
      </td>
      <td className="min-w-[200px] whitespace-nowrap px-6 py-4 text-right text-sm text-secondary-700">
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
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.unit || "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.min_value ?? "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {data.max_value ?? "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
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
    set(form, name, value);
    dispatch({ type: "set_form", form });
  };

  return (
    <div className="md:m-4 md:p-4">
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
      <div className="overflow-x-scroll border-b border-secondary-200 shadow sm:overflow-x-visible sm:rounded-lg">
        <table className="block min-w-full divide-y divide-secondary-200 overflow-scroll">
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
              filterTests.map((t: any, i: number) => {
                return (
                  <TestRow
                    data={t}
                    i={i}
                    key={t.external_id}
                    value={
                      state[t.external_id] &&
                      (state[t.external_id].value ?? state[t.external_id].notes)
                    }
                    onChange={(e: FieldChangeEvent<string>) =>
                      handleValueChange(
                        t.investigation_type === "Float"
                          ? Number(e.value)
                          : e.value,
                        `${t.external_id}.${
                          t.investigation_type === "Float" ? "value" : "notes"
                        }`,
                      )
                    }
                  />
                );
              })
            ) : (
              <tr className="text-center text-secondary-500">No tests taken</tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestTable;
