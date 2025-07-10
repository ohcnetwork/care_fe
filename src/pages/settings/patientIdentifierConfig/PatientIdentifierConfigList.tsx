import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  PATIENT_IDENTIFIER_CONFIG_STATUS_COLORS,
  PatientIdentifierConfig,
  PatientIdentifierConfigCreate,
  PatientIdentifierConfigStatus,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import patientIdentifierConfigApi from "@/types/patient/patientIdentifierConfig/patientIdentifierConfigApi";

import PatientIdentifierConfigForm from "./PatientIdentifierConfigForm";

function PatientIdentifierConfigCard({
  config,
  onEdit,
}: {
  config: PatientIdentifierConfig;
  onEdit: (config: PatientIdentifierConfig) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={PATIENT_IDENTIFIER_CONFIG_STATUS_COLORS[config.status]}
              >
                {t(config.status)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">
              {config.config.display}
            </h3>
            {config.config.system && (
              <p className="mt-1 text-sm text-gray-500">
                {config.config.system} | {config.config.use}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
            <CareIcon icon="l-edit" className="size-4" />
            {t("edit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientIdentifierConfigList({
  facilityId,
}: {
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const [selectedConfig, setSelectedConfig] = React.useState<
    PatientIdentifierConfig | PatientIdentifierConfigCreate | null
  >(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["patientIdentifierConfig", qParams, facilityId],
    queryFn: query.debounced(
      patientIdentifierConfigApi.listPatientIdentifierConfig,
      {
        queryParams: {
          ...(facilityId && { facility: facilityId }),
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
          search: qParams.search,
          status: qParams.status,
          ordering: "-created_date",
        },
      },
    ),
  });

  const configs = response?.results || [];

  const handleEdit = (config: PatientIdentifierConfig) => {
    setSelectedConfig(config);
  };

  const handleAdd = () => {
    setSelectedConfig(null);
  };

  const handleSheetClose = () => {
    setSelectedConfig(null);
  };

  return (
    <Page title={t("patient_identifier_config")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("patient_identifier_config")}
          </h1>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {facilityId
                  ? t("manage_patient_identifier_config")
                  : t("manage_instance_patient_identifier_config")}
              </p>
            </div>
            <Sheet
              open={!!selectedConfig}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedConfig(null);
                } else {
                  setSelectedConfig({
                    config: {
                      use: PatientIdentifierUse.usual,
                      description: "",
                      system: "",
                      required: false,
                      unique: false,
                      regex: "",
                      display: "",
                      retrieve_config: {
                        retrieve_with_dob: false,
                        retrieve_with_year_of_birth: false,
                        retrieve_with_otp: false,
                      },
                    },
                    status: PatientIdentifierConfigStatus.draft,
                    facility: facilityId || undefined,
                  });
                }
              }}
            >
              <SheetTrigger asChild>
                <Button onClick={handleAdd}>
                  <CareIcon icon="l-plus" className="mr-2" />
                  {t("add_patient_identifier_config")}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {selectedConfig && "id" in selectedConfig
                      ? t("edit_patient_identifier_config")
                      : t("add_patient_identifier_config")}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 pb-6">
                  <PatientIdentifierConfigForm
                    facilityId={facilityId}
                    configId={
                      selectedConfig && "id" in selectedConfig
                        ? selectedConfig.id
                        : undefined
                    }
                    onSuccess={handleSheetClose}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_configs")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(PatientIdentifierConfigStatus)}
                  label={t("status")}
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : configs.length === 0 ? (
          <EmptyState
            icon="l-folder-open"
            title={t("no_configs_found")}
            description={t("adjust_config_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {configs.map((config: PatientIdentifierConfig) => (
                <PatientIdentifierConfigCard
                  key={config.id}
                  config={config}
                  onEdit={handleEdit}
                />
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("display")}</TableHead>
                      <TableHead>{t("system")}</TableHead>
                      <TableHead>{t("use")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {configs.map((config: PatientIdentifierConfig) => (
                      <TableRow key={config.id} className="divide-x">
                        <TableCell className="font-medium">
                          {config.config.display}
                        </TableCell>
                        <TableCell>{config.config.system}</TableCell>
                        <TableCell>{config.config.use}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              PATIENT_IDENTIFIER_CONFIG_STATUS_COLORS[
                                config.status
                              ]
                            }
                          >
                            {t(config.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                          >
                            <CareIcon icon="l-edit" className="size-4" />
                            {t("edit")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
