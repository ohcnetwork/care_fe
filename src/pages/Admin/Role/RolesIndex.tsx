import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import roleApi from "@/types/emr/role/roleApi";

export function RolesIndex() {
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { data: response } = useQuery({
    queryKey: ["roles", qParams],
    queryFn: query(roleApi.listRoles, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.name,
      },
    }),
  });

  const roles = response?.results || [];
  const allPermissions = roles.reduce(
    (acc, role) => {
      role.permissions.forEach((permission) => {
        if (!acc.find((p) => p.slug === permission.slug)) {
          acc.push(permission);
        }
      });
      return acc;
    },
    [] as (typeof roles)[0]["permissions"],
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 px-4 md:px-0">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-gray-600">Manage and view roles</p>
        </div>

        <Card className="overflow-auto">
          <div className="min-w-full px-4">
            {/* Header Row */}
            <div className="grid grid-cols-[400px_repeat(auto-fill,minmax(50px,1fr))] border-b sticky top-0 bg-background z-10">
              <div className="sticky left-0 bg-background p-2 font-medium flex items-center justify-start">
                Permission
              </div>
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-2 text-center h-[150px] flex items-center justify-center"
                >
                  <div className="transform -rotate-90 origin-center whitespace-nowrap">
                    {role.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Permission Rows */}
            {allPermissions.map((permission) => (
              <div
                key={permission.slug}
                className="grid grid-cols-[400px_repeat(auto-fill,minmax(50px,1fr))] border-b"
              >
                <div className="sticky left-0 bg-background p-2 font-medium">
                  {permission.name}
                </div>
                {roles.map((role) => {
                  const hasPermission = role.permissions.some(
                    (p) => p.slug === permission.slug,
                  );
                  return (
                    <div
                      key={`${permission.slug}-${role.id}`}
                      className="p-2 text-center flex items-center justify-center"
                    >
                      {hasPermission ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
