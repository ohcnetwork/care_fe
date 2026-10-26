import { Badge } from "@/components/ui/badge";

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
  if (!value) return null;
  return (
    <Badge variant="outline" onClose={onRemove}>
      {`${name}: ${value}`}
    </Badge>
  );
};

export default FilterBadge;
