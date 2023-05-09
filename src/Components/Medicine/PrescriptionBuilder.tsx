import { useCallback, useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { NormalPrescription, Prescription } from "./models";
import DialogModal from "../Common/Dialog";
import { PRNPrescription } from "./models";
import PrescriptionForm from "./PrescriptionForm";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";

interface Props {
  type: Prescription["prescription_type"];
  actions: ReturnType<typeof PrescriptionActions>;
  is_prn?: boolean;
}

export default function PrescriptionBuilder({
  type,
  actions,
  is_prn = false,
}: Props) {
  const dispatch = useDispatch<any>();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>();
  const [showCreate, setShowCreate] = useState(false);

  const fetchPrescriptions = useCallback(() => {
    dispatch(actions.list({ is_prn })).then((res: any) =>
      setPrescriptions(res.data.results)
    );
  }, [dispatch, is_prn]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3">
        {prescriptions?.map((obj, index) => (
          <PrescriptionDetailCard
            key={index}
            index={index}
            prescription={obj}
          />
        ))}
      </div>
      <ButtonV2
        type="button"
        onClick={() => setShowCreate(true)}
        variant="secondary"
        className="mt-4 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 w-full focus:outline focus:outline-1 focus:outline-offset-1 focus:bg-gray-100 focus:text-gray-900"
        align="start"
      >
        <CareIcon className="care-l-plus text-lg" />
        <span className="font-bold">
          Add {is_prn ? "PRN Prescription" : "Prescription"}
        </span>
      </ButtonV2>
      {showCreate && (
        <DialogModal
          onClose={() => setShowCreate(false)}
          show={showCreate}
          title={is_prn ? "Add PRN Prescription" : "Add Prescription"}
          description="Add a new prescription to this consultation."
          className="max-w-3xl w-full"
        >
          <PrescriptionForm
            prescription={
              {
                ...(is_prn ? DefaultPRNPrescription : DefaultPrescription),
                prescription_type: type,
              } as Prescription
            }
            create={actions.create}
            onDone={() => {
              setShowCreate(false);
              fetchPrescriptions();
            }}
          />
        </DialogModal>
      )}
    </div>
  );
}

const DefaultPrescription: Partial<NormalPrescription> = { is_prn: false };
const DefaultPRNPrescription: Partial<PRNPrescription> = { is_prn: true };
