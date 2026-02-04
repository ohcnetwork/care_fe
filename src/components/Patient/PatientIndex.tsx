import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SearchInput from "@/components/Common/SearchInput";

import { getPermissions } from "@/common/Permissions";
import { GENDER_TYPES } from "@/common/constants";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { PLUGIN_Component } from "@/PluginEngine";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { usePermissions } from "@/context/PermissionContext";
import { useShortcuts, useShortcutSubContext } from "@/context/ShortcutContext";
import { cn } from "@/lib/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getPartialId,
  PartialPatientModel,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import careConfig from "@careConfig";
import { TFunction } from "i18next";

export default function PatientIndex({ facilityId }: { facilityId: string }) {
  useShortcutSubContext("patient:search:-global");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<
    PartialPatientModel | PatientRead | null
  >(null);
  const [actionOnVerify, setActionOnVerify] = useState<
    "schedule" | "create_encounter" | undefined
  >(undefined);
  const shortcuts = useShortcuts();
  const [qParams] = useQueryParams();
  const [verificationOpen, setVerificationOpen] = useState(false);
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const { facility } = useCurrentFacility();

  // Combine instance and facility identifier configs
  const allIdentifierConfigs = useMemo(
    () => [
      ...(facility?.patient_instance_identifier_configs || []),
      ...(facility?.patient_facility_identifier_configs || []),
    ],
    [
      facility?.patient_instance_identifier_configs,
      facility?.patient_facility_identifier_configs,
    ],
  );

  const { canCreatePatient } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  // Track identifier search state
  const [identifierSearch, setIdentifierSearch] = useState<{
    config?: string;
    value?: string;
  }>({});

  const handleSearch = useCallback((key: string, value: string) => {
    setIdentifierSearch({ config: key, value });
  }, []);

  const { data: patientList, isFetching } = useQuery({
    queryKey: ["patient-search", facilityId, identifierSearch],
    queryFn: query.debounced(patientApi.search, {
      body: {
        config: identifierSearch.config,
        value: identifierSearch.value,
        page_size: 20,
      },
    }),
    enabled: !!(identifierSearch.config && identifierSearch.value),
  });

  const navigateToVerify = (
    patient: PartialPatientModel | PatientRead,
    yearOfBirth?: string,
    action?: "schedule" | "create_encounter",
  ) => {
    navigate(`/facility/${facilityId}/patients/verify`, {
      query: {
        config: identifierSearch.config,
        value: identifierSearch.value,
        phone_number: patient.phone_number,
        year_of_birth:
          yearOfBirth ||
          (patient as PatientRead).year_of_birth?.toString() ||
          "",
        partial_id: getPartialId(patient),
        ...(action ? { action } : {}),
      },
    });
  };

  const handlePatientSelect = (index: number) => {
    const patient = patientList?.results[index];
    if (!patient) {
      return;
    }
    if (patientList?.partial) {
      setSelectedPatient(patient);
      setVerificationOpen(true);
      setYearOfBirth("");
      setActionOnVerify(undefined);
    } else {
      navigateToVerify(patient);
    }
  };

  const handleScheduleAppointment = (index: number) => {
    const patient = patientList?.results[index];
    if (!patient) {
      return;
    }
    if (patientList?.partial) {
      setSelectedPatient(patient);
      setVerificationOpen(true);
      setYearOfBirth("");
      setActionOnVerify("schedule");
    } else {
      navigateToVerify(patient, undefined, "schedule");
    }
  };

  const handleCreateEncounter = (index: number) => {
    const patient = patientList?.results[index];
    if (!patient) {
      return;
    }
    if (patientList?.partial) {
      setSelectedPatient(patient);
      setVerificationOpen(true);
      setYearOfBirth("");
      setActionOnVerify("create_encounter");
    } else {
      navigateToVerify(patient, undefined, "create_encounter");
    }
  };

  const handleVerify = () => {
    if (!selectedPatient || yearOfBirth.length !== 4) {
      toast.error(t("valid_year_of_birth"));
      return;
    }
    navigateToVerify(selectedPatient, yearOfBirth, actionOnVerify);
  };

  useEffect(() => {
    shortcuts.setIgnoreInputFields(true);
    return () => shortcuts.setIgnoreInputFields(false);
  }, [shortcuts]);

  useEffect(() => {
    if (!facility) {
      return;
    }

    const phoneNumberConfig = getPhoneNumberConfig(allIdentifierConfigs);

    if (qParams.phone_number && phoneNumberConfig) {
      setIdentifierSearch({
        config: phoneNumberConfig.id,
        value: qParams.phone_number,
      });
    }
  }, [qParams.phone_number, facility, allIdentifierConfigs]);

  return (
    <div>
      <div className="container max-w-5xl mx-auto py-6">
        {canCreatePatient && (
          <div className="flex max-md:flex-col justify-center md:justify-end gap-4">
            <PLUGIN_Component
              __name="PatientSearchActions"
              facilityId={facilityId}
              className={cn(
                buttonVariants({ variant: "primary_gradient" }),
                "w-full",
              )}
            />
            <AddPatientButton
              facilityId={facilityId}
              identifierConfigs={allIdentifierConfigs}
              identifierSearch={identifierSearch}
            />
          </div>
        )}
        <div className="space-y-6 mt-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("search_patients")}
            </h1>
            <p className="text-gray-500">
              {canCreatePatient
                ? t("search_patient_page_text")
                : t("search_only_patient_page_text")}
            </p>
          </div>

          <div>
            <div className="space-y-6">
              <SearchInput
                options={getSearchOptions(
                  t,
                  identifierSearch,
                  allIdentifierConfigs,
                )}
                onSearch={handleSearch}
                className="w-full"
                autoFocus
              />

              <div className="min-h-[200px]" id="patient-search-results">
                {!!identifierSearch.config && !!identifierSearch.value && (
                  <>
                    {isFetching || !patientList ? (
                      <TableSkeleton count={5} />
                    ) : !patientList.results.length ? (
                      <div>
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <h3 className="text-lg font-semibold">
                            {t("no_patient_record_found")}
                          </h3>
                          <p className="text-sm text-gray-500 mb-6">
                            {t("no_patient_record_text", {
                              text: getSearchOptions(
                                t,
                                identifierSearch,
                                allIdentifierConfigs,
                              ).find(
                                (opt) => opt.key === identifierSearch.config,
                              )?.display,
                            })}
                          </p>
                          <AddPatientButton
                            facilityId={facilityId}
                            outline
                            identifierConfigs={allIdentifierConfigs}
                            identifierSearch={identifierSearch}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">
                                {t("patient_name")}
                              </TableHead>
                              <TableHead>{t("phone_number")}</TableHead>
                              <TableHead>{t("gender")}</TableHead>
                              <TableHead className="w-[220px]">
                                {t("actions")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patientList.results.map((patient, index) => (
                              <TableRow
                                key={patient.id}
                                className="cursor-pointer"
                                onClick={() => handlePatientSelect(index)}
                              >
                                <TableCell className="font-medium">
                                  {patient.name}
                                  {!patientList?.partial && (
                                    <p className="text-xs text-gray-500 text-wrap line-clamp-2">
                                      {"address" in patient && patient.address}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatPhoneNumberIntl(patient.phone_number)}
                                </TableCell>
                                <TableCell>
                                  {
                                    GENDER_TYPES.find(
                                      (g) => g.id === patient.gender,
                                    )?.text
                                  }
                                </TableCell>
                                <TableCell>
                                  <div
                                    className="flex"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="outline"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleScheduleAppointment(index);
                                      }}
                                      className="flex-1 rounded-r-none border-r-0"
                                    >
                                      {t("schedule_appointment")}
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                          }}
                                          className="rounded-l-none"
                                        >
                                          <ChevronDown className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleScheduleAppointment(index);
                                          }}
                                        >
                                          {t("schedule_appointment")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleCreateEncounter(index);
                                          }}
                                        >
                                          {t("create_encounter")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handlePatientSelect(index);
                                          }}
                                        >
                                          {t("patient_home")}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("verify_patient_identity")}</DialogTitle>
            <DialogDescription>
              {t("patient_birth_year_for_identity")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              inputMode="numeric"
              placeholder={`${t("year_of_birth")} (YYYY)`}
              value={yearOfBirth}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setYearOfBirth(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleVerify();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerificationOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleVerify}>{t("verify")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const getSearchOptions = (
  t: TFunction,
  searchIdentifier: { config?: string; value?: string },
  configs: PatientIdentifierConfig[],
) => {
  // Phone number configs first, followed by auto-maintained configs, and then non-auto-maintained configs
  return [
    // Phone number configs
    ...configs.filter(
      ({ config }) =>
        config.auto_maintained &&
        config.system === careConfig.phoneNumberConfigSystem,
    ),
    // Auto-maintained configs but not phone number configs
    ...configs.filter(
      ({ config }) =>
        config.auto_maintained &&
        config.system !== careConfig.phoneNumberConfigSystem,
    ),
    // Non-auto-maintained configs
    ...configs.filter((c) => !c.config.auto_maintained),
  ].map((c) => ({
    key: c.id,
    type:
      c.config.system === careConfig.phoneNumberConfigSystem
        ? ("phone" as const)
        : ("text" as const),
    placeholder: t("search_by_identifier", { name: c.config.display }),
    value:
      searchIdentifier.config === c.id ? (searchIdentifier.value ?? "") : "",
    display: c.config.display,
  }));
};

const getPhoneNumberConfig = (identifierConfigs: PatientIdentifierConfig[]) => {
  return identifierConfigs.find(
    (c) => c.config.system === careConfig.phoneNumberConfigSystem,
  );
};

const getPhoneNumberFromIdentifierSearch = (
  identifierConfigs: PatientIdentifierConfig[],
  identifierSearch: { config?: string; value?: string },
) => {
  const phoneNumberConfig = getPhoneNumberConfig(identifierConfigs);

  if (phoneNumberConfig && identifierSearch.config === phoneNumberConfig.id) {
    return identifierSearch.value;
  }

  return undefined;
};

function AddPatientButton({
  facilityId,
  outline,
  identifierConfigs,
  identifierSearch,
}: {
  facilityId: string;
  outline?: boolean;
  identifierConfigs: PatientIdentifierConfig[];
  identifierSearch?: { config?: string; value?: string };
}) {
  const { t } = useTranslation();

  const phoneNumber =
    identifierSearch &&
    getPhoneNumberFromIdentifierSearch(identifierConfigs, identifierSearch);

  return (
    <Button
      variant={outline ? "outline" : "primary_gradient"}
      className="gap-3 group"
      onClick={() =>
        navigate(`/facility/${facilityId}/patient/create`, {
          query: phoneNumber ? { phone_number: phoneNumber } : undefined,
        })
      }
      data-shortcut-id="submit-action"
    >
      <CareIcon icon="l-plus" className="size-4" />
      {t("add_new_patient")}
      <ShortcutBadge actionId="submit-action" className="bg-white" />
    </Button>
  );
}
