import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import SlideOver from "@/CAREUI/interactive/SlideOver";

import ButtonV2 from "@/components/Common/ButtonV2";
import MedicineAdministration from "@/components/Medicine/MedicineAdministration";
import { Prescription } from "@/components/Medicine/models";

interface Props {
  prescriptions: Prescription[];
  onDone: () => void;
}

export default function BulkAdminister({ prescriptions, onDone }: Props) {
  const { t } = useTranslation();
  const [showBulkAdminister, setShowBulkAdminister] = useState(false);

  return (
    <>
      <ButtonV2
        id="bulk-administer"
        ghost
        border
        onClick={() => setShowBulkAdminister(true)}
        className="w-full"
        disabled={prescriptions.length === 0}
      >
        <CareIcon icon="l-syringe" className="text-lg" />
        <span className="hidden lg:block">{t("administer_medicines")}</span>
        <span className="block lg:hidden">{t("administer")}</span>
      </ButtonV2>
      <SlideOver
        title={t("administer_medicines")}
        dialogClass="w-full max-w-sm sm:max-w-md md:max-w-[1300px]"
        open={showBulkAdminister}
        setOpen={setShowBulkAdminister}
      >
        <MedicineAdministration
          prescriptions={prescriptions}
          onDone={() => {
            setShowBulkAdminister(false);
            onDone();
          }}
        />
      </SlideOver>
    </>
  );
}
