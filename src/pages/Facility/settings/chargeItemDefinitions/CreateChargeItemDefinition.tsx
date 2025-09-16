import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";

import { ChargeItemDefinitionForm } from "./ChargeItemDefinitionForm";

interface CreateChargeItemDefinitionProps {
  facilityId: string;
}

export function CreateChargeItemDefinition({
  facilityId,
}: CreateChargeItemDefinitionProps) {
  const { t } = useTranslation();

  return (
    <Page
      title={t("create_charge_item_definition")}
      className="mx-auto max-w-screen-lg"
    >
      <div className="container">
        <div className="mb-4">
          <p className="text-gray-600">
            {t("create_charge_item_definition_description")}
          </p>
        </div>

        <ChargeItemDefinitionForm facilityId={facilityId} />
      </div>
    </Page>
  );
}
