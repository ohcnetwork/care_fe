import { useQuery } from "@tanstack/react-query";

import { FacilityModel } from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { PaginatedResponse, RequestResult } from "@/Utils/request/types";

interface Filters {
  district: string;
  local_body: string;
  page: string;
  limit: string;
  [key: string]: string;
}

export function useFacilityQueries(filters: Filters) {
  const { data: facilitiesResponse, isLoading } = useQuery<
    RequestResult<PaginatedResponse<FacilityModel>>
  >({
    queryKey: ["facilities", filters],
    queryFn: () =>
      request(routes.getAllFacilities, {
        query: filters,
      }),
  });

  return {
    facilities: facilitiesResponse?.data?.results || [],
    isLoading,
    totalCount: facilitiesResponse?.data?.count || 0,
  };
}
