import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link, navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";
import SearchInput from "@/components/Common/SearchInput";
import { SectionHeader } from "@/components/Common/SectionHeader";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import OrganizationLayout, {
  type RouteContext,
} from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
  routeContext?: RouteContext;
}

export default function OrganizationPatients({
  id,
  navOrganizationId,
  routeContext,
}: Props) {
  const { t } = useTranslation();

  const { qParams, Pagination, advancedFilter, resultsPerPage, updateQuery } =
    useFilters({ limit: 15, disableCache: true });

  const [organization, setOrganization] = useState<Organization | null>(null);

  const searchOptions = [
    {
      key: "name",
      type: "text" as const,
      placeholder: t("search_by_patient_name"),
      value: qParams.name || "",
      display: t("name"),
    },
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: t("search_by_phone_number"),
      value: qParams.phone_number || "",
      display: t("phone_number"),
    },
  ];

  const handleSearch = useCallback((key: string, value: string) => {
    const searchParams = {
      name: key === "name" ? value : "",
      phone_number:
        key === "phone_number"
          ? value.length >= 13 || value === ""
            ? value
            : undefined
          : undefined,
    };
    updateQuery(searchParams);
  }, []);

  const handleFieldChange = () => {
    updateQuery({
      name: undefined,
      phone_number: undefined,
    });
  };

  const { data: patients, isFetching } = useQuery({
    queryKey: ["organizationPatients", id, qParams],
    queryFn: query.debounced(organizationApi.listPatients, {
      pathParams: { id },
      queryParams: {
        ...(organization?.org_type === "govt" && { organization: id }),
        page: qParams.page || 1,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        ...advancedFilter.filter,
      },
    }),
    enabled: !!id && !!organization,
  });

  if (!id) {
    return null;
  }

  return (
    <OrganizationLayout
      id={id}
      navOrganizationId={navOrganizationId}
      setOrganization={setOrganization}
      routeContext={routeContext}
    >
      {() => {
        return (
          <div className="space-y-4">
            <SectionHeader
              title={t("patients")}
              description={t("organization_patients_description")}
              count={patients?.count}
              isFetching={isFetching}
            />
            <Frame>
              <FrameHeader className="p-1 md:p-2">
                <SearchInput
                  options={searchOptions}
                  onSearch={handleSearch}
                  onFieldChange={handleFieldChange}
                  selectorVariant="select"
                  className="w-full sm:max-w-xl"
                />
              </FrameHeader>
              <FramePanel className="overflow-hidden p-0 **:data-[slot=table-container]:rounded-none **:data-[slot=table-container]:border-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4">{t("patient")}</TableHead>
                      <TableHead className="px-4">{t("phone")}</TableHead>
                      <TableHead className="px-4">{t("gender")}</TableHead>
                      <TableHead className="px-4">
                        {t("last_modified")}
                      </TableHead>
                      <TableHead className="px-4">
                        <span className="sr-only">{t("actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-background">
                    {isFetching ? (
                      Array.from({ length: 5 }, (_, index) => (
                        <TableRow key={index} aria-hidden="true">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="size-9 rounded-md" />
                              <Skeleton className="h-4 w-36" />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Skeleton className="h-4 w-28" />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Skeleton className="ml-auto h-12 w-20 md:h-10" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !patients?.results?.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="p-6 text-center text-sm text-muted-foreground"
                        >
                          {t("no_patients_found")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      patients.results.map((patient) => {
                        const patientUrl = `/patient/${patient.id}`;
                        return (
                          <TableRow
                            key={patient.id}
                            onClick={() => navigate(patientUrl)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={patient.name || ""}
                                  className="size-9 shrink-0"
                                />
                                <span className="font-semibold text-foreground">
                                  {patient.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {formatPhoneNumberIntl(patient.phone_number) ||
                                patient.phone_number}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {t(`GENDER__${patient.gender}`)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground">
                              <RelativeDateTooltip
                                date={patient.modified_date}
                              />
                            </TableCell>
                            <TableCell
                              className="px-4 py-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="tertiary" asChild>
                                <Link
                                  href={patientUrl}
                                  aria-label={`${t("open")} ${patient.name}`}
                                >
                                  {t("open")}
                                  <ChevronRight data-icon="inline-end" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </FramePanel>
            </Frame>
            <Pagination totalCount={patients?.count ?? 0} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
