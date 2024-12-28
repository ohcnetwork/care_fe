import { useMutation } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { SectionTabs } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { PatientManager } from "@/components/Patient/ManagePatients";

import { GENDER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { parsePhoneNumber } from "@/Utils/utils";
import { PartialPatientModel } from "@/types/emr/newPatient";

type patientListResponse = {
  results: PartialPatientModel[];
  count: number;
};

export default function PatientIndex(props: {
  facilityId: string;
  tab?: "live" | "discharged" | "search";
}) {
  const [qParams] = useQueryParams();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState(qParams.phone_number || "");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PartialPatientModel | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);

  const [patientList, setPatientList] = useState<patientListResponse>({
    results: [],
    count: 0,
  });
  const { tab = "search" } = props;

  function AddPatientButton(props: { outline?: boolean; facilityId: string }) {
    return (
      <Button
        variant={props.outline ? "outline_primary" : "primary_gradient"}
        className="gap-3 group"
        onClick={() => navigate(`/facility/${props.facilityId}/patient/create`)}
      >
        <CareIcon icon="l-plus" />
        {t("add_new_patient")}
        <div
          className={cn(
            "border border-white/50 rounded-md opacity-50 px-2 py-0.5 text-xs",
            props.outline && "border-black/50 group-hover:border-white/50",
          )}
        >
          SHIFT P
        </div>
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

  const handleSearch = useCallback(
    (key: string, value: string) => {
      const updatedQuery: Record<string, string | undefined> = {};

      switch (key) {
        case "phone_number":
          if (value.length >= 13 || value === "") {
            updatedQuery[key] = value;
          } else {
            updatedQuery[key] = "";
          }
          break;
        default:
          break;
      }

      setPhoneNumber(updatedQuery.phone_number || "");
    },
    [setPhoneNumber],
  );

  const { mutate: listPatients, isPending } = useMutation({
    mutationFn: (body: { phone_number: string }) =>
      mutate(routes.searchPatient, {
        body: {
          phone_number: parsePhoneNumber(phoneNumber) || "",
        },
      })(body),
    onSuccess: (data) => {
      setPatientList({
        results: data.results,
        count: data.count,
      });
    },
  });

  const handlePatientSelect = (patient: PartialPatientModel) => {
    setSelectedPatient(patient);
    setVerificationOpen(true);
    setYearOfBirth("");
  };

  const handleVerify = () => {
    if (!selectedPatient || !yearOfBirth || yearOfBirth.length !== 4) {
      toast.error(t("please_enter_valid_year"));
      return;
    }

    navigate(`/facility/${props.facilityId}/patients/verify`, {
      query: {
        phone_number: selectedPatient.phone_number,
        year_of_birth: yearOfBirth,
        partial_id: selectedPatient.partial_id,
      },
    });
  };

  useEffect(() => {
    if (phoneNumber) {
      listPatients({
        phone_number: parsePhoneNumber(phoneNumber) || "",
      });
    }
  }, [phoneNumber]);

  return (
    <Page
      title="Patients"
      hideBack
      breadcrumbs={false}
      options={<AddPatientButton facilityId={props.facilityId} />}
    >
      <SectionTabs
        activeTab={tab}
        onChange={(value) => {
          if (value === "discharged") {
            navigate(`/facility/${props.facilityId}/encounters/discharged`);
          } else if (value === "search") {
            navigate(`/facility/${props.facilityId}/encounters`);
          } else if (value === "live") {
            navigate(`/facility/${props.facilityId}/encounters/live`);
          }
        }}
        tabs={[
          {
            label: t("search"),
            value: "search",
          },
          {
            label: t("live"),
            value: "live",
          },
          {
            label: t("discharged"),
            value: "discharged",
          },
        ]}
      />
      {tab === "search" ? (
        <div className="flex items-center flex-col w-full lg:w-[800px] mx-auto">
          <div className="w-full mt-4">
            <SearchByMultipleFields
              id="patient-search"
              options={searchOptions}
              onSearch={handleSearch}
              className="w-full"
            />
          </div>
          {!!phoneNumber &&
            (!isPending && !patientList.results.length ? (
              <div className="py-10 text-gray-600 text-sm flex flex-col gap-4 text-center">
                {t("no_records_found")}
                <br />
                {t("to_proceed_with_registration")}
                <AddPatientButton outline facilityId={props.facilityId} />
              </div>
            ) : isPending ? (
              <Loading />
            ) : (
              !!patientList.results.length && (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="">{t("name")}</TableHead>
                      <TableHead className="">
                        {t("primary_phone_no")}
                      </TableHead>
                      <TableHead className="">{t("sex")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientList.results.map((patient) => (
                      <TableRow
                        className="bg-white cursor-pointer"
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <TableCell className="min-w-[200px]">
                          {patient.name}
                        </TableCell>
                        <TableCell>{patient.phone_number}</TableCell>
                        <TableCell>
                          {
                            GENDER_TYPES.find((g) => g.id === patient.gender)
                              ?.text
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ))}
        </div>
      ) : (
        <PatientManager />
      )}

      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("verify_patient")}</DialogTitle>
            <DialogDescription>
              {t("enter_year_of_birth_to_verify")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder={t("year_of_birth")}
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
    </Page>
  );
}
