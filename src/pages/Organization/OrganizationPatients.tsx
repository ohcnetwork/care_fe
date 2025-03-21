import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Patient } from "@/types/emr/newPatient";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import EntityBadge from "./components/EntityBadge";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationPatients({ id, navOrganizationId }: Props) {
  const { t } = useTranslation();

  const { qParams, Pagination, advancedFilter, resultsPerPage, updateQuery } =
    useFilters({ limit: 15, disableCache: true });

  const [organization, setOrganization] = useState<Organization | null>(null);

  const searchOptions = [
    {
      key: "name",
      type: "text" as const,
      placeholder: "Search by name",
      value: qParams.name || "",
    },
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: "Search by phone number",
      value: qParams.phone_number || "",
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
        page: qParams.page,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
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
    >
      {() => {
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="mt-1 flex flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0">
                <EntityBadge
                  title={t("patients")}
                  count={patients?.count}
                  isFetching={isFetching}
                  translationParams={{ entity: "Patient" }}
                />
              </div>
            </div>

            <SearchByMultipleFields
              id="patient-search"
              options={searchOptions}
              initialOptionIndex={Math.max(
                searchOptions.findIndex((option) => option.value !== ""),
                0,
              )}
              onSearch={handleSearch}
              onFieldChange={handleFieldChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isFetching ? (
                <CardGridSkeleton count={6} />
              ) : patients?.results?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {t("no_patients_found")}
                  </CardContent>
                </Card>
              ) : (
                patients?.results?.map((patient: Patient) => (
                  <Link
                    key={patient.id}
                    href={`/patient/${patient.id}`}
                    className="block"
                  >
                    <Card className="h-full hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <Avatar
                                name={patient.name || ""}
                                className="h-10 w-10"
                              />
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  {patient.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {patient.phone_number}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              asChild
                            >
                              <div>
                                <CareIcon
                                  icon="l-arrow-up-right"
                                  className="h-4 w-4"
                                />
                              </div>
                            </Button>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="text-sm">
                              <div className="text-gray-500">{t("phone")}</div>
                              <div className="font-medium">
                                {patient.phone_number}
                              </div>
                            </div>
                            <div className="text-sm">
                              <div className="text-gray-500">{t("gender")}</div>
                              <div className="font-medium">
                                {patient.gender}
                              </div>
                            </div>
                            {patient.geo_organization && (
                              <div className="col-span-2 text-sm">
                                <div className="text-gray-500">
                                  {t("organization")}
                                </div>
                                <div className="font-medium">
                                  {patient.geo_organization.name}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <RecordMeta
                              className="text-sm text-gray-500"
                              prefix="Last updated"
                              time={patient.modified_date}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
            <Pagination totalCount={patients?.count ?? 0} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
