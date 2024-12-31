import { useQuery } from "@tanstack/react-query";

import { DistrictModel, LocalBodyModel } from "@/components/Facility/models";
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

  const { data: districtResponse } = useQuery<RequestResult<DistrictModel>>({
    queryKey: ["district", filters.district],
    queryFn: () =>
      request(routes.getDistrict, {
        pathParams: { id: filters.district },
      }),
    enabled: !!filters.district,
  });

  const { data: localBodyResponse } = useQuery<RequestResult<LocalBodyModel>>({
    queryKey: ["localBody", filters.local_body],
    queryFn: () =>
      request(routes.getLocalBody, {
        pathParams: { id: filters.local_body },
      }),
    enabled: !!filters.local_body,
  });

  return {
    facilities: facilitiesResponse?.data?.results || [],
    isLoading,
    totalCount: facilitiesResponse?.data?.count || 0,
    district: districtResponse?.data,
    localBody: localBodyResponse?.data,
  };
}
