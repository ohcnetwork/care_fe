import { useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { Success } from "../../Utils/Notifications";
import { useDispatch } from "react-redux";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDate } from "../../Utils/utils";
import { useTranslation } from "react-i18next";

interface Props {
  prescription: Prescription;
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  onClose: (success: boolean) => void;
}

export default function AdministerMedicine({ prescription, ...props }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string>("");

  return (
    <ConfirmDialogV2
      action={
        <>
          <CareIcon className="care-l-syringe text-lg" />
          {t("administer_medicine")}
        </>
      }
      title={t("administer_medicine")}
      description={
        <div className="text-gray-600 font-semibold leading-relaxed text-sm">
          <CareIcon className="care-l-history-alt pr-1" /> Last administered
          <span className="pl-1">
            {prescription.last_administered_on
              ? formatDate(prescription.last_administered_on)
              : t("never")}
          </span>
        </div>
      }
      show
      onClose={() => props.onClose(false)}
      // variant="primary"
      onConfirm={async () => {
        setIsLoading(true);
        const res = await dispatch(props.actions.administer({ notes }));
        if (res.status === 201) {
          Success({ msg: t("medicines_administered") });
        }
        setIsLoading(false);
        props.onClose(true);
      }}
      className="max-w-4xl w-full"
    >
      <div className="flex flex-col gap-8 mt-4">
        <PrescriptionDetailCard
          prescription={prescription}
          readonly
          actions={props.actions}
        />
        <TextAreaFormField
          label={t("administration_notes")}
          name="administration_notes"
          placeholder={t("add_notes")}
          value={notes}
          onChange={({ value }) => setNotes(value)}
          errorClassName="hidden"
          disabled={isLoading}
        />
      </div>
    </ConfirmDialogV2>
  );
}
