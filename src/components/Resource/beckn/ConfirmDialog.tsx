import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmSummaryRow {
  label: string;
  value: string;
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  summary: ConfirmSummaryRow[];
  confirmLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
}

/** Popup that summarizes the selection and fires `confirm` on approval. */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  summary,
  confirmLabel,
  confirming,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <dl className="space-y-2 text-sm">
          {summary.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-4 border-b py-2 last:border-b-0"
            >
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={confirming}>
            {confirming ? (
              <CareIcon icon="l-spinner" className="mr-2 size-4 animate-spin" />
            ) : null}
            {confirmLabel ?? t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
