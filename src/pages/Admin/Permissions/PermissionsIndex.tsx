import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import roleApi from "@/types/emr/role/roleApi";

export function PermissionsIndex() {
  const { t } = useTranslation();
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
    <Page title={t("roles")}>
      <p className="text-gray-600 px-3 mb-3 md:px-0">
        {t("manage_and_view_roles")}
      </p>

      <div className="overflow-auto h-[calc(100vh-12rem)] md:h-[calc(100vh-9rem)]">
        <div className="relative w-full p-1">
          <table className="w-full caption-bottom text-sm rounded-lg shadow-md z-20">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 left-0 z-20 whitespace-nowrap bg-white font-semibold">
                  {t("permission")}
                </TableHead>
                {roles.map((role) => (
                  <TableHead
                    key={role.id}
                    className="whitespace-nowrap h-32 max-w-8 min-w-8 sticky top-0 z-10 bg-white font-semibold"
                  >
                    <div className="text-sm transform -rotate-90 w-24 px-2 -translate-x-1/3">
                      {role.name}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((permission) => (
                <TableRow
                  key={permission.slug}
                  className="even:bg-gray-100 odd:bg-gray-50 hover:bg-gray-100"
                >
                  <TableCell className="sticky left-0 z-10 max-w-48 font-semibold bg-inherit whitespace-normal">
                    {permission.name}
                  </TableCell>
                  {roles.map((role) => {
                    const hasPermission = role.permissions.some(
                      (p) => p.slug === permission.slug,
                    );

                    return (
                      <TableCell key={role.id}>
                        <div className="w-8 flex items-center justify-center">
                          {hasPermission ? (
                            <CheckCircle2 className="size-5 text-green-500" />
                          ) : (
                            <XCircle className="size-5 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      </div>
      <Pagination totalCount={response?.count ?? 0} />
    </Page>
  );
}
