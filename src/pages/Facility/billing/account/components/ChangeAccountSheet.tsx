import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import mutate from "@/Utils/request/mutate";

import TargetAccountPicker from "./TargetAccountPicker";

interface ChangeAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  currentAccountId: string;
  chargeItems: ChargeItemRead[];
  onSuccess: () => void;
}

export default function ChangeAccountSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  currentAccountId,
  chargeItems,
  onSuccess,
}: ChangeAccountSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const { mutate: changeAccount, isPending } = useMutation({
    mutationFn: mutate(chargeItemApi.changeAccount, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("charge_items_account_changed"));
      queryClient.invalidateQueries({
        queryKey: ["infinite-chargeItems", currentAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: ["account"],
      });
      onSuccess();
      onOpenChange(false);
      setSelectedAccountId(null);
    },
    onError: (error) => {
      toast.error(error.message || t("charge_items_account_change_failed"));
    },
  });

  const handleSubmit = () => {
    if (!selectedAccountId) return;
    changeAccount({
      target_account: selectedAccountId,
      charge_items: chargeItems.map((item) => item.id),
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setSelectedAccountId(null);
      }}
    >
      <SheetContent size="md">
        <SheetHeader>
          <SheetTitle>{t("change_account")}</SheetTitle>
          <SheetDescription>
            {t("change_account_description", {
              count: chargeItems.length,
            })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {t("selected_items")} ({chargeItems.length})
              </p>
              <ul className="max-h-40 overflow-y-auto divide-y rounded-md border bg-white">
                {chargeItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-gray-950">{item.title}</span>
                    <MonetaryDisplay
                      amount={item.total_price}
                      className="shrink-0 font-medium text-gray-950"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <TargetAccountPicker
              facilityId={facilityId}
              patientId={patientId}
              currentAccountId={currentAccountId}
              enabled={open}
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            />
          </div>
        </SheetBody>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">
              {t("cancel")}
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAccountId || isPending}
          >
            <ArrowRightLeft className="size-4 mr-2" />
            {isPending ? t("moving") : t("change_account")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
