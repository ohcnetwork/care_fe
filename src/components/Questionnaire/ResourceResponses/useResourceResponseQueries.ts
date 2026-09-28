import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import type { PaginatedResponse } from "@/Utils/request/types";
import type { DeviceDetail } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";
import type { FacilityRead } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import type { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import resourceQuestionnaireResponseApi, {
  type ResourceQuestionnaireResponse,
} from "@/types/questionnaire/resourceQuestionnaireResponseApi";

import type { ResourceResponseFilterValues } from "./ResourceResponseFilters";
import type { ResourceResponseSubjectType } from "./types";

interface ResourceResponseQueriesOptions {
  facilityId: string;
  subjectType: ResourceResponseSubjectType;
  subjectId: string;
  subjectName?: string;
  page: number;
  pageSize: number;
  responseId?: string;
  filters: ResourceResponseFilterValues;
}

/** Load the subject first so a denied resource never exposes its response history. */
export function useResourceResponseQueries({
  facilityId,
  subjectType,
  subjectId,
  subjectName,
  page,
  pageSize,
  responseId,
  filters,
}: ResourceResponseQueriesOptions) {
  const subjectQuery = useQuery<LocationRead | DeviceDetail | FacilityRead>({
    queryKey:
      subjectType === "facility"
        ? ["facility", facilityId]
        : [subjectType, facilityId, subjectId],
    queryFn: ({ signal }) => {
      if (subjectType === "facility") {
        return query(facilityApi.get, {
          pathParams: { facilityId },
        })({ signal });
      }
      if (subjectType === "location") {
        return query(locationApi.get, {
          pathParams: { facility_id: facilityId, id: subjectId },
        })({ signal });
      }
      return query(deviceApi.retrieve, {
        pathParams: { facility_id: facilityId, id: subjectId },
      })({ signal });
    },
  });
  const resolvedSubjectName =
    subjectName ??
    (subjectQuery.data &&
      ("name" in subjectQuery.data
        ? subjectQuery.data.name
        : subjectQuery.data.registered_name));
  const responsesQuery = useQuery<
    PaginatedResponse<ResourceQuestionnaireResponse>
  >({
    queryKey: [
      "resourceResponses",
      facilityId,
      subjectType,
      subjectId,
      {
        page,
        questionnaire: filters.questionnaire,
        created_by: filters.createdBy,
        status: filters.status,
      },
    ],
    queryFn: query(resourceQuestionnaireResponseApi.list, {
      queryParams: {
        subject_type: subjectType,
        subject_id: subjectId,
        questionnaire: filters.questionnaire,
        created_by: filters.createdBy,
        status: filters.status,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
    }),
    enabled: !!subjectQuery.data && !subjectQuery.isError,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === facilityId &&
      previousQuery.queryKey[2] === subjectType &&
      previousQuery.queryKey[3] === subjectId
        ? previousData
        : undefined,
  });
  const responses = responsesQuery.data?.results ?? [];
  const responseFromList = responses.find(
    (response) => response.id === responseId,
  );
  const detailQuery = useQuery({
    queryKey: [
      "resourceResponses",
      facilityId,
      subjectType,
      subjectId,
      "detail",
      responseId,
    ],
    queryFn: query(resourceQuestionnaireResponseApi.get, {
      pathParams: { id: responseId ?? "" },
      queryParams: { subject_type: subjectType, subject_id: subjectId },
    }),
    enabled:
      !!responseId &&
      !!subjectQuery.data &&
      !subjectQuery.isError &&
      !responseFromList,
    retry: false,
  });
  const selectedResponse = responseFromList ?? detailQuery.data ?? null;
  const selectedIndex = responses.findIndex(
    (response) => response.id === responseId,
  );
  return {
    subjectQuery,
    resolvedSubjectName,
    responsesQuery,
    responses,
    responseFromList,
    detailQuery,
    selectedResponse,
    selectedIndex,
  };
}
