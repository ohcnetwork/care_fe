import { Plus } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { PatientProfileCard } from "@/components/Patient/PatientProfileCard";

import { usePatientContext } from "@/hooks/usePatientUser";

import PatientAuthLayout from "@/pages/PublicAppointments/auth/PatientAuthLayout";
import { PublicPatientRead } from "@/types/emr/patient/patient";

/**
 * Screen shown straight after OTP verification: pick which of the profiles
 * linked to this mobile number the session is for.
 */
export default function SelectProfile() {
  const { t } = useTranslation();
  const { patients, selectedPatient, setSelectedPatient, isLoadingPatients } =
    usePatientContext();

  const [draftPatient, setDraftPatient] = useState<PublicPatientRead | null>(
    null,
  );
  const activePatient = draftPatient ?? selectedPatient;

  const handleContinue = () => {
    if (!activePatient) {
      return;
    }
    setSelectedPatient(activePatient);
    navigate("/patient/home");
  };

  if (isLoadingPatients) {
    return (
      <PatientAuthLayout className="px-6 pt-9">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-5 w-full" />
        <div className="mt-6 flex flex-col gap-2.5">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      </PatientAuthLayout>
    );
  }

  // Nothing linked to this number yet — registering is the only way forward.
  if (!patients?.length) {
    return (
      <PatientAuthLayout className="px-6 pt-9">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">
          {t("patient_select__empty_heading")}
        </h1>
        <p className="mt-2.5 text-base leading-relaxed text-gray-600">
          {t("patient_select__empty_description")}
        </p>
        <Button size="lg" className="mt-8 h-12 w-full text-base" asChild>
          <Link href="/patient/add-profile">
            {t("patient_select__add_family_member")}
          </Link>
        </Button>
      </PatientAuthLayout>
    );
  }

  return (
    <PatientAuthLayout className="px-6 pt-9">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">
        {t("patient_select__heading")}
      </h1>
      <p className="mt-2 text-base leading-relaxed text-gray-600">
        {t("patient_select__description", { count: patients.length })}
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {patients.map((patient) => (
          <PatientProfileCard
            key={patient.id}
            patient={patient}
            selected={patient.id === activePatient?.id}
            onSelect={setDraftPatient}
          />
        ))}

        <Link
          href="/patient/add-profile"
          className="flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-gray-300 p-4 text-sm font-semibold text-primary-700 hover:border-primary-700 hover:bg-primary-50"
        >
          <Plus className="size-4" strokeWidth={2.2} />
          {t("patient_select__add_family_member")}
        </Link>
      </div>

      <Button
        size="lg"
        className="mt-auto h-12 w-full text-base"
        disabled={!activePatient}
        onClick={handleContinue}
      >
        {t("patient_select__continue_as", {
          name: activePatient?.name.split(" ")[0] ?? "",
        })}
      </Button>
    </PatientAuthLayout>
  );
}
