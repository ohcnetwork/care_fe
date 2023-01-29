import ButtonV2 from "./components/ButtonV2";
type Callback = () => void;
type Props = {
  onClose: Callback;
  onClear: Callback;
  onApply: Callback;
};

const FilterButtons = ({ onClose, onClear, onApply }: Props) => {
  return (
    <div className="flex flex-col md:flex-row items-center mb-4 md:max-w-sm w-full fixed -ml-4 pl-4 pr-8 z-10 -mt-8 pt-8 pb-8 md:pb-4 bg-gray-50">
      <ButtonV2
        variant="secondary"
        ghost
        onClick={onClose}
        className="w-full flex-1"
      >
        <i className="text-base fa-solid fa-xmark" /> Cancel
      </ButtonV2>
      <ButtonV2
        variant="danger"
        ghost
        onClick={onClear}
        className="w-full my-2 md:my-0 flex-1 min-w-fit"
      >
        <i className="text-base fa-solid fa-xmark" /> Clear Filters
      </ButtonV2>
      <div className="flex-1" />
      <ButtonV2 onClick={onApply} className="w-full flex-1">
        Apply
      </ButtonV2>
    </div>
  );
};

export default FilterButtons;
