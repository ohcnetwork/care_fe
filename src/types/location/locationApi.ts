import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";

import {
  LocationAssociation,
  LocationAssociationRequest,
  LocationAssociationUpdate,
} from "./association";
import { LocationDetail, LocationList, LocationWrite } from "./location";

export default {
  list: {
    path: "/api/v1/facility/{facility_id}/location/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<LocationList>>(),
  },
  get: {
    path: "/api/v1/facility/{facility_id}/location/{id}/",
    method: HttpMethod.GET,
    TRes: Type<LocationDetail>(),
  },
  create: {
    path: "/api/v1/facility/{facility_id}/location/",
    method: HttpMethod.POST,
    TRes: Type<LocationDetail>(),
    TBody: Type<LocationWrite>(),
  },
  update: {
    path: "/api/v1/facility/{facility_id}/location/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<LocationDetail>(),
    TBody: Type<LocationWrite>(),
  },
  getOrganizations: {
    path: "/api/v1/facility/{facility_id}/location/{id}/organizations",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityOrganization>>(),
  },
  addOrganization: {
    path: "/api/v1/facility/{facility_id}/location/{id}/organizations_add/",
    method: HttpMethod.POST,
    TRes: Type<LocationDetail>(),
    TBody: Type<{ organization: string }>(),
  },
  removeOrganization: {
    path: "/api/v1/facility/{facility_id}/location/{id}/organizations_remove/",
    method: HttpMethod.POST,
    TRes: Type<LocationDetail>(),
    TBody: Type<{ organization: string }>(),
  },
  listAssociations: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/association/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<LocationAssociation>>(),
  },
  createAssociation: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/association/",
    method: HttpMethod.POST,
    TRes: Type<LocationAssociation>(),
    TBody: Type<LocationAssociationRequest>(),
  },
  getAssociation: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/association/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<LocationAssociation>(),
  },
  updateAssociation: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/association/{external_id}/",
    method: HttpMethod.PUT,
    TRes: Type<LocationAssociation>(),
    TBody: Type<LocationAssociationUpdate>(),
  },
  deleteAssociation: {
    path: "/api/v1/facility/{facility_external_id}/location/{location_external_id}/association/{external_id}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
};
