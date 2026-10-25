import { referralResourceError } from "@/components/Referral/referralResourceError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, FileX2 } from "lucide-react";
import { RefObject, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import { FieldError } from "@/components/careui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import mutate from "@/Utils/request/mutate";
import referralApi from "@/types/emr/referral/referralApi";

export function ReferralVoidResponseDialog({
  referralId,
  responseId,
  title,
  returnFocusRef,
}: {
  referralId: string;
  responseId: string;
  title: string;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const markError = useMutation({
    mutationFn: mutate(referralApi.voidResponse, {
      pathParams: { referralId, responseId },
      silent: true,
    }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["referrals"] });
      setOpen(false);
      toast.success(t("referral_response_voided"));
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!markError.isPending) {
          setOpen(value);
          markError.reset();
        }
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon-sm"
            aria-label={t("referral_form_actions")}
          >
            <Ellipsis aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="careui"
          onCloseAutoFocus={(event) => {
            if (open) event.preventDefault();
          }}
        >
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setOpen(true)}
          >
            <FileX2 aria-hidden="true" />
            {t("referral_mark_response_error")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent
        className="careui"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = triggerRef.current?.isConnected
            ? triggerRef.current
            : returnFocusRef.current;
          target?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("referral_mark_response_error")}</DialogTitle>
          <DialogDescription>
            {t("referral_mark_response_error_description", { title })}
          </DialogDescription>
        </DialogHeader>
        {markError.error && (
          <FieldError>
            {referralResourceError(
              markError.error,
              t("referral_response_void_failed"),
            )}
          </FieldError>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={markError.isPending}
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={markError.isPending}
            onClick={() => markError.mutate(undefined)}
          >
            {t("referral_mark_response_error")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
