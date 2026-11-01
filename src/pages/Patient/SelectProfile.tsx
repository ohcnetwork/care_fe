import { Plus } from "lucide-react";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { PatientProfileCard } from "@/components/Patient/PatientProfileCard";

import { usePatientContext } from "@/hooks/usePatientUser";

import { PublicPatientRead } from "@/types/emr/patient/patient";

function ProfileContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col">{children}</div>
  );
}

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

  // A single linked profile has nothing to pick, so skip the picker entirely.
  const onlyPatient = patients?.length === 1 ? patients[0] : null;
  useEffect(() => {
    if (!onlyPatient) {
      return;
    }
    setSelectedPatient(onlyPatient);
    navigate("/patient/home", { replace: true });
  }, [onlyPatient, setSelectedPatient]);

  if (isLoadingPatients || onlyPatient) {
    return (
      <ProfileContainer>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-5 w-full" />
        <div className="mt-6 flex flex-col gap-2.5">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-19 w-full rounded-2xl" />
          ))}
        </div>
      </ProfileContainer>
    );
  }

  // Nothing linked to this number yet — registering is the only way forward.
  if (!patients?.length) {
    return (
      <ProfileContainer>
        <div className="flex w-full flex-col items-center justify-center px-8 py-16 text-center">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900">
            {t("patient_select__empty_heading")}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-gray-600">
            {t("patient_select__empty_description")}
          </p>
          <Button size="lg" className="mt-5 h-12 w-full text-base" asChild>
            <Link href="/patient/add-profile">
              {t("patient_select__add_family_member")}
            </Link>
          </Button>
        </div>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <h1 className="text-3xl font-normal leading-tight tracking-tight text-gray-900">
        {t("patient_select__heading")}
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
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

      <div className="sticky bottom-0 bg-background pb-4 pt-5">
        <Button
          size="lg"
          className="h-12 w-full text-base"
          disabled={!activePatient}
          onClick={handleContinue}
        >
          {t("patient_select__continue_as", {
            name: activePatient?.name.split(" ")[0] ?? "",
          })}
        </Button>
      </div>
    </ProfileContainer>
  );
}
