import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSidebar } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";

import useBreakpoints from "@/hooks/useBreakpoints";
import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import roleApi from "@/types/emr/role/roleApi";

export function RolesIndex() {
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

  const sidebar = useSidebar();

  const [tableDimensions, setTableDimensions] = useState({
    width: 0,
    height: 0,
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
  const isMobile = useBreakpoints({ default: true, md: false });

  useEffect(() => {
    // calculate table dimensions on resize
    const handleResize = () => {
      setTableDimensions({
        width:
          window.innerWidth -
          (!isMobile ? (sidebar.state === "expanded" ? 340 : 130) : 40),
        height: window.innerHeight - (isMobile ? 200 : 150),
      });
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile, sidebar.state]);

  return (
    <Page title="Roles">
      <p className="text-gray-600">{t("manage_and_view_roles")}</p>

      <div
        className={`overflow-auto mt-4`}
        style={{
          ...tableDimensions,
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:sticky bg-gray-50 left-0 z-20 whitespace-nowrap">
                {t("permission")}
              </TableHead>
              {roles.map((role) => (
                <TableHead
                  key={role.id}
                  className="whitespace-nowrap h-[120px] max-w-[30px] min-w-[30px] sticky top-0 z-10 "
                >
                  <div className="text-sm transform -rotate-90 w-[100px] px-2 origin-center -translate-x-1/3">
                    {role.name}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPermissions.map((permission) => (
              <TableRow key={permission.slug}>
                <TableCell className="md:sticky left-0 z-10 max-w-[200px] bg-gray-50 font-medium">
                  {permission.name}
                </TableCell>
                {roles.map((role) => {
                  const hasPermission = role.permissions.some(
                    (p) => p.slug === permission.slug,
                  );

                  return (
                    <TableCell key={role.id} className="bg-white">
                      <div className=" max-w-[30px]  min-w-[30px] flex items-center justify-center">
                        {hasPermission ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination totalCount={response?.count ?? 0} />
    </Page>
  );
}
