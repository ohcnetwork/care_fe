import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import AdministerMedicine from "@/components/Medicine/AdministerMedicine";
import CreatePrescriptionForm from "@/components/Medicine/CreatePrescriptionForm";
import DiscontinuePrescription from "@/components/Medicine/DiscontinuePrescription";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import {
  NormalPrescription,
  PRNPrescription,
  Prescription,
} from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";

import useSlug from "@/hooks/useSlug";

import useQuery from "@/Utils/request/useQuery";
import { compareBy } from "@/Utils/utils";

interface Props {
  prescription_type?: Prescription["prescription_type"];
  is_prn?: boolean;
  disabled?: boolean;
  discontinued?: boolean;
  actions?: ("discontinue" | "administer")[];
}

export default function PrescriptionBuilder({
  prescription_type,
  is_prn = false,
  disabled,
  discontinued,
  actions = ["administer", "discontinue"],
}: Props) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const [showCreate, setShowCreate] = useState(false);
  const [showDiscontinueFor, setShowDiscontinueFor] = useState<Prescription>();
  const [showAdministerFor, setShowAdministerFor] = useState<Prescription>();

  const { data, refetch } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: {
      dosage_type: is_prn ? "PRN" : "REGULAR,TITRATED",
      prescription_type,
      discontinued,
      limit: 100,
    },
  });

  return (
    <div>
      {showDiscontinueFor && (
        <DiscontinuePrescription
          prescription={showDiscontinueFor}
          onClose={(success) => {
            setShowDiscontinueFor(undefined);
            if (success) {
              refetch();
            }
          }}
          key={showDiscontinueFor.id}
        />
      )}
      {showAdministerFor && (
        <AdministerMedicine
          prescription={showAdministerFor}
          onClose={(success) => {
            setShowAdministerFor(undefined);
            if (success) {
              refetch();
            }
          }}
          key={showAdministerFor.id}
        />
      )}
      <div className="flex flex-col gap-3">
        {data?.results
          .sort(compareBy("discontinued"))
          ?.map((obj) => (
            <PrescriptionDetailCard
              key={obj.id}
              prescription={obj}
              collapsible
              onDiscontinueClick={
                actions.includes("discontinue")
                  ? () => setShowDiscontinueFor(obj)
                  : undefined
              }
              onAdministerClick={
                actions.includes("administer")
                  ? () => setShowAdministerFor(obj)
                  : undefined
              }
              readonly={disabled}
            />
          ))}
      </div>
      <AuthorizedForConsultationRelatedActions>
        <ButtonV2
          type="button"
          onClick={() => setShowCreate(true)}
          variant="secondary"
          className="mt-4 w-full bg-secondary-200 text-secondary-700 hover:bg-secondary-300 hover:text-secondary-900 focus:bg-secondary-100 focus:text-secondary-900"
          disabled={disabled}
        >
          <div
            className="flex w-full justify-start gap-2"
            id="add-prescription"
          >
            <CareIcon icon="l-plus" className="text-lg" />
            <span className="font-bold">
              {t(
                is_prn ? "add_prn_prescription" : "add_prescription_medication",
              )}
            </span>
          </div>
        </ButtonV2>
      </AuthorizedForConsultationRelatedActions>
      {showCreate && (
        <DialogModal
          onClose={() => setShowCreate(false)}
          show={showCreate}
          title={t(
            is_prn ? "add_prn_prescription" : "add_prescription_medication",
          )}
          description={
            <div className="mt-2 flex w-full justify-start gap-2 text-warning-500">
              <CareIcon icon="l-exclamation-triangle" className="text-base" />
              <span>{t("modification_caution_note")}</span>
            </div>
          }
          className="w-full max-w-4xl lg:min-w-[768px]"
        >
          <CreatePrescriptionForm
            prescription={
              {
                ...(is_prn ? DefaultPRNPrescription : DefaultPrescription),
                prescription_type,
              } as Prescription
            }
            onDone={() => {
              setShowCreate(false);
              refetch();
            }}
          />
        </DialogModal>
      )}
    </div>
  );
}

const DefaultPrescription: Partial<NormalPrescription> = {
  dosage_type: "REGULAR",
  route: "ORAL",
};
const DefaultPRNPrescription: Partial<PRNPrescription> = {
  dosage_type: "PRN",
  route: "ORAL",
};
