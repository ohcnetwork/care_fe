import { SlideOverProps } from "./SlideOver";
import SlideOver from "./SlideOver";

export type FilterType = {
  name: string;
  displayName?: string;
  type: "text" | "select" | "date" | "number" | "multiselect";
  options?: FilterOptionType[];
  dependsOn?: string | number;
};

export type FilterOptionType = {
  name: string;
  value: string | number;
};

export default function FilterSlideOver(
  props: Omit<SlideOverProps, "children"> & {
    filters: FilterType[];
    filterResult: any;
    setFilterResult: (f: any) => void;
  }
) {
  const { filters, ...rest } = props;

  return (
    <SlideOver {...rest} title={rest.title || "Filters"}>
      {filters && "s"}
      Mouse
    </SlideOver>
  );
}
