import { useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { Success } from "../../Utils/Notifications";
import { useDispatch } from "react-redux";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { useTranslation } from "react-i18next";

interface Props {
  prescription: Prescription;
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  onClose: (discontinued: boolean) => void;
}

export default function DiscontinuePrescription(props: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [isDiscontinuing, setIsDiscontinuing] = useState(false);
  const [discontinuedReason, setDiscontinuedReason] = useState<string>("");

  return (
    <ConfirmDialogV2
      action={t("discontinue")}
      title={t("discontinue_caution_note")}
      show
      onClose={() => props.onClose(false)}
      variant="danger"
      onConfirm={async () => {
        setIsDiscontinuing(true);
        const res = await dispatch(
          props.actions.discontinue(discontinuedReason)
        );
        if (res.status === 201) {
          Success({ msg: t("prescription_discontinued") });
        }
        setIsDiscontinuing(false);
        props.onClose(true);
      }}
      className="max-w-4xl w-full"
    >
      <div className="flex flex-col gap-8 mt-4">
        <PrescriptionDetailCard
          prescription={props.prescription}
          readonly
          actions={props.actions}
        />
        <TextAreaFormField
          label={t("reason_for_discontinuation")}
          placeholder={t("optional")}
          name="discontinuedReason"
          value={discontinuedReason}
          onChange={({ value }) => setDiscontinuedReason(value)}
          disabled={isDiscontinuing}
        />
      </div>
    </ConfirmDialogV2>
  );
}
