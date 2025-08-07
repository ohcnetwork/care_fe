import { BedIcon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import CriticalActionConfirmationDialog from "@/components/Common/CriticalActionConfirmationDialog";

import { type EncounterEdit } from "@/types/emr/encounter/encounter";

interface DischargeConfirmationDialogProps {
  encounter: EncounterEdit;
  onConfirm: (updates: Partial<Omit<EncounterEdit, "patient">>) => void;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

const DischargeConfirmationDialog = ({
  encounter,
  onConfirm,
  disabled = false,
  trigger,
}: DischargeConfirmationDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const confirmationText = "Discharge Patient";

  const handleConfirm = () => {
    onConfirm({
      status: "discharged",
      period: {
        ...encounter.period,
        end: new Date().toISOString(),
      },
    });
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" disabled={disabled}>
      {t("mark_for_discharge")}
    </Button>
  );

  const description = (
    <>
      <p>{t("discharge_confirmation_message")}</p>
      <ul className="list-disc list-inside space-y-1 mt-2">
        <li>{t("discharge_confirmation_status_change")}</li>
        <li>{t("discharge_confirmation_summary_required")}</li>
        <li>{t("discharge_confirmation_date")}</li>
      </ul>
      <p className="mt-3">
        <Trans
          i18nKey="discharge_this_action_is_permanent_and_cannot_be_undone"
          components={{ strong: <strong className="font-semibold" /> }}
        />
      </p>
    </>
  );

  return (
    <CriticalActionConfirmationDialog
      trigger={trigger ?? defaultTrigger}
      title={t("confirm_discharge")}
      description={description}
      confirmationText={confirmationText}
      actionButtonText={t("proceed")}
      onConfirm={handleConfirm}
      isLoading={false}
      open={open}
      onOpenChange={setOpen}
      variant="primary"
      icon={<BedIcon className="size-4 text-primary-500" />}
    />
  );
};

export default DischargeConfirmationDialog;
