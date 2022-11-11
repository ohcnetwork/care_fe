import { QueryParam } from "raviger";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import SlideOver from "../interactive/SlideOver";

export interface AdvancedFilterProps {
  open: boolean;
  setOpen: (show: boolean) => void;
  filter: QueryParam;
  onChange: (data: any) => void;
}

interface Props {
  open: boolean;
  setOpen: (state: boolean) => void;
  children?: React.ReactNode;
  onClear: () => void;
  onApply: () => void;
}

export default function FiltersSlideOver({ children, ...props }: Props) {
  return (
    <SlideOver
      {...props}
      slideFrom="right"
      dialogClass="md:w-96"
      title="Advanced Filters"
    >
      <div className="flex items-center justify-end w-full px-2">
        <div className="text-md flex items-center text-gray-700 gap-2 flex-1">
          <i className="uil uil-filter" />
          <p>Filter by</p>
        </div>
        <ButtonV2 variant="danger" ghost onClick={props.onClear}>
          <i className="text-base uil uil-multiply" />
          Clear Filter
        </ButtonV2>
        <ButtonV2 onClick={props.onApply} ghost>
          <i className="text-base uil uil-check" />
          Apply
        </ButtonV2>
      </div>
      <div className="mt-2 p-2 flex flex-col gap-4">{children}</div>
    </SlideOver>
  );
}
