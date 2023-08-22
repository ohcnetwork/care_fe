import { useCallback, useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { NormalPrescription, Prescription, PRNPrescription } from "./models";
import DialogModal from "../Common/Dialog";
import CreatePrescriptionForm from "./CreatePrescriptionForm";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import DiscontinuePrescription from "./DiscontinuePrescription";
import AdministerMedicine from "./AdministerMedicine";
import { useTranslation } from "react-i18next";

interface Props {
  prescription_type?: Prescription["prescription_type"];
  actions: ReturnType<typeof PrescriptionActions>;
  is_prn?: boolean;
  disabled?: boolean;
}

export default function PrescriptionBuilder({
  prescription_type,
  actions,
  is_prn = false,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>();
  const [showCreate, setShowCreate] = useState(false);
  const [showDiscontinueFor, setShowDiscontinueFor] = useState<Prescription>();
  const [showAdministerFor, setShowAdministerFor] = useState<Prescription>();

  const fetchPrescriptions = useCallback(() => {
    dispatch(actions.list({ is_prn, prescription_type })).then((res: any) =>
      setPrescriptions(res.data.results)
    );
  }, [dispatch, is_prn]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div>
      {showDiscontinueFor && (
        <DiscontinuePrescription
          prescription={showDiscontinueFor}
          actions={actions.prescription(showDiscontinueFor?.id ?? "")}
          onClose={(success) => {
            setShowDiscontinueFor(undefined);
            if (success) fetchPrescriptions();
          }}
          key={showDiscontinueFor.id}
        />
      )}
      {showAdministerFor && (
        <AdministerMedicine
          prescription={showAdministerFor}
          actions={actions.prescription(showAdministerFor?.id ?? "")}
          onClose={(success) => {
            setShowAdministerFor(undefined);
            if (success) fetchPrescriptions();
          }}
          key={showAdministerFor.id}
        />
      )}
      <div className="flex flex-col gap-3">
        {prescriptions?.map((obj, index) => (
          <PrescriptionDetailCard
            key={index}
            prescription={obj}
            actions={actions.prescription(obj?.id ?? "")}
            onDiscontinueClick={() => setShowDiscontinueFor(obj)}
            onAdministerClick={() => setShowAdministerFor(obj)}
            readonly={disabled}
          />
        ))}
      </div>
      <ButtonV2
        type="button"
        onClick={() => setShowCreate(true)}
        variant="secondary"
        className="mt-4 w-full bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900"
        disabled={disabled}
      >
        <div className="flex w-full justify-start gap-2">
          <CareIcon className="care-l-plus text-lg" />
          <span className="font-bold">
            {t(is_prn ? "add_prn_prescription" : "add_prescription_medication")}
          </span>
        </div>
      </ButtonV2>
      {showCreate && (
        <DialogModal
          onClose={() => setShowCreate(false)}
          show={showCreate}
          title={t(
            is_prn ? "add_prn_prescription" : "add_prescription_medication"
          )}
          description={
            <div className="mt-2 flex w-full justify-start gap-2 text-warning-500">
              <CareIcon className="care-l-exclamation-triangle text-base" />
              <span>{t("modification_caution_note")}</span>
            </div>
          }
          className="w-full max-w-3xl lg:min-w-[600px]"
        >
          <CreatePrescriptionForm
            prescription={
              {
                ...(is_prn ? DefaultPRNPrescription : DefaultPrescription),
                prescription_type,
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
