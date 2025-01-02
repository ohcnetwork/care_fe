import { useState } from "react";

interface Filters {
  district: string;
  local_body: string;
  page: string;
  limit: string;
  [key: string]: string;
}

interface Props {
  initialFilters: Filters;
  qParams: Partial<Filters>;
}

export function useFacilityFilters({ initialFilters }: Props) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  return {
    filters,
    setFilters,
  };
}
