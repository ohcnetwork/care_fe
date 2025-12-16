import { useMutation } from "@tanstack/react-query";
import { ArchiveIcon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";

import CriticalActionConfirmationDialog from "@/components/Common/CriticalActionConfirmationDialog";

import mutate from "@/Utils/request/mutate";
import patientApi from "@/types/emr/patient/patientApi";

interface ArchivePatientSectionProps {
  patientId: string;
  patientName: string;
}

const CONFIRMATION_TEXT = "Archive Patient";

const ArchivePatientSection = ({
  patientId,
  patientName,
}: ArchivePatientSectionProps) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const { mutate: deletePatient, isPending } = useMutation({
    mutationFn: mutate(patientApi.deletePatient, {
      pathParams: { id: patientId },
    }),
    onSuccess: () => {
      toast.success(t("patient_archived_successfully"));
      setOpen(false);
      navigate("/");
    },
  });

  return (
    <div className="w-full border-t border-gray-200 py-6 mt-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            {t("archive_patient")}
          </h3>
          <p className="text-sm text-red-700 mb-4">
            {t("archive_patient_description")}
          </p>
          <CriticalActionConfirmationDialog
            trigger={
              <button
                className={buttonVariants({ variant: "destructive" })}
                type="button"
              >
                <ArchiveIcon className="size-4" />
                {t("archive_patient")}
              </button>
            }
            title={t("verify_patient_archive_request")}
            description={
              <>
                <p>
                  <Trans
                    i18nKey="are_you_sure_you_want_to_archive_patient"
                    values={{ name: patientName }}
                    components={{
                      strong: <strong className="font-semibold" />,
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="archive_patient_warning"
                    components={{
                      strong: <strong className="font-semibold" />,
                    }}
                  />
                </p>
              </>
            }
            confirmationText={CONFIRMATION_TEXT}
            actionButtonText={t("archive_patient")}
            onConfirm={() => deletePatient()}
            isLoading={isPending}
            open={open}
            onOpenChange={setOpen}
            icon={<ArchiveIcon className="size-4 text-red-500" />}
          />
        </div>
      </div>
    </div>
  );
};

export default ArchivePatientSection;
