import { SlideOverProps } from "../interactive/SlideOver";
import SlideOver from "../interactive/SlideOver";
import SelectMenuV2 from "../../Components/Form/SelectMenuV2";
import { TextFormField } from "../../stories/care_ui/FormElements/TextFormField.stories";
import DateFormField from "../../Components/Form/FormFields/DateFormField";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import MultiSelectMenuV2 from "../../Components/Form/MultiSelectMenuV2";

export type FilterType = {
  name: string;
  label?: string;
  type: "text" | "select" | "date" | "number" | "multiselect";
  options?: FilterOptionType[];
  value?: any;
  dependsOn?: string;
};

export type FilterOptionType = {
  name: string;
  value: string | number;
};

export default function FilterSlideOver(
  props: Omit<SlideOverProps, "children"> & {
    filters: FilterType[];
    setFilters: (f: FilterType[]) => void;
    onApply: () => void;
  }
) {
  const { filters, setFilters, onApply, ...rest } = props;

  const FilterInput = (props: { filter: FilterType; disabled: boolean }) => {
    const { filter, disabled } = props;
    switch (filter.type) {
      case "text":
      case "number":
        return (
          <TextFormField
            disabled={disabled}
            type={filter.type}
            value={filter.value}
            name={filter.name}
            onChange={(e: any) => {
              setFilters(
                filters.map((f) =>
                  f.name === filter.name ? { ...f, value: e.target.value } : f
                )
              );
            }}
          />
        );
      case "date":
        return (
          <DateFormField
            disabled={disabled}
            label={filter.label}
            value={filter.value || new Date().getTime()}
            name={filter.name}
            onChange={(e: any) => {
              setFilters(
                filters.map((f) =>
                  f.name === filter.name ? { ...f, value: e.target.value } : f
                )
              );
            }}
          />
        );
      case "select":
        return (
          <SelectMenuV2
            disabled={disabled}
            placeholder={"Select Option"}
            value={filter.value}
            onChange={(v: any) => {
              setFilters(
                filters.map((f) =>
                  f.name === filter.name ? { ...f, value: v } : f
                )
              );
            }}
            options={(filter.options?.map((o) => o.value) as any) || []}
            optionLabel={(o) =>
              filter.options?.find((f) => f.value === o)?.name || ""
            }
          />
        );
      case "multiselect":
        return (
          <MultiSelectMenuV2
            disabled={disabled}
            placeholder={"Select Options"}
            value={filter.value}
            onChange={(v: any) => {
              setFilters(
                filters.map((f) =>
                  f.name === filter.name ? { ...f, value: v } : f
                )
              );
            }}
            options={(filter.options?.map((o) => o.value) as any) || []}
            optionLabel={(o) =>
              filter.options?.find((f) => f.value === o)?.name || ""
            }
          />
        );
    }
  };

  const clearFields = () => {
    setFilters(filters.map((f) => ({ ...f, value: undefined })));
  };

  return (
    <SlideOver
      {...rest}
      title={rest.title || "Filters"}
      dialogClass="md:w-[350px]"
    >
      <div className="flex items-center justify-end w-full px-2">
        <ButtonV2 variant="danger" ghost onClick={() => clearFields()}>
          <i className="text-base uil uil-multiply" />
          Clear Filters
        </ButtonV2>
        <ButtonV2 onClick={onApply} ghost>
          <i className="text-base uil uil-check" />
          Apply
        </ButtonV2>
      </div>
      <div className="flex flex-col gap-4">
        {filters.map((filter) => {
          return (
            <div>
              <label className="mb-2">{filter.label || filter.name}</label>
              <FilterInput
                filter={filter}
                disabled={
                  filter.dependsOn
                    ? typeof filters.find((f) => f.name === filter.dependsOn)
                        ?.value === "undefined"
                    : false
                }
              />
            </div>
          );
        })}
      </div>
    </SlideOver>
  );
}
