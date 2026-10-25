import { referralResourceError } from "@/components/Referral/referralResourceError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { ComponentProps, ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import { Field, FieldError, FieldLabel } from "@/components/careui/field";
import { Input } from "@/components/careui/input";
import { Textarea } from "@/components/careui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ReferralRetrieve,
  ReferralUpdate,
} from "@/types/emr/referral/referral";
import referralApi from "@/types/emr/referral/referralApi";
import mutate from "@/Utils/request/mutate";

interface ReferralEditDialogProps {
  referral: ReferralRetrieve;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
}

export function ReferralEditDialog({
  referral,
  open: controlledOpen,
  onOpenChange,
  trigger,
  onCloseAutoFocus,
}: ReferralEditDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [pending, setPending] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm">
              <Pencil className="size-4" />
              {t("referral_edit")}
            </Button>
          )}
        </DialogTrigger>
      )}
      {open && (
        <ReferralEditContent
          referral={referral}
          onClose={() => setOpen(false)}
          onPending={setPending}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </Dialog>
  );
}

function ReferralEditContent({
  referral,
  onClose,
  onPending,
  onCloseAutoFocus,
}: {
  referral: ReferralRetrieve;
  onClose: () => void;
  onPending: (value: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
}) {
  const { t } = useTranslation();
  const id = useId();
  const client = useQueryClient();
  const [baseline] = useState({ title: referral.title, note: referral.note });
  const [title, setTitle] = useState(baseline.title);
  const [note, setNote] = useState(baseline.note);
  const payload: ReferralUpdate = {
    ...(title.trim() !== baseline.title ? { title: title.trim() } : {}),
    ...(note !== baseline.note ? { note } : {}),
  };
  const update = useMutation({
    mutationFn: mutate(referralApi.update, {
      pathParams: { referralId: referral.id },
      silent: true,
    }),
    onMutate: () => onPending(true),
    onSettled: () => onPending(false),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["referrals"] });
      toast.success(t("referral_updated"));
      onClose();
    },
  });

  return (
    <DialogContent
      className="careui max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <DialogHeader>
        <DialogTitle>{t("referral_edit")}</DialogTitle>
        <DialogDescription>
          {t("referral_metadata_edit_description")}
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim() && !update.isPending && Object.keys(payload).length)
            update.mutate(payload);
        }}
      >
        <Field>
          <FieldLabel htmlFor={`${id}-title`}>{t("referral_title")}</FieldLabel>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={255}
            disabled={update.isPending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-note`}>{t("note")}</FieldLabel>
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={update.isPending}
            rows={3}
          />
        </Field>
        {update.error && (
          <FieldError>
            {referralResourceError(update.error, t("referral_update_failed"))}
          </FieldError>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={update.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={
              update.isPending || !title.trim() || !Object.keys(payload).length
            }
          >
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("save_changes")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
