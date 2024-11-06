import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/components/Common/ConfirmDialog";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import { Prescription } from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";

import useSlug from "@/hooks/useSlug";

import { Success } from "@/Utils/Notifications";
import request from "@/Utils/request/request";

interface Props {
  prescription: Prescription;
  onClose: (discontinued: boolean) => void;
}

export default function DiscontinuePrescription(props: Props) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const [isDiscontinuing, setIsDiscontinuing] = useState(false);
  const [discontinuedReason, setDiscontinuedReason] = useState<string>("");

  return (
    <ConfirmDialog
      action={t("confirm_discontinue")}
      title={t("discontinue_caution_note")}
      show
      onClose={() => props.onClose(false)}
      variant="danger"
      onConfirm={async () => {
        setIsDiscontinuing(true);
        const { res } = await request(MedicineRoutes.discontinuePrescription, {
          pathParams: { consultation, external_id: props.prescription.id },
          body: {
            discontinued_reason: discontinuedReason,
          },
        });
        if (res?.ok) {
          Success({ msg: t("prescription_discontinued") });
        }
        setIsDiscontinuing(false);
        props.onClose(true);
      }}
      className="w-full md:max-w-4xl"
    >
      <div className="mt-4 flex flex-col gap-8">
        <PrescriptionDetailCard prescription={props.prescription} readonly />
        <TextAreaFormField
          label={t("reason_for_discontinuation")}
          placeholder={t("optional")}
          name="discontinuedReason"
          value={discontinuedReason}
          onChange={({ value }) => setDiscontinuedReason(value)}
          disabled={isDiscontinuing}
        />
      </div>
    </ConfirmDialog>
  );
}
