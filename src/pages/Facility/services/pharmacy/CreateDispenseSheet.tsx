import { useQuery } from "@tanstack/react-query";
import { Plus, QrCode, Search, X } from "lucide-react";
import { navigate } from "raviger";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PatientIDScanDialog from "@/components/Scan/PatientIDScanDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getPartialId,
  PartialPatientModel,
  PatientListRead,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import query from "@/Utils/request/query";
import careConfig from "@careConfig";

interface CreateDispenseSheetProps {
  facilityId: string;
  locationId: string;
  trigger?: React.ReactNode;
}

export function CreateDispenseSheet({
  facilityId,
  trigger,
}: CreateDispenseSheetProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    PatientListRead | PartialPatientModel | null
  >(null);
  const [pendingPatient, setPendingPatient] = useState<
    PatientListRead | PartialPatientModel | null
  >(null);
  const [searchType, setSearchType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

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

  // Set default search type to first identifier config (prioritize phone number)
  useEffect(() => {
    if (allIdentifierConfigs.length && !searchType) {
      const phoneConfig = allIdentifierConfigs.find(
        (c) => c.config.system === careConfig.phoneNumberConfigSystem,
      );
      setSearchType(phoneConfig?.id || allIdentifierConfigs[0].id);
    }
  }, [allIdentifierConfigs, searchType]);

  // Check if current search type is phone number
  const isPhoneNumberConfig =
    allIdentifierConfigs.find((c) => c.id === searchType)?.config.system ===
    careConfig.phoneNumberConfigSystem;

  // Patient search query (for identifier-based search)
  const { data: patientList, isFetching: isPatientFetching } = useQuery({
    queryKey: ["patient-search", searchTerm, searchType],
    queryFn: query.debounced(patientApi.search, {
      body:
        searchType && searchTerm
          ? { config: searchType, value: searchTerm, page_size: 20 }
          : {},
    }),
    enabled:
      !!searchType &&
      !!searchTerm &&
      (!isPhoneNumberConfig || isValidPhoneNumber(searchTerm)),
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

  const resetState = () => {
    setSelectedPatient(null);
    setPendingPatient(null);
    setSearchTerm("");
    setYearOfBirth("");
  };

  const handleSelectPatient = useCallback(
    (patient: PatientListRead | PartialPatientModel) => {
      setSelectedPatient(patient);
      setSearchTerm("");
    },
    [],
  );

  // Handle successful verification
  useEffect(() => {
    if (verifiedPatient) {
      handleSelectPatient(verifiedPatient);
      setVerificationOpen(false);
      setYearOfBirth("");
      setPendingPatient(null);
    }
  }, [verifiedPatient, handleSelectPatient]);

  const handlePatientSelect = (
    patient: PatientListRead | PartialPatientModel,
  ) => {
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

  const handleScanSuccess = (scannedPatientId: string) => {
    setSelectedPatient({
      id: scannedPatientId,
      name: t("scanned_patient"),
    } as PatientRead);
    setScanDialogOpen(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSearchTerm("");
  };

  const handleProceedToDispense = () => {
    if (!selectedPatient) {
      toast.error(t("select_patient_first"));
      return;
    }
    setIsOpen(false);
    resetState();
    navigate(
      `/facility/${facilityId}/patients/verify?${new URLSearchParams({
        phone_number: selectedPatient.phone_number,
        year_of_birth:
          ("year_of_birth" in selectedPatient &&
            selectedPatient.year_of_birth?.toString()) ||
          "",
        partial_id: selectedPatient.id.slice(0, 5),
        flow: "dispense",
      }).toString()}`,
    );
  };

  const selectedConfig = allIdentifierConfigs.find((c) => c.id === searchType);

  const searchStateMessage = (() => {
    if (!searchType) {
      return t("select_search_type");
    }

    if (!searchTerm) {
      return t("start_typing_to_search");
    }

    if (isPhoneNumberConfig && !isValidPhoneNumber(searchTerm)) {
      return t("enter_valid_phone_number_to_search");
    }

    if (isPatientFetching) {
      return `${t("searching_term", { term: searchTerm })}...`;
    }

    if (!patientList?.results.length) {
      return t("no_matches_found");
    }

    return null;
  })();

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetState();
        }}
      >
        <SheetTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="size-4 mr-1" />
              {t("new_dispense")}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("new_dispense")}</SheetTitle>
            <SheetDescription>
              {selectedPatient
                ? t("dispense_for_patient", {
                    patientName: selectedPatient.name,
                  })
                : t("select_patient_to_dispense")}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Patient Selection */}
            {!selectedPatient ? (
              <Card className="p-0">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("select_patient")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setScanDialogOpen(true)}
                    >
                      <QrCode className="size-4 mr-1" />
                      {t("scan")}
                    </Button>
                  </div>

                  {/* Search Type Selector */}
                  {allIdentifierConfigs.length > 2 ? (
                    <div>
                      <label className="text-xs text-gray-600 mb-1.5 ml-1 block">
                        {t("search_by")}
                      </label>
                      <Select value={searchType} onValueChange={setSearchType}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allIdentifierConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.config.display}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : allIdentifierConfigs.length >= 2 ? (
                    <Tabs
                      value={searchType}
                      onValueChange={(value) => {
                        setSearchType(value);
                        setSearchTerm("");
                      }}
                      className="w-full"
                    >
                      <TabsList className="w-full h-auto p-0.5 shadow-inner rounded-md">
                        {allIdentifierConfigs.map((config) => (
                          <TabsTrigger
                            key={config.id}
                            value={config.id}
                            className="flex-1 rounded-sm truncate"
                          >
                            <span className="truncate">
                              {config.config.display}
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  ) : null}

                  {/* Search Input */}
                  <div className="relative">
                    {isPhoneNumberConfig ? (
                      <PhoneInput
                        placeholder={
                          selectedConfig?.config.display || t("search")
                        }
                        value={searchTerm}
                        onChange={(value) => setSearchTerm(value || "")}
                        className="border-gray-300"
                      />
                    ) : (
                      <>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none z-10" />
                        <Input
                          type="text"
                          placeholder={
                            selectedConfig?.config.display || t("search")
                          }
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </>
                    )}
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 size-6 text-gray-400 hover:bg-transparent"
                        onClick={() => setSearchTerm("")}
                        aria-label={t("clear")}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchStateMessage ? (
                    <Card className="flex items-center justify-center border bg-gray-50 rounded-sm shadow-none">
                      <div className="text-sm text-gray-950 text-center p-5">
                        {searchStateMessage}
                      </div>
                    </Card>
                  ) : (
                    <>
                      <div className="text-xs text-gray-700">
                        <Trans
                          i18nKey="found_patient_with_this"
                          values={{
                            count: patientList?.results.length || 0,
                            identifier: isPhoneNumberConfig
                              ? t("phone_number").toLowerCase()
                              : t("identifier").toLowerCase(),
                          }}
                          components={{
                            strong: <span className="font-medium" />,
                          }}
                        />
                      </div>
                      <Command shouldFilter={false} className="border rounded">
                        <CommandList className="max-h-48 overflow-y-auto">
                          <CommandGroup className="p-0">
                            {patientList?.results.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={patient.id}
                                onSelect={() => handlePatientSelect(patient)}
                                className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-50"
                              >
                                <span className="text-sm text-gray-900">
                                  {patient.name}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Selected Patient Display */}
                <Card className="p-0 bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{t("patient")}</p>
                        <p className="font-medium">{selectedPatient.name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearPatient}
                      >
                        <X className="size-4" />
                        {t("change")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <SheetFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleProceedToDispense}>
                    {t("proceed_to_dispense")}
                  </Button>
                </SheetFooter>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PatientIDScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScanSuccess={handleScanSuccess}
      />

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
            >
              {t("cancel")}
            </Button>
            <Button className="mb-2" onClick={handleVerify}>
              {t("verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
