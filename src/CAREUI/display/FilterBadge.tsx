export interface FilterBadgeProps {
  name: string;
  value: string;
  onRemove: () => void;
}

/**
 * **Note: If this component is intended to be used with query params, use the
 * wrapped `FilterBadge` from `useFilters` hook instead.**
 */
const FilterBadge = ({ name, value, onRemove }: FilterBadgeProps) => {
  return (
    <span
      className={`${
        !value && "hidden"
      } flex flex-row items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white border border-gray-300 text-gray-600`}
    >
      {`${name}: ${value}`}
      <i
        className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
        onClick={onRemove}
      ></i>
    </span>
  );
};

export default FilterBadge;
