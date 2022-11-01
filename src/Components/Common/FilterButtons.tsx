import ButtonV2 from "./components/ButtonV2";
type Callback = () => void;
type Props = {
  onClose: Callback;
  onClear: Callback;
  onApply: Callback;
};

const FilterButtons = ({ onClose, onClear, onApply }: Props) => {
  return (
    <div className="flex items-center mb-4 max-w-sm w-full fixed -ml-4 pl-4 pr-8 z-10 -mt-8 pt-8 pb-4 bg-gray-50">
      <ButtonV2 variant="secondary" ghost onClick={onClose}>
        <i className="text-base fa-solid fa-xmark" /> Cancel
      </ButtonV2>
      <ButtonV2 variant="danger" ghost onClick={onClear}>
        <i className="text-base fa-solid fa-xmark" /> Clear Filter
      </ButtonV2>
      <div className="flex-1" />
      <ButtonV2 onClick={onApply}>Apply</ButtonV2>
    </div>
  );
};

export default FilterButtons;
