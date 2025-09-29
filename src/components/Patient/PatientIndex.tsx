import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";
import SearchInput from "@/components/Common/SearchInput";

import { getPermissions } from "@/common/Permissions";
import { GENDER_TYPES } from "@/common/constants";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getPartialId,
  PartialPatientModel,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";

export default function PatientIndex({ facilityId }: { facilityId: string }) {
  useShortcutSubContext();
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<
    PartialPatientModel | PatientRead | null
  >(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const { facility } = useCurrentFacility();

  const { canCreatePatient } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const handleCreatePatient = useCallback(() => {
    navigate(`/facility/${facilityId}/patient/create`, {
      query: {
        // queryParams,
        // phone_number: qParams.value,
      },
    });
  }, [facilityId]);

  function AddPatientButton({ outline }: { outline?: boolean }) {
    return (
      <Button
        variant={outline ? "outline" : "primary_gradient"}
        className={cn("gap-3 group")}
        onClick={handleCreatePatient}
        data-cy="create-new-patient-button"
        data-shortcut-id="submit-action"
      >
        <CareIcon icon="l-plus" className="size-4" />
        {t("add_new_patient")}
        <ShortcutBadge actionId="submit-action" className="bg-white" />
      </Button>
    );
  }

  // Build search options
  const searchOptions =
    facility?.patient_instance_identifier_configs
      ?.sort((a, _b) => (a.config.auto_maintained ? -1 : 1))
      .map((c) => ({
        key: c.id,
        type:
          c.config.system === "system.care.ohc.network/patient-phone-number"
            ? ("phone" as const)
            : ("text" as const),
        placeholder: t("search_by_identifier", { name: c.config.display }),
        value: "",
        display: c.config.display,
      })) || [];

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
    queryFn: query.debounced(patientApi.searchPatient, {
      body: {
        config: identifierSearch.config,
        value: identifierSearch.value,
        page_size: 20,
      },
    }),
    enabled: !!(identifierSearch.config && identifierSearch.value),
  });

  const handlePatientSelect = (index: number) => {
    const patient = patientList?.results[index];
    if (!patient) {
      return;
    }
    if (patientList && patientList.partial) {
      setSelectedPatient(patient);
      setVerificationOpen(true);
      setYearOfBirth("");
    } else if ("year_of_birth" in patient) {
      navigate(`/facility/${facilityId}/patients/verify`, {
        query: {
          config: identifierSearch.config,
          value: identifierSearch.value,
          phone_number: patient.phone_number,
          year_of_birth: patient.year_of_birth.toString(),
          partial_id: patient.id.slice(0, 5),
        },
      });
    }
  };

  const handleVerify = () => {
    if (!selectedPatient || !yearOfBirth || yearOfBirth.length !== 4) {
      toast.error(t("valid_year_of_birth"));
      return;
    }

    navigate(`/facility/${facilityId}/patients/verify`, {
      query: {
        config: identifierSearch.config,
        value: identifierSearch.value,
        phone_number: selectedPatient.phone_number,
        year_of_birth: yearOfBirth,
        partial_id: getPartialId(selectedPatient),
      },
    });
  };

  return (
    <div>
      <div className="container max-w-5xl mx-auto py-6">
        {canCreatePatient && (
          <div className="flex justify-center md:justify-end">
            <AddPatientButton />
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
                data-cy="patient-search"
                options={searchOptions}
                onSearch={handleSearch}
                className="w-full"
                autoFocus
              />

              <div className="min-h-[200px]" id="patient-search-results">
                {!!identifierSearch.config && !!identifierSearch.value && (
                  <>
                    {isFetching || !patientList ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <Loading />
                      </div>
                    ) : !patientList.results.length ? (
                      <div>
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <h3 className="text-lg font-semibold">
                            {t("no_patient_record_found")}
                          </h3>
                          <p className="text-sm text-gray-500 mb-6">
                            {t("no_patient_record_text")}
                          </p>
                          <AddPatientButton outline />
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
              placeholder={`${t("year_of_birth")} (YYYY)`}
              value={yearOfBirth}
              data-cy="year-of-birth-input"
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setYearOfBirth(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleVerify();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerificationOpen(false)}
              data-cy="cancel-verification-button"
            >
              {t("cancel")}
            </Button>
            <Button
              className="mb-2"
              onClick={handleVerify}
              data-cy="confirm-verification-button"
            >
              {t("verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
