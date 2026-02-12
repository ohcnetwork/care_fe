import { useMutation } from "@tanstack/react-query";
import { MoreHorizontal, PencilIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import mutate from "@/Utils/request/mutate";
import queryClient from "@/Utils/request/queryClient";

const STATUS_CHANGE_TARGETS = [
  ChargeItemStatus.not_billable,
  ChargeItemStatus.entered_in_error,
  ChargeItemStatus.aborted,
] as const;

interface ChargeItemActionsMenuProps {
  item: ChargeItemRead;
  facilityId: string;
  accountId: string;
  onEdit: (item: ChargeItemRead) => void;
}

export function ChargeItemActionsMenu({
  item,
  facilityId,
  accountId,
  onEdit,
}: ChargeItemActionsMenuProps) {
  const { t } = useTranslation();
  const [pendingStatus, setPendingStatus] = useState<ChargeItemStatus | null>(
    null,
  );

  const { mutate: updateStatus } = useMutation({
    mutationFn: (status: ChargeItemStatus) =>
      mutate(chargeItemApi.updateChargeItem, {
        pathParams: { facilityId, chargeItemId: item.id },
      })({
        id: item.id,
        title: item.title,
        status,
        quantity: item.quantity,
        unit_price_components: item.unit_price_components,
        override_reason: item.override_reason,
        note: item.note,
      }),
    onSuccess: () => {
      toast.success(t("charge_item_updated"));
      queryClient.invalidateQueries({ queryKey: ["chargeItems", accountId] });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            asChild
            disabled={item.status !== ChargeItemStatus.billable}
          >
            <div
              className="flex items-center cursor-pointer"
              onClick={() => onEdit(item)}
            >
              <PencilIcon className="mr-2 size-4" />
              <span>{t("edit")}</span>
            </div>
          </DropdownMenuItem>
          {item.status === ChargeItemStatus.billable && (
            <>
              {STATUS_CHANGE_TARGETS.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setPendingStatus(status)}
                  className="cursor-pointer"
                >
                  <span>{t("mark_as_status", { status: t(status) })}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={t("confirm_status_change")}
        description={
          pendingStatus &&
          t("confirm_charge_item_status_change", {
            title: item.title,
            status: t(pendingStatus),
          })
        }
        confirmText={
          pendingStatus
            ? t("mark_as_status", { status: t(pendingStatus) })
            : t("confirm")
        }
        variant="destructive"
        onConfirm={() => {
          if (pendingStatus) {
            updateStatus(pendingStatus);
            setPendingStatus(null);
          }
        }}
      />
    </>
  );
}
