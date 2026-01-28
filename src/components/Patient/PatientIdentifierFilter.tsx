import { useQuery } from "@tanstack/react-query";
import { QrCode, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import useBreakpoints from "@/hooks/useBreakpoints";

import PatientIDScanDialog from "@/components/Scan/PatientIDScanDialog";
import { Card } from "@/components/ui/card";
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

const IDENTIFIER_CONFIG_STORAGE_KEY = "patient_identifier_filter_search_type";

interface Props {
  onSelect: (patientId: string | undefined, patientName?: string) => void;
  placeholder?: string;
  className?: string;
  patientId?: string;
  patientName?: string;
  align?: "start" | "center" | "end";
  hideScanButton?: boolean;
  open?: boolean;
}

interface IdentifierConfig {
  id: string;
  config: {
    display: string;
    system: string;
  };
}

interface PatientSearchSelectorProps {
  allIdentifierConfigs: IdentifierConfig[];
  searchType: string;
  setSearchType: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isPhoneNumberConfig: boolean;
  selectedConfig: IdentifierConfig | undefined;
  handlePatientSelect: (patient: PatientRead | PartialPatientModel) => void;
  patientList?: { results: (PatientRead | PartialPatientModel)[] };
  isPatientFetching: boolean;
}

function PatientSearchSelector({
  allIdentifierConfigs,
  searchType,
  setSearchType,
  searchTerm,
  setSearchTerm,
  isPhoneNumberConfig,
  selectedConfig,
  handlePatientSelect,
  patientList,
  isPatientFetching,
}: PatientSearchSelectorProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when search type changes
  useEffect(() => {
    if (searchType) {
      // Small delay to ensure the input is rendered after type change
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchType]);

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
    <Command shouldFilter={false} className="border-none">
      <div className="flex flex-col">
        {allIdentifierConfigs.length > 2 ? (
          <div className="p-2">
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
            className="w-full p-2"
          >
            <TabsList className="w-full h-auto p-0.5 shadow-inner rounded-md">
              {allIdentifierConfigs.map((config) => (
                <TabsTrigger
                  key={config.id}
                  value={config.id}
                  className="flex-1 rounded-sm truncate"
                >
                  <span className="truncate">{config.config.display}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : allIdentifierConfigs.length === 1 ? (
          <div className="p-2">
            <span className="text-sm text-gray-900">
              {allIdentifierConfigs[0].config.display}
            </span>
          </div>
        ) : null}

        <div className="relative px-2">
          {isPhoneNumberConfig ? (
            <PhoneInput
              ref={inputRef}
              placeholder={selectedConfig?.config.display || t("search")}
              value={searchTerm}
              onChange={(value) => setSearchTerm(value || "")}
              className="border-none focus:ring-0 focus:outline-none flex-1"
              autoFocus
            />
          ) : (
            <>
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none z-10" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={selectedConfig?.config.display || t("search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </>
          )}
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-5 top-1/2 -translate-y-1/2 size-6 text-gray-400 hover:bg-transparent"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search input"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {searchStateMessage ? (
          <Card className="flex items-center justify-center border m-2 bg-gray-50 rounded-sm shadow-none">
            <div className="text-sm text-gray-950 text-center p-5">
              {searchStateMessage}
            </div>
          </Card>
        ) : (
          <>
            <div className="p-2 text-xs text-gray-700">
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
            <CommandList className="max-h-[calc(50vh-12rem)] overflow-y-auto">
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
          </>
        )}
      </div>
    </Command>
  );
}

export default function PatientIdentifierFilter({
  onSelect,
  placeholder,
  className,
  patientId,
  patientName,
  align = "start",
  hideScanButton = false,
  open: externalOpen = false,
}: Props) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const [open, setOpen] = useState(externalOpen);
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
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  useEffect(() => {
    setOpen(externalOpen);
  }, [externalOpen]);

  // Enable external scanner detection when not in a dialog
  useBarcodeScanner({
    onScan: (scannedPatientId: string) => {
      if (!open && !verificationOpen && !scanDialogOpen) {
        let extractedId = scannedPatientId;

        try {
          const parsed = JSON.parse(scannedPatientId);
          if (parsed.uuid && typeof parsed.uuid === "string") {
            extractedId = parsed.uuid;
          }
        } catch {
          extractedId = scannedPatientId;
        }

        handleScanSuccess(extractedId);
        toast.info(t("patient_details_scanned_successfully"));
      }
    },
    enabled: !open && !verificationOpen && !scanDialogOpen,
    preventDefault: false,
    maxLength: 500,
    timeout: 500,
  });

  // Set initial patient ID and name if provided
  useEffect(() => {
    if (patientId && !selectedPatient) {
      setSelectedPatient({ id: patientId, name: patientName } as PatientRead);
    } else if (!patientId) {
      setSelectedPatient(null);
    }
  }, [patientId, patientName, selectedPatient]);

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

  // Set default search type from localStorage, fallback to first identifier config (prioritize phone number)
  useEffect(() => {
    if (allIdentifierConfigs.length && !searchType) {
      const cachedSearchType = localStorage.getItem(
        IDENTIFIER_CONFIG_STORAGE_KEY,
      );
      const cachedConfigExists = allIdentifierConfigs.some(
        (c) => c.id === cachedSearchType,
      );

      if (cachedSearchType && cachedConfigExists) {
        setSearchType(cachedSearchType);
      } else {
        const phoneConfig = allIdentifierConfigs.find(
          (c) => c.config.system === careConfig.phoneNumberConfigSystem,
        );
        setSearchType(phoneConfig?.id || allIdentifierConfigs[0].id);
      }
    }
  }, [allIdentifierConfigs, searchType]);

  // Cache the selected identifier config in localStorage
  useEffect(() => {
    if (searchType) {
      localStorage.setItem(IDENTIFIER_CONFIG_STORAGE_KEY, searchType);
    }
  }, [searchType]);

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

  const handleSelectPatient = useCallback(
    (patient: PatientListRead | PartialPatientModel) => {
      setSelectedPatient(patient);
      setOpen(false);
      setSearchTerm("");
      onSelect(patient.id, patient.name);
    },
    [onSelect],
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

  const handleClear = () => {
    setSelectedPatient(null);
    setPendingPatient(null);
    setSearchTerm("");
    onSelect(undefined);
  };

  const handleScanSuccess = (scannedPatientId: string) => {
    onSelect(scannedPatientId, t("scanned_patient"));
    setSelectedPatient({
      id: scannedPatientId,
      name: t("scanned_patient"),
    } as PatientRead);
  };

  const selectedConfig = allIdentifierConfigs.find((c) => c.id === searchType);

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="flex-1 justify-between bg-white border-none rounded-none font-normal"
    >
      {selectedPatient && !verificationOpen ? (
        <span className="text-primary-500 text-sm">{selectedPatient.name}</span>
      ) : (
        <span className="text-sm text-gray-900">
          {placeholder || t("filter_by_identifier")}
        </span>
      )}
      <Search className="ml-2 size-4 shrink-0 opacity-50" />
    </Button>
  );

  return (
    <>
      <div
        className={cn(
          "flex overflow-hidden border-gray-400 rounded-lg border",
          className,
        )}
      >
        {!hideScanButton && (
          <Button
            variant="ghost"
            onClick={() => setScanDialogOpen(true)}
            className="shrink-0 text-gray-950 px-2 border-r rounded-r-none bg-white"
            aria-label={t("scan_patient_qr")}
            data-shortcut-id="scan-patient"
          >
            <QrCode className="size-4" />
            <span className="hidden md:block">{t("scan")}</span>
          </Button>
        )}
        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="min-h-[50vh] max-h-[85vh]">
              <PatientSearchSelector
                allIdentifierConfigs={allIdentifierConfigs}
                searchType={searchType}
                setSearchType={setSearchType}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isPhoneNumberConfig={isPhoneNumberConfig}
                selectedConfig={selectedConfig}
                handlePatientSelect={handlePatientSelect}
                patientList={patientList}
                isPatientFetching={isPatientFetching}
              />
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent
              className="w-80 p-0 overflow-hidden rounded-lg"
              align={align}
            >
              <PatientSearchSelector
                allIdentifierConfigs={allIdentifierConfigs}
                searchType={searchType}
                setSearchType={setSearchType}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isPhoneNumberConfig={isPhoneNumberConfig}
                selectedConfig={selectedConfig}
                handlePatientSelect={handlePatientSelect}
                patientList={patientList}
                isPatientFetching={isPatientFetching}
              />
            </PopoverContent>
          </Popover>
        )}
        {selectedPatient && !verificationOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto border-l px-2 hover:bg-transparent w-8 mr-3 pr-px rounded-none border-gray-400 text-gray-950"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

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
