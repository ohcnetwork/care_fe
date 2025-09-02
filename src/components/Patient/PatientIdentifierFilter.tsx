import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getPartialId,
  PartialPatientModel,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";

interface PatientIdentifierFilterProps {
  onSelect: (patientId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  patientId?: string;
}

export default function PatientIdentifierFilter({
  onSelect,
  placeholder,
  className,
  patientId,
}: PatientIdentifierFilterProps) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    PatientRead | PartialPatientModel | null
  >(null);
  const [pendingPatient, setPendingPatient] = useState<
    PatientRead | PartialPatientModel | null
  >(null);
  const [searchType, setSearchType] = useState(
    facility?.patient_instance_identifier_configs?.[0]?.id ?? "",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [verificationOpen, setVerificationOpen] = useState(false);

  // Set initial patient ID if provided
  useEffect(() => {
    if (patientId && !selectedPatient) {
      setSelectedPatient({ id: patientId } as PatientRead);
    } else if (!patientId) {
      setSelectedPatient(null);
    }
  }, [patientId]);

  // Fetch patient details when patientId is provided
  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId! },
    }),
    enabled: !!patientId,
  });

  // Update selectedPatient when patientDetails are fetched
  useEffect(() => {
    if (patientDetails) {
      setSelectedPatient(patientDetails);
    }
  }, [patientDetails]);

  // Patient search query
  const { data: patientList, isFetching } = useQuery({
    queryKey: ["patient-search", searchTerm, searchType],
    queryFn: query.debounced(patientApi.searchPatient, {
      body:
        searchType && searchTerm
          ? { config: searchType, value: searchTerm }
          : {},
    }),
    enabled: !!searchType && !!searchTerm,
  });

  // Patient verification query
  const { data: verifiedPatient, refetch: verifyPatient } = useQuery({
    queryKey: ["patient-verify", pendingPatient?.id, yearOfBirth],
    queryFn: query(patientApi.searchRetrieve, {
      pathParams: { facilityId },
      body: {
        phone_number: pendingPatient?.phone_number ?? "",
        year_of_birth: String(yearOfBirth),
        partial_id: pendingPatient ? getPartialId(pendingPatient) : "",
      },
    }),
    enabled: false,
  });

  // Handle successful verification
  useEffect(() => {
    if (verifiedPatient) {
      handleSelectPatient(verifiedPatient);
      setVerificationOpen(false);
      setYearOfBirth("");
      setPendingPatient(null);
    }
  }, [verifiedPatient]);

  const handleSelectPatient = useCallback(
    (patient: PatientRead | PartialPatientModel) => {
      setSelectedPatient(patient);
      setOpen(false);
      setSearchTerm("");
      onSelect(patient.id);
    },
    [onSelect],
  );

  const handlePatientSelect = (patient: PatientRead | PartialPatientModel) => {
    if (patientList?.partial) {
      setPendingPatient(patient);
      setVerificationOpen(true);
      setYearOfBirth("");
    } else {
      handleSelectPatient(patient);
    }
  };

  const handleVerify = () => {
    if (!pendingPatient || !yearOfBirth || yearOfBirth.length !== 4) {
      toast.error(t("valid_year_of_birth"));
      return;
    }
    verifyPatient();
  };

  return (
    <>
      <div
        className={cn(
          "flex overflow-hidden border-gray-400 rounded-lg border",
          className,
        )}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between bg-white border-none rounded-none font-normal"
            >
              {selectedPatient && !verificationOpen ? (
                <span className="text-primary-500 text-sm">
                  {t("filtered_by_patient")}: {selectedPatient.name}
                </span>
              ) : (
                placeholder || t("search_patients")
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 overflow-hidden rounded-lg">
            <Command shouldFilter={false}>
              <div className="relative flex items-center px-3 py-2">
                <CommandInput
                  placeholder={t("search_by_identifier", {
                    name: facility?.patient_instance_identifier_configs?.find(
                      (c) => c.id === searchType,
                    )?.config.display,
                  })}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  className="pl-8 pr-8 border-none focus:ring-0 focus:outline-none"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search input"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 border-t rounded-b-lg bg-gray-50 border-t-gray-100">
                {facility?.patient_instance_identifier_configs?.map(
                  (config) => (
                    <Button
                      key={config.id}
                      variant="outline"
                      onClick={() => {
                        setSearchType(config.id);
                        setSearchTerm("");
                      }}
                      className={cn(
                        "h-6 px-2 text-xs rounded-md",
                        searchType === config.id
                          ? "bg-primary-100 text-primary-700 hover:bg-primary-200 border-primary-400"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {config.config.display}
                    </Button>
                  ),
                )}
              </div>

              <CommandList>
                {!searchTerm ? (
                  <CommandEmpty>{t("start_typing_to_search")}</CommandEmpty>
                ) : isFetching ? (
                  <CommandEmpty>{t("searching")}</CommandEmpty>
                ) : !patientList?.results.length ? (
                  <CommandEmpty>
                    {t("no_results_found_for", { term: searchTerm })}
                  </CommandEmpty>
                ) : null}
                <CommandGroup>
                  {patientList?.results.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={patient.name}
                      onSelect={() => handlePatientSelect(patient)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedPatient?.id === patient.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {patient.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedPatient && !verificationOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPatient(null);
              setPendingPatient(null);
              setSearchTerm("");
              onSelect(undefined);
            }}
            className="h-auto border-l px-2 hover:bg-transparent w-8 mr-3 pr-px rounded-none border-gray-400 text-gray-950"
          >
            <X className="size-4" />
          </Button>
        )}
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
              onClick={() => {
                setVerificationOpen(false);
                setPendingPatient(null);
              }}
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
    </>
  );
}
