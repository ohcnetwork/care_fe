import { useQuery } from "@tanstack/react-query";

import { HttpMethod, Type } from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

import { Patient } from "../emr/newPatient";
import { Organization, OrganizationUserRole } from "./organization";

const organizationApi = {
  listMine: {
    path: "/api/v1/organization/mine/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  list: {
    path: "/api/v1/organization/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  get: {
    path: "/api/v1/organization/{id}/",
    method: HttpMethod.GET,
    TRes: Type<Organization>(),
  },
  listUsers: {
    path: "/api/v1/organization/{id}/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<OrganizationUserRole>>(),
  },
  assignUser: {
    path: "/api/v1/organization/{id}/users/",
    method: HttpMethod.POST,
    TRes: Type<OrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  updateUserRole: {
    path: "/api/v1/organization/{id}/users/{userRoleId}/",
    method: HttpMethod.PUT,
    TRes: Type<OrganizationUserRole>(),
    TBody: Type<{ user: string; role: string }>(),
  },
  removeUserRole: {
    path: "/api/v1/organization/{id}/users/{userRoleId}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  listPatients: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Patient>>(),
  },
  getPublicOrganizations: {
    path: "/api/v1/govt/organization/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Organization>>(),
  },
  getPublicOrganization: {
    path: "/api/v1/govt/organization/{id}/",
    method: HttpMethod.GET,
    TRes: Type<Organization>(),
  },
};

export function useFetchOrganizationByName(name: string, parentId?: string) {
  return useQuery({
    queryKey: ["organization", name, parentId],
    queryFn: async () => {
      const data = await query(organizationApi.list, {
        queryParams: {
          org_type: "govt",
          parent: parentId || "",
          name: name,
        },
      })({ signal: new AbortController().signal });

      return data.results?.[0] || null;
    },
    enabled: name != undefined,
  });
}

export default organizationApi;
