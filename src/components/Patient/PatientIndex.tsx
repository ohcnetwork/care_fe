import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import useKeyboardShortcut from "use-keyboard-shortcut";

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
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";

import { GENDER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { parsePhoneNumber } from "@/Utils/utils";
import { PartialPatientModel } from "@/types/emr/newPatient";

export default function PatientIndex({ facilityId }: { facilityId: string }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PartialPatientModel | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const { t } = useTranslation();

  const handleCreatePatient = useCallback(() => {
    const queryParams = phoneNumber ? { phone_number: phoneNumber } : {};

    navigate(`/facility/${facilityId}/patient/create`, {
      query: queryParams,
    });
  }, [facilityId, phoneNumber]);

  useKeyboardShortcut(["shift", "p"], handleCreatePatient);

  function AddPatientButton({ outline }: { outline?: boolean }) {
    return (
      <Button
        variant={outline ? "outline" : "primary_gradient"}
        className={cn("gap-3 group")}
        onClick={handleCreatePatient}
      >
        <CareIcon icon="l-plus" className="h-4 w-4" />
        {t("add_new_patient")}
        <kbd
          className={cn(
            "hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex",
            outline
              ? "border-input bg-transparent"
              : "bg-white/20 border-white/20 text-white",
          )}
        >
          ⇧P
        </kbd>
      </Button>
    );
  }

  const searchOptions = [
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: t("search_by_phone_number"),
      value: phoneNumber,
      shortcutKey: "p",
    },
  ];

  const handleSearch = useCallback((key: string, value: string) => {
    if (key === "phone_number") {
      setPhoneNumber(value.length >= 13 || value === "" ? value : "");
    }
  }, []);

  const { data: patientList, isFetching } = useQuery({
    queryKey: ["patient-search", facilityId, phoneNumber],
    queryFn: query.debounced(routes.searchPatient, {
      body: {
        phone_number: parsePhoneNumber(phoneNumber) || "",
      },
    }),
    enabled: !!phoneNumber,
  });

  const handlePatientSelect = (patient: PartialPatientModel) => {
    setSelectedPatient(patient);
    setVerificationOpen(true);
    setYearOfBirth("");
  };

  const handleVerify = () => {
    if (!selectedPatient || !yearOfBirth || yearOfBirth.length !== 4) {
      toast.error(t("valid_year_of_birth"));
      return;
    }

    navigate(`/facility/${facilityId}/patients/verify`, {
      query: {
        phone_number: selectedPatient.phone_number,
        year_of_birth: yearOfBirth,
        partial_id: selectedPatient.partial_id,
      },
    });
  };

  return (
    <div>
      <div className="container max-w-5xl mx-auto py-6">
        <div className="flex justify-center md:justify-end">
          <AddPatientButton />
        </div>
        <div className="space-y-6 mt-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("search_patients")}
            </h1>
            <p className="text-muted-foreground">
              {t("search_patient_page_text")}
            </p>
          </div>

          <div>
            <div className="space-y-6">
              <SearchByMultipleFields
                id="patient-search"
                options={searchOptions}
                onSearch={handleSearch}
                className="w-full"
              />

              <div className="min-h-[200px]" id="patient-search-results">
                {!!phoneNumber && (
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
                          <p className="text-sm text-muted-foreground mb-6">
                            {t("no_patient_record_text")}
                          </p>
                          <AddPatientButton outline />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border">
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
                            {patientList.results.map((patient) => (
                              <TableRow
                                key={patient.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handlePatientSelect(patient)}
                              >
                                <TableCell className="font-medium">
                                  {patient.name}
                                </TableCell>
                                <TableCell>{patient.phone_number}</TableCell>
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
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setYearOfBirth(value);
                }
              }}
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
