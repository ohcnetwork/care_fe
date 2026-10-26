import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Ellipsis, Pencil, Play } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  REFERRAL_STATUSES,
  ReferralRetrieve,
  ReferralStatus,
} from "@/types/emr/referral/referral";
import referralApi from "@/types/emr/referral/referralApi";
import { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import { ReferralEditDialog } from "./ReferralEditDialog";
import { referralResourceError } from "./referralResourceError";

export function ReferralProgress({ referral }: { referral: ReferralRetrieve }) {
  const { t } = useTranslation();
  const stages = ["pending", "in_progress", "completed"] as const;
  const current = stages.findIndex((stage) => stage === referral.status);
  if (current === -1) return null;
  return (
    <ol
      aria-label={t("referral_progress")}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"
    >
      {stages.map((stage, index) => (
        <li
          key={stage}
          aria-current={current === index ? "step" : undefined}
          className={cn(
            "flex items-center gap-1.5",
            index <= current ? "text-primary" : "text-muted-foreground",
          )}
        >
          {index < current || referral.status === "completed" ? (
            <Check className="size-3.5" />
          ) : (
            <span className="size-1.5 rounded-full bg-current" />
          )}
          {t(`referral_status_${stage}`)}
          {index < stages.length - 1 && (
            <span aria-hidden className="ml-1 text-muted-foreground">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ReferralWorkflowActions({
  referral,
  canWrite,
  onCopyLink,
}: {
  referral: ReferralRetrieve;
  canWrite: boolean;
  onCopyLink?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const [confirmation, setConfirmation] = useState<{
    status: ReferralStatus;
    baseline: ReferralStatus;
  } | null>(null);
  const hasResponse = referral.questionnaire_responses.some(
    (response) =>
      response.questionnaire_type === "response" &&
      response.status === "completed",
  );
  const update = useMutation({
    mutationFn: async ({
      status,
      baseline,
    }: {
      status: ReferralStatus;
      baseline: ReferralStatus;
    }) => {
      const latest = await callApi(referralApi.get, {
        pathParams: { referralId: referral.id },
        silent: true,
      });
      client.setQueryData(["referrals", "detail", referral.id], latest);
      if (latest.status === status) return latest;
      if (latest.status !== baseline) {
        throw new HTTPError({
          message: "Referral status changed",
          status: 409,
          silent: true,
          cause: { detail: t("referral_status_changed") },
        });
      }
      // Recheck before writing; the API does not offer atomic status comparison.
      return callApi(referralApi.update, {
        pathParams: { referralId: referral.id },
        body: { status },
        silent: true,
      });
    },
    retry: false,
    onError: async (error) => {
      if (error instanceof HTTPError && error.status === 409) {
        await client.invalidateQueries({ queryKey: ["referrals"] });
      }
    },
    onSuccess: async () => {
      setConfirmation(null);
      await client.invalidateQueries({ queryKey: ["referrals"] });
      toast.success(t("referral_updated"));
    },
  });
  const statusLabel = (status: ReferralStatus) => {
    switch (status) {
      case "pending":
        return t("referral_mark_pending");
      case "in_progress":
        return t(
          ["completed", "cancelled", "rejected"].includes(referral.status)
            ? "referral_reopen"
            : "referral_start",
        );
      case "completed":
        return t("referral_complete");
      case "cancelled":
        return t("referral_cancel");
      case "rejected":
        return t("referral_reject");
    }
  };
  const confirmStatus = (status: ReferralStatus) => {
    returnFocusRef.current = menuTriggerRef.current;
    update.reset();
    setConfirmation({ status, baseline: referral.status });
  };
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    const target = returnFocusRef.current?.isConnected
      ? returnFocusRef.current
      : menuTriggerRef.current;
    target?.focus({ preventScroll: true });
  };
  if (!canWrite && !onCopyLink) return null;
  return (
    <>
      {canWrite && referral.status === "pending" ? (
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({ status: "in_progress", baseline: referral.status })
          }
        >
          {update.isPending ? (
            <Spinner className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {t("referral_start")}
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuTriggerRef}
            size="icon-sm"
            variant="outline"
            disabled={update.isPending}
            aria-label={t("referral_actions")}
          >
            <Ellipsis aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-52"
          align="end"
          onCloseAutoFocus={(event) => {
            if (editOpen || confirmation) event.preventDefault();
          }}
        >
          {canWrite && (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  returnFocusRef.current = menuTriggerRef.current;
                  setEditOpen(true);
                }}
              >
                <Pencil className="size-4" />
                {t("referral_edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>
                {t("referral_change_status")}
              </DropdownMenuLabel>
              {REFERRAL_STATUSES.filter(
                (status) => status !== referral.status,
              ).map((status) => (
                <DropdownMenuItem
                  key={status}
                  variant={
                    ["cancelled", "rejected"].includes(status)
                      ? "destructive"
                      : "default"
                  }
                  onSelect={() => confirmStatus(status)}
                >
                  {statusLabel(status)}
                </DropdownMenuItem>
              ))}
            </>
          )}
          {onCopyLink && (
            <>
              {canWrite && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={() => void onCopyLink()}>
                <Copy className="size-4" />
                {t("copy_link")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {canWrite && (
        <>
          <ReferralEditDialog
            referral={referral}
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={null}
            onCloseAutoFocus={restoreFocus}
          />
        </>
      )}
      {update.error && !confirmation && (
        <FieldError role="alert">
          {referralResourceError(update.error, t("referral_update_failed"))}
        </FieldError>
      )}
      <AlertDialog
        open={canWrite && !!confirmation}
        onOpenChange={(open) => {
          if (!update.isPending && !open) setConfirmation(null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={restoreFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation && statusLabel(confirmation.status)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.status === "completed"
                ? t(
                    hasResponse
                      ? "referral_complete_description"
                      : "referral_complete_without_response",
                  )
                : t("referral_change_status_description", {
                    status:
                      confirmation &&
                      t(`referral_status_${confirmation.status}`),
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {update.error && (
            <FieldError role="alert">
              {referralResourceError(update.error, t("referral_update_failed"))}
            </FieldError>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={update.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              disabled={update.isPending}
              variant={
                confirmation &&
                ["cancelled", "rejected"].includes(confirmation.status)
                  ? "destructive"
                  : "default"
              }
              onClick={() => {
                if (confirmation) update.mutate(confirmation);
              }}
            >
              {update.isPending && <Spinner className="size-4 animate-spin" />}
              {confirmation && statusLabel(confirmation.status)}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
