import { useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { Success } from "../../Utils/Notifications";
import { useDispatch } from "react-redux";
import PrescriptionDetailCard from "./PrescriptionDetailCard";

interface Props {
  prescription: Prescription;
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  onClose: (discontinued: boolean) => void;
}

export default function DiscontinuePrescription(props: Props) {
  const dispatch = useDispatch<any>();
  const [isDiscontinuing, setIsDiscontinuing] = useState(false);
  const [discontinuedReason, setDiscontinuedReason] = useState<string>("");

  return (
    <ConfirmDialogV2
      action="Discontinue"
      title="Are you sure you want to discontinue this prescription?"
      show
      onClose={() => props.onClose(false)}
      variant="danger"
      onConfirm={async () => {
        setIsDiscontinuing(true);
        const res = await dispatch(
          props.actions.discontinue(discontinuedReason)
        );
        if (res.status === 201) {
          const id = props.prescription.id!.slice(-5);
          Success({
            msg: `Prescription #${id} discontinued`,
          });
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
          label="Reason for discontinuation"
          placeholder="Optional"
          name="discontinuedReason"
          value={discontinuedReason}
          onChange={({ value }) => setDiscontinuedReason(value)}
          disabled={isDiscontinuing}
        />
      </div>
    </ConfirmDialogV2>
  );
}
