import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Patient } from "@/types/emr/newPatient";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationPatients({ id, navOrganizationId }: Props) {
  const { t } = useTranslation();
  const { qParams, Pagination, advancedFilter, resultsPerPage, updateQuery } =
    useFilters({ limit: 14, cacheBlacklist: ["patient"] });
  const [organization, setOrganization] = useState<Organization | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["organizationPatients", id, qParams],
    queryFn: query.debounced(organizationApi.listPatients, {
      pathParams: { id },
      queryParams: {
        ...(organization?.org_type === "govt" && { organization: id }),
        page: qParams.page,
        limit: resultsPerPage,
        offset: (qParams.page - 1) * resultsPerPage,
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{t("patients")}</h2>
        </div>

        <SearchByMultipleFields
          id="patient-search"
          options={[
            {
              key: "name",
              type: "text",
              placeholder: "Search by name",
              value: qParams.name || "",
              shortcutKey: "n",
            },
            {
              key: "phone_number",
              type: "phone",
              placeholder: "Search by phone number",
              value: qParams.phone_number || "",
              shortcutKey: "p",
            },
          ]}
          onSearch={(key, value) => {
            const searchParams = {
              name: key === "name" ? value : "",
              phone_number: key === "phone_number" ? value : "",
              page: 1,
            };
            updateQuery(searchParams);
          }}
          clearSearch={{ value: !qParams.name && !qParams.phone_number }}
          onFieldChange={(option) => {
            const clearParams = {
              name: option.key === "name" ? qParams.name || "" : "",
              phone_number:
                option.key === "phone_number" ? qParams.phone_number || "" : "",
              page: 1,
            };
            updateQuery(clearParams);
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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
                          <div className="text-gray-500">Phone</div>
                          <div className="font-medium">
                            {patient.phone_number}
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-500">Gender</div>
                          <div className="font-medium">{patient.gender}</div>
                        </div>
                        {patient.geo_organization && (
                          <div className="col-span-2 text-sm">
                            <div className="text-gray-500">Organization</div>
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
    </OrganizationLayout>
  );
}
