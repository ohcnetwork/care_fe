import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import AddChargeItemsBillingSheet from "@/pages/Facility/billing/account/components/AddChargeItemsBillingSheet";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface AddChargeItemSheetProps {
  facilityId: string;
  invoiceId: string;
  accountId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function AddChargeItemSheet({
  facilityId,
  invoiceId,
  accountId,
  open,
  setOpen,
  trigger,
}: AddChargeItemSheetProps) {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(
    new Set(),
  );
  const [isAddChargeItemsOpen, setIsAddChargeItemsOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  useShortcutSubContext("facility:billing:invoice");

  // Get account information to extract patient ID
  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
    enabled: !!facilityId && !!accountId && open,
  });

  const handleChargeItemsAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["charge-items", qParams],
    });
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ["charge-items", qParams],
    queryFn: query.debounced(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        account: accountId,
        title: qParams.search,
        status: "billable",
      },
    }),
    enabled: open,
  });

  const { mutate: attachItems, isPending } = useMutation({
    mutationFn: mutate(chargeItemApi.addChargeItemsToInvoice, {
      pathParams: { facilityId, invoiceId },
      body: {
        charge_items: Array.from(selectedItems),
      },
    }),
    onSuccess: () => {
      setOpen(false);
      setSelectedItems(new Set());
      queryClient.invalidateQueries({
        queryKey: ["invoice", invoiceId],
      });
    },
  });

  const items = React.useMemo(
    () => (response?.results as ChargeItemRead[]) || [],
    [response?.results],
  );

  // select all by default
  useEffect(() => {
    if (items.length > 0) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  }, [items]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button data-shortcut-id="add-charge-item" variant="outline">
            {t("add_charge_item")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{t("add_charge_items_invoice")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <Input
              placeholder={t("search_charge_items")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddChargeItemsOpen(true)}
            >
              <PlusIcon className="size-4 mr-2" />
              {t("other_charge_items")}
              <ShortcutBadge actionId="other-charge-items" />
            </Button>
          </div>

          {isLoading ? (
            <TableSkeleton count={5} />
          ) : (
            <ScrollArea className="max-h-[calc(100vh-20rem)] scroll-y-auto py-2">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            items.length > 0 &&
                            items.every((item) => selectedItems.has(item.id))
                          }
                          onCheckedChange={handleSelectAll}
                          className="align-middle"
                        />
                      </TableHead>
                      <TableHead>{t("item")}</TableHead>
                      <TableHead>{t("quantity")}</TableHead>
                      <TableHead>{t("unit_price")}</TableHead>
                      <TableHead>{t("total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!items.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          {t("no_charge_items")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked: boolean) =>
                                handleSelectItem(item.id, checked)
                              }
                              className="align-middle"
                            />
                          </TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <MonetaryDisplay
                              amount={getBaseComponent(item)?.amount || "0"}
                            />
                          </TableCell>
                          <TableCell>
                            <MonetaryDisplay amount={item.total_price} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}

          <Pagination totalCount={response?.count || 0} />
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAddChargeItemsOpen}
          >
            {t("cancel")}
            <ShortcutBadge actionId="cancel-action" />
          </Button>
          <Button
            onClick={() =>
              attachItems({ charge_items: Array.from(selectedItems) })
            }
            disabled={
              selectedItems.size === 0 || isPending || isAddChargeItemsOpen
            }
            className="flex flex-row items-center gap-2 justify-between"
          >
            <span>{t("add_selected_items")}</span>
            <ShortcutBadge actionId="submit-action" className="bg-white" />
          </Button>
        </SheetFooter>
      </SheetContent>

      {account?.patient && (
        <AddChargeItemsBillingSheet
          open={isAddChargeItemsOpen}
          onOpenChange={setIsAddChargeItemsOpen}
          facilityId={facilityId}
          patientId={account.patient.id}
          onChargeItemsAdded={handleChargeItemsAdded}
        />
      )}
    </Sheet>
  );
}
