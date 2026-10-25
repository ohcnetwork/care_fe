import { Plus } from "lucide-react";
import { ComponentProps, ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/careui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import { ReferralResponseEditor } from "./ReferralResponseEditor";

interface ReferralResponseDialogProps {
  referral: ReferralRetrieve;
  responseOnly?: boolean;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
}

export function ReferralResponseDialog({
  referral,
  responseOnly = false,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCloseAutoFocus,
}: ReferralResponseDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [sessionActive, setSessionActive] = useState(false);
  const [pending, setPending] = useState(false);
  const requestClose = useRef<(() => void) | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (pending) return;
        if (value) {
          setSessionActive(true);
          setOpen(true);
        } else {
          requestClose.current?.();
        }
      }}
    >
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm">
              <Plus className="size-4" />
              {t("referral_add_request_information")}
            </Button>
          )}
        </DialogTrigger>
      )}
      {(open || sessionActive) && (
        <ReferralResponseEditor
          key={referral.id}
          referral={referral}
          responseOnly={responseOnly}
          onClose={(retainAttempt = false) => {
            setOpen(false);
            setSessionActive(retainAttempt);
          }}
          onPending={setPending}
          requestCloseRef={requestClose}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </Dialog>
  );
}
