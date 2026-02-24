import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  Package,
  PlusIcon,
  SquareArrowOutUpRight,
  XIcon,
} from "lucide-react";
import { Link, navigate } from "raviger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MonetaryDisplay,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

import { useShortcutSubContext } from "@/context/ShortcutContext";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import UserSelector from "@/components/Common/UserSelector";

import { cn } from "@/lib/utils";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ACCOUNT_STATUS_COLORS } from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  InvoiceCreate,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { UserReadMinimal } from "@/types/user/user";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";

import { EditInvoiceDialog } from "@/components/Billing/Invoice/EditInvoiceDialog";
import BackButton from "@/components/Common/BackButton";
import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { add, round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import AddChargeItemsBillingSheet from "./components/AddChargeItemsBillingSheet";
import ChargeItemActionsMenu from "./components/ChargeItemActions";
import QuickAddChargeItemsSheet from "./components/QuickAddChargeItemsSheet";

const ITEMS_PER_PAGE = 200;

const formSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
  payment_terms: z.string().optional(),
  note: z.string().optional(),
  charge_items: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateInvoicePageProps {
  facilityId: string;
  accountId: string;
  preSelectedChargeItems?: ChargeItemRead[];
  redirectInNewTab?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  sourceUrl?: string;
  locationId?: string;
  disableCreateChargeItems?: boolean;
  dispenseOrderId?: string;
  skipNavigation?: boolean;
}

export function CreateInvoicePage({
  facilityId,
  accountId,
  preSelectedChargeItems,
  redirectInNewTab = false,
  onSuccess,
  onCancel,
  showHeader = true,
  sourceUrl,
  locationId,
  disableCreateChargeItems = false,
  dispenseOrderId,
  skipNavigation = false,
}: CreateInvoicePageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hasInitializedSelections = useRef(false);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLButtonElement>(null);
  const hasAutoOpenedPicker = useRef(false);
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(false);

  useShortcutSubContext("facility:billing");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>(
    () => {
      if (!preSelectedChargeItems) return {};
      return preSelectedChargeItems.reduce(
        (acc, item) => {
          acc[item.id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
    },
  );
  const [isAddChargeItemsOpen, setIsAddChargeItemsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChargeItem, setSelectedChargeItem] =
    useState<ChargeItemRead | null>(null);
  const [pendingItem, setPendingItem] = useState<{
    definition: ChargeItemDefinitionRead;
    quantity: string;
    performer?: UserReadMinimal;
  } | null>(null);

  const { mutate: applyInlineChargeItem, isPending: isApplyingInline } =
    useMutation({
      mutationFn: mutate(chargeItemApi.applyChargeItemDefinitions, {
        pathParams: { facilityId },
      }),
      onSuccess: () => {
        handleChargeItemsAdded();
        setPendingItem(null);
        hasAutoOpenedPicker.current = true;
        toast.success(t("charge_items_added_successfully"));
        setTimeout(() => pickerRef.current?.focus(), 100);
      },
      onError: () => {
        toast.error(t("charge_items_add_failed"));
      },
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: InvoiceStatus.draft,
      payment_terms: import.meta.env.REACT_DEFAULT_PAYMENT_TERMS || "",
      note: "",
      charge_items: preSelectedChargeItems?.map((item) => item.id) || [],
    },
  });

  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
    enabled: !!facilityId && !!accountId,
  });

  // Track known item IDs to detect new items
  const knownItemIds = useRef<Set<string>>(new Set());

  const handleChargeItemsAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ["chargeItems", facilityId, accountId],
    });
  };

  const {
    data: chargeItemsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chargeItems", facilityId, accountId],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(chargeItemApi.listChargeItem, {
        pathParams: { facilityId },
        queryParams: {
          limit: String(ITEMS_PER_PAGE),
          offset: String(pageParam),
          status: ChargeItemStatus.billable,
          account: accountId,
          ordering: "created_date",
        },
      })({ signal });
      return response as PaginatedResponse<ChargeItemRead>;
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedResponse<ChargeItemRead>,
      allPages: PaginatedResponse<ChargeItemRead>[],
    ) => {
      const currentOffset = allPages.length * ITEMS_PER_PAGE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!facilityId && !!accountId && !preSelectedChargeItems,
  });

  const createMutation = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: (invoice: InvoiceRead) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", accountId] });
      toast.success(t("invoice_created_successfully"));

      // If skipNavigation is true, just call onSuccess without navigating
      if (skipNavigation) {
        onSuccess?.();
        return;
      }

      // Navigate to the new invoice
      const invoiceUrl = `/facility/${facilityId}/billing/invoices/${invoice.id}${sourceUrl ? `?sourceUrl=${sourceUrl}` : ""}`;
      if (redirectInNewTab) {
        window.open(invoiceUrl, "_blank");
        onSuccess?.();
      } else {
        onSuccess?.();
        navigate(invoiceUrl);
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: InvoiceCreate = {
      ...values,
      account: accountId,
    };
    createMutation.mutate(payload);
  };

  const handleRowSelection = (id: string) => {
    setSelectedRows((prev: Record<string, boolean>) => {
      const newSelection = { ...prev };
      newSelection[id] = !prev[id];

      // Update form value
      const selectedIds = Object.entries(newSelection)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);

      form.setValue("charge_items", selectedIds);

      return newSelection;
    });
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const chargeItems =
    preSelectedChargeItems ??
    chargeItemsData?.pages.flatMap((page) => page.results) ??
    [];

  // Calculate total of selected items
  const selectedItemsTotal = useMemo(() => {
    return chargeItems
      .filter((item) => selectedRows[item.id])
      .reduce((sum, item) => add(sum, item.total_price ?? 0), add(0, 0))
      .toString();
  }, [chargeItems, selectedRows]);

  useEffect(() => {
    if (chargeItems.length === 0) return;

    // First load - select all items
    if (!hasInitializedSelections.current) {
      setSelectedRows(
        chargeItems.reduce(
          (acc, item) => {
            acc[item.id] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      );
      form.setValue(
        "charge_items",
        chargeItems.map((item) => item.id),
      );
      // Track all current items as known
      knownItemIds.current = new Set(chargeItems.map((item) => item.id));
      hasInitializedSelections.current = true;
      if (chargeItems.length > 0) {
        hasAutoOpenedPicker.current = true;
      }
      return;
    }

    // After initial load - auto-select any new items (e.g., from Quick Add)
    const newItems = chargeItems.filter(
      (item) => !knownItemIds.current.has(item.id),
    );
    if (newItems.length > 0) {
      setSelectedRows((prev) => {
        const updated = { ...prev };
        newItems.forEach((item) => {
          updated[item.id] = true;
        });
        return updated;
      });
      form.setValue("charge_items", [
        ...form.getValues("charge_items"),
        ...newItems.map((item) => item.id),
      ]);
      // Update known items
      newItems.forEach((item) => knownItemIds.current.add(item.id));
    }
  }, [chargeItems, form]);

  const handleConfirmPendingItem = useCallback(() => {
    if (!pendingItem || !account?.patient) return;
    const qty = Number(pendingItem.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error(t("quantity_must_be_positive"));
      quantityInputRef.current?.focus();
      return;
    }
    applyInlineChargeItem({
      requests: [
        {
          charge_item_definition: pendingItem.definition.slug,
          quantity: pendingItem.quantity,
          patient: account.patient.id,
          account: account.id,
          ...(pendingItem.performer
            ? { performer_actor: pendingItem.performer.id }
            : {}),
        },
      ],
    });
  }, [pendingItem, account?.patient, applyInlineChargeItem, t]);

  const handlePendingKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setPendingItem(null);
      pickerRef.current?.focus();
    }
  }, []);

  // Auto-focus the picker when the page loads (only if it won't auto-open)
  useEffect(() => {
    if (!disableCreateChargeItems && !isLoading) {
      const willAutoOpen =
        !hasAutoOpenedPicker.current && chargeItems.length === 0;
      if (!willAutoOpen) {
        const timer = setTimeout(() => pickerRef.current?.focus(), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [disableCreateChargeItems, isLoading, chargeItems.length]);

  const tableHeadClass = "border-r border-gray-200 font-semibold text-center";
  const tableCellClass =
    "border-r border-gray-200 font-medium text-gray-950 text-sm";

  return (
    <div className="space-y-8 relative">
      {showHeader && (
        <div className="flex items-start justify-between flex-col sm:flex-row gap-4 sm:items-center border-b-3 border-double pb-4">
          <div className="flex gap-3 sm:gap-6 flex-col md:flex-row">
            <BackButton
              variant="link"
              className="px-0 justify-start"
              fallbackUrl={`/facility/${facilityId}/billing/account/${accountId}`}
            >
              <ChevronLeft />
              <span>{t("back")}</span>
            </BackButton>
            <div className="h-auto w-px bg-gray-300" aria-hidden="true" />
            {account?.patient && (
              <>
                <div>
                  <span className="text-gray-700 text-sm font-medium">
                    {t("patient_name")}
                  </span>
                  <div className="font-semibold text-gray-950">
                    {account.patient.name}
                  </div>
                </div>
                <div>
                  <span className="text-gray-700 text-sm font-medium">
                    {t("account")}
                  </span>
                  <Link
                    href={`/facility/${facilityId}/billing/account/${accountId}`}
                  >
                    <div className="font-semibold text-gray-950 underline">
                      {account.name}
                      <SquareArrowOutUpRight className="ml-1 size-4 inline" />
                    </div>
                  </Link>
                </div>
                <div>
                  <span className="text-gray-700 text-sm font-medium">
                    {t("status")}
                  </span>
                  <div>
                    <Badge variant={ACCOUNT_STATUS_COLORS[account.status]}>
                      {t(account.status)}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="md:col-span-2 overflow-x-auto max-w-5xl mx-auto">
        <div className="flex sm:flex-row flex-col sm:items-center gap-4 justify-between items-start mb-4">
          <div className="flex flex-row items-center gap-2">
            <span className="font-semibold text-gray-950 text-base">
              {t("create_invoice")}
            </span>
            <Badge variant="secondary">{t("draft")}</Badge>
          </div>
          {!disableCreateChargeItems && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickAddOpen(true)}
              >
                <Package className="size-4 mr-2" />
                {t("quick_add")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddChargeItemsOpen(true)}
              >
                <PlusIcon className="size-4 mr-2" />
                {t("add_charge_items")}
              </Button>
            </div>
          )}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-4 border border-gray-200 bg-white text-gray-950 rounded-sm shadow-sm">
              {isLoading ? (
                <TableSkeleton count={3} />
              ) : (
                <div className="rounded-t-sm border border-gray-300">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead
                          className={cn(
                            tableHeadClass,
                            "w-[50px] align-middle",
                          )}
                        >
                          <div className="flex items-center p-1">
                            <Checkbox
                              checked={
                                chargeItems.length > 0 &&
                                chargeItems.every(
                                  (item) => selectedRows[item.id],
                                )
                              }
                              onCheckedChange={(_checked) => {
                                const newSelection = { ...selectedRows };
                                const allSelected = chargeItems.every(
                                  (item) => selectedRows[item.id],
                                );

                                chargeItems.forEach((item) => {
                                  newSelection[item.id] = !allSelected;
                                });

                                setSelectedRows(newSelection);
                                form.setValue(
                                  "charge_items",
                                  Object.entries(newSelection)
                                    .filter(([_, selected]) => selected)
                                    .map(([id]) => id),
                                );
                              }}
                              disabled={chargeItems.length === 0}
                            />
                          </div>
                        </TableHead>
                        <TableHead className={cn(tableHeadClass, "text-left")}>
                          {t("items")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {t("quantity")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {t("unit_price")} ({getCurrencySymbol()})
                        </TableHead>
                        <TableHead className={cn(tableHeadClass, "text-left")}>
                          {t("performer")}
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          {t("amount")} ({getCurrencySymbol()})
                        </TableHead>
                        <TableHead className="font-semibold text-center w-[50px]">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargeItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-20 text-center text-gray-400"
                          >
                            {t("no_billable_items")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        chargeItems.filter(Boolean).map((item) => {
                          const baseComponent = getBaseComponent(item);
                          const baseAmount = baseComponent?.amount || "0";

                          return (
                            <TableRow
                              key={item.id}
                              className="border-b border-gray-200 hover:bg-muted/50"
                            >
                              <TableCell
                                className={cn(tableCellClass, "align-middle")}
                              >
                                <div className="flex items-center p-1">
                                  <Checkbox
                                    checked={selectedRows[item.id] || false}
                                    onCheckedChange={() =>
                                      handleRowSelection(item.id)
                                    }
                                  />
                                </div>
                              </TableCell>
                              <TableCell
                                className={cn(
                                  tableCellClass,
                                  "font-semibold min-w-40",
                                )}
                              >
                                <div className="font-medium text-base">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatName(item.created_by)}
                                  {" · "}
                                  {formatDateTime(
                                    item.created_date,
                                    "hh:mm a - DD MMM, YYYY",
                                  )}
                                </div>
                              </TableCell>
                              <TableCell
                                className={cn(tableCellClass, "text-center")}
                              >
                                {round(item.quantity)}
                              </TableCell>
                              <TableCell
                                className={cn(tableCellClass, "text-right")}
                              >
                                <MonetaryDisplay amount={baseAmount} />
                              </TableCell>
                              <TableCell
                                className={cn(
                                  tableCellClass,
                                  "max-w-32 whitespace-pre-wrap",
                                )}
                              >
                                {formatName(item.performer_actor)}
                              </TableCell>
                              <TableCell className="text-right">
                                <MonetaryDisplay
                                  amount={item.total_price}
                                  hideCurrency
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <ChargeItemActionsMenu
                                  item={item}
                                  facilityId={facilityId}
                                  accountId={accountId}
                                  onEdit={(item) => {
                                    setSelectedChargeItem(item);
                                    setIsEditDialogOpen(true);
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!disableCreateChargeItems && account?.patient && (
                <div className="border-x border-b border-gray-300 -mt-0 rounded-b-sm">
                  {pendingItem && (
                    <div
                      key={pendingItem.definition.slug}
                      className="border-b border-gray-200 bg-primary-50/50"
                      onKeyDown={handlePendingKeyDown}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-950">
                            {pendingItem.definition.title}
                          </div>
                          {pendingItem.definition.price_components?.[0] && (
                            <div className="text-xs text-gray-500">
                              <MonetaryDisplay
                                amount={
                                  pendingItem.definition.price_components[0]
                                    .amount || 0
                                }
                              />
                              {" / "}
                              {t("unit")}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">
                              {t("quantity")}
                            </label>
                            <Input
                              ref={quantityInputRef}
                              type="number"
                              min={1}
                              value={pendingItem.quantity}
                              onChange={(e) =>
                                setPendingItem((prev) =>
                                  prev
                                    ? { ...prev, quantity: e.target.value }
                                    : null,
                                )
                              }
                              className="w-20 h-8"
                              autoFocus
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleConfirmPendingItem();
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">
                              {t("performer")}
                            </label>
                            <UserSelector
                              selected={pendingItem.performer}
                              onChange={(user) =>
                                setPendingItem((prev) =>
                                  prev ? { ...prev, performer: user } : null,
                                )
                              }
                              placeholder={t("select_performer")}
                              facilityId={facilityId}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">
                              &nbsp;
                            </label>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="primary"
                                className="size-8"
                                onClick={handleConfirmPendingItem}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleConfirmPendingItem();
                                  }
                                }}
                                disabled={isApplyingInline}
                                title={`${t("confirm")} (Enter)`}
                              >
                                {isApplyingInline ? (
                                  <div className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <CheckIcon className="size-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                onClick={() => {
                                  setPendingItem(null);
                                  pickerRef.current?.focus();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    setPendingItem(null);
                                    pickerRef.current?.focus();
                                  }
                                }}
                                disabled={isApplyingInline}
                                title={`${t("cancel")} (Esc)`}
                              >
                                <XIcon className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!pendingItem && (
                    <div className="p-2">
                      <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
                        ref={pickerRef}
                        facilityId={facilityId}
                        value={undefined}
                        onValueChange={(selectedDef) => {
                          if (!selectedDef) return;
                          setPendingItem({
                            definition: selectedDef as ChargeItemDefinitionRead,
                            quantity: "1",
                          });
                        }}
                        placeholder={t("select_charge_item_definition")}
                        disabled={isApplyingInline}
                        className="w-full"
                        defaultOpen={
                          !hasAutoOpenedPicker.current &&
                          chargeItems.length === 0 &&
                          !isLoading
                        }
                        resourceType={
                          ResourceCategoryResourceType.charge_item_definition
                        }
                        listDefinitions={{
                          queryFn:
                            chargeItemDefinitionApi.listChargeItemDefinition,
                          pathParams: { facilityId },
                          queryParams: {
                            status: ChargeItemDefinitionStatus.active,
                          },
                        }}
                        translationBaseKey="charge_item_definition"
                      />
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="charge_items"
                render={({ field }) => (
                  <FormMessage className="text-xs text-gray-950 italic mt-3">
                    {field.value.length > 0
                      ? t("selected_items_count_one", {
                          count: field.value.length,
                        })
                      : t("no_items_selected")}
                  </FormMessage>
                )}
              />

              {/* Invoice Total */}
              {chargeItems.length > 0 && (
                <div className="flex flex-col items-end space-y-2 text-gray-950 font-normal text-sm mt-4">
                  <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />
                  <div className="flex w-64 justify-between font-bold">
                    <span>{t("invoice_total")}</span>
                    <MonetaryDisplay amount={selectedItemsTotal} />
                  </div>
                  <div className="p-1 border-b-2 border-dashed border-gray-200 w-full" />
                  <p className="text-xs text-gray-500">
                    {t("includes_all_taxes")}
                  </p>
                </div>
              )}

              {hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading || isFetchingNextPage}
                  >
                    {isFetchingNextPage ? t("loading_more") : t("load_more")}
                  </Button>
                </div>
              )}
            </div>

            <Collapsible
              open={optionalFieldsOpen}
              onOpenChange={setOptionalFieldsOpen}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-950 transition-colors py-2 group"
                >
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform duration-200",
                      optionalFieldsOpen && "rotate-90",
                    )}
                  />
                  <span className="font-medium">
                    {t("payment_terms_and_note")}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-500">
                    ({t("optional")})
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-2 pb-4">
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("payment_terms")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={createMutation.isPending}
                            placeholder={t("payment_terms_placeholder")}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("note")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={createMutation.isPending}
                            placeholder={t("invoice_note_placeholder")}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end space-x-4">
              <BackButton
                type="button"
                variant="ghost"
                className="text-base font-semibold"
                {...(onCancel && { onClick: onCancel })}
                disabled={createMutation.isPending}
                data-shortcut-id="go-back"
              >
                <span className="underline">{t("cancel")}</span>
              </BackButton>
              {dispenseOrderId && (
                <Button
                  type="button"
                  variant="outline_primary"
                  disabled={!locationId}
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}`,
                    )
                  }
                >
                  {t("dispense_now")}
                  <ShortcutBadge actionId="view-prescriptions" />
                </Button>
              )}
              <Button
                type="submit"
                variant="primary_gradient"
                disabled={
                  createMutation.isPending ||
                  isAddChargeItemsOpen ||
                  isQuickAddOpen ||
                  isEditDialogOpen ||
                  isApplyingInline ||
                  chargeItems.length === 0
                }
              >
                {createMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    {t("creating")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PlusIcon className="size-4" />
                    {t("create_invoice")}
                    <ShortcutBadge actionId="submit-action" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {account?.patient && (
        <>
          <AddChargeItemsBillingSheet
            open={isAddChargeItemsOpen}
            onOpenChange={setIsAddChargeItemsOpen}
            facilityId={facilityId}
            patientId={account.patient.id}
            accountId={account.id}
            onChargeItemsAdded={handleChargeItemsAdded}
          />
          <QuickAddChargeItemsSheet
            open={isQuickAddOpen}
            onOpenChange={setIsQuickAddOpen}
            facilityId={facilityId}
            patientId={account.patient.id}
            accountId={account.id}
            onChargeItemsAdded={handleChargeItemsAdded}
          />
          <EditInvoiceDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setSelectedChargeItem(null);
            }}
            facilityId={facilityId}
            chargeItems={selectedChargeItem ? [selectedChargeItem] : []}
            onSuccess={() => {
              handleChargeItemsAdded();
              setIsEditDialogOpen(false);
              setSelectedChargeItem(null);
            }}
            title={t("edit_charge_item")}
          />
        </>
      )}
    </div>
  );
}

export default CreateInvoicePage;
