import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronDown, ChevronUp, PlusIcon } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
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

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemRead,
  ChargeItemStatus,
  MRP_CODE,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  InvoiceCreate,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

const ITEMS_PER_PAGE = 10;

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
  showHeader?: boolean;
  sourceUrl?: string;
}

interface PriceComponentRowProps {
  label: string;
  components: any[];
  totalPriceComponents: any[];
}

function PriceComponentRow({
  label,
  components,
  totalPriceComponents,
}: PriceComponentRowProps) {
  if (!components.length) return null;

  return (
    <>
      {components.map((component, index) => (
        <TableRow
          key={`${label}-${index}`}
          className="text-xs text-gray-500 bg-muted/30"
        >
          <TableCell></TableCell>
          <TableCell>
            {component.code && `${component.code.display} `}({label})
          </TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell className="text-right">
            <MonetaryDisplay {...component} />
          </TableCell>
          <TableCell className="text-right">
            {component.monetary_component_type ===
            MonetaryComponentType.discount
              ? "- "
              : "+ "}
            <MonetaryDisplay amount={totalPriceComponents[index]?.amount} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function CreateInvoicePage({
  facilityId,
  accountId,
  preSelectedChargeItems,
  redirectInNewTab = false,
  onSuccess,
  showHeader = true,
  sourceUrl,
}: CreateInvoicePageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: InvoiceStatus.draft,
      payment_terms: "",
      note: "",
      charge_items: preSelectedChargeItems?.map((item) => item.id) || [],
    },
  });

  const {
    data: chargeItemsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chargeItems", facilityId, accountId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await query(chargeItemApi.listChargeItem, {
        pathParams: { facilityId },
        queryParams: {
          limit: String(ITEMS_PER_PAGE),
          offset: String(pageParam),
          status: ChargeItemStatus.billable,
          account: accountId,
        },
      })({ signal: new AbortController().signal });
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
      // Navigate to the new invoice
      const invoiceUrl = `/facility/${facilityId}/billing/invoices/${invoice.id}?${sourceUrl ? `sourceUrl=${sourceUrl}` : ""}`;
      if (redirectInNewTab) {
        window.open(invoiceUrl, "_blank");
        onSuccess?.();
      } else {
        onSuccess?.();
        navigate(invoiceUrl);
      }
    },
    onError: (error) => {
      toast.error(error.message || t("failed_to_create_invoice"));
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

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getUnitComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.unit_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getTotalComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.total_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getBaseComponent = (item: any) => {
    return item.unit_price_components?.find(
      (c: any) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const chargeItems =
    preSelectedChargeItems ??
    chargeItemsData?.pages.flatMap((page) => page.results) ??
    [];

  return (
    <div className="container mx-auto md:px-4 pb-6">
      {showHeader && (
        <div className="mb-6">
          <Link
            href={`/facility/${facilityId}/billing/account/${accountId}`}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← {t("back_to_account")}
          </Link>
          <h3 className="pt-2">{t("create_invoice")}</h3>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="pb-2">
            <div className="text-sm font-medium text-gray-950">
              {t("billable_charge_items")}
            </div>
            {isLoading ? (
              <TableSkeleton count={3} />
            ) : !chargeItems || chargeItems.length === 0 ? (
              <div className="rounded-md border p-4 text-center text-gray-500">
                {t("no_billable_items")}
              </div>
            ) : (
              <div className="pr-1">
                <Table className="border-separate border-spacing-y-2 border-spacing-x-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] border-y border-l rounded-tl-md bg-gray-100 align-middle">
                        <div className="flex items-center p-1">
                          <Checkbox
                            checked={
                              chargeItems.length > 0 &&
                              chargeItems.every((item) => selectedRows[item.id])
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
                          />
                        </div>
                      </TableHead>
                      <TableHead className="border-y bg-gray-100 text-gray-700">
                        {t("items")}
                      </TableHead>
                      <TableHead className="border bg-gray-100 text-gray-700">
                        {t("quantity")}
                      </TableHead>
                      <TableHead className="border bg-gray-100 text-gray-700 text-right">
                        {t("mrp")} ({getCurrencySymbol()})
                      </TableHead>
                      <TableHead className="border-y bg-gray-100 text-gray-700 text-right">
                        {t("unit_price")} ({getCurrencySymbol()})
                      </TableHead>
                      <TableHead className="border rounded-tr-md bg-gray-100 text-gray-700 text-right font-semibold">
                        {t("amount")} ({getCurrencySymbol()})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {chargeItems.filter(Boolean).flatMap((item) => {
                      const isExpanded = expandedItems[item.id] || false;
                      const baseComponent = getBaseComponent(item);
                      const baseAmount = baseComponent?.amount || 0;
                      const mrpAmount = item.unit_price_components.find(
                        (c) =>
                          c.monetary_component_type ===
                            MonetaryComponentType.informational &&
                          c.code?.code === MRP_CODE,
                      )?.amount;

                      const mainRow = (
                        <TableRow
                          key={item.id}
                          className="hover:bg-gray-50 divide-x"
                        >
                          <TableCell className="border-l border-y rounded-tl-md align-middle">
                            <div className="flex items-center gap-2 p-1">
                              <Checkbox
                                checked={selectedRows[item.id] || false}
                                onCheckedChange={() =>
                                  handleRowSelection(item.id)
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  toggleItemExpand(item.id);
                                }}
                                type="button"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="size-4" />
                                ) : (
                                  <ChevronDown className="size-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-base border-y text-gray-950">
                            {item.title}
                          </TableCell>
                          <TableCell className="font-medium text-base border-y text-gray-950">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="font-medium text-base border-y text-gray-950 text-right">
                            <MonetaryDisplay amount={mrpAmount} />
                          </TableCell>
                          <TableCell className="font-medium text-base border-y text-gray-950 text-right">
                            <MonetaryDisplay amount={baseAmount} />
                          </TableCell>
                          <TableCell className="border-y border-r p-0 overflow-hidden rounded-tr-md">
                            <div className="bg-gray-100 border border-white rounded-md p-4 text-right font-semibold text-base text-gray-950">
                              <MonetaryDisplay amount={item.total_price} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );

                      if (!isExpanded) return [mainRow];
                      const detailRows = [
                        <PriceComponentRow
                          key={`${item.id}-discounts`}
                          label={t("discounts")}
                          components={getUnitComponentsByType(
                            item,
                            MonetaryComponentType.discount,
                          )}
                          totalPriceComponents={getTotalComponentsByType(
                            item,
                            MonetaryComponentType.discount,
                          )}
                        />,
                        <PriceComponentRow
                          key={`${item.id}-taxes`}
                          label={t("taxes")}
                          components={getUnitComponentsByType(
                            item,
                            MonetaryComponentType.tax,
                          )}
                          totalPriceComponents={getTotalComponentsByType(
                            item,
                            MonetaryComponentType.tax,
                          )}
                        />,
                      ];

                      const summaryRow = (
                        <TableRow
                          key={`${item.id}-summary`}
                          className="bg-muted/30 font-medium border"
                        >
                          <TableCell></TableCell>
                          <TableCell>{t("amount")}</TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right">
                            <MonetaryDisplay amount={item.total_price} />
                          </TableCell>
                        </TableRow>
                      );

                      return [mainRow, ...detailRows, summaryRow].filter(
                        Boolean,
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <FormField
              control={form.control}
              name="charge_items"
              render={({ field }) => (
                <FormMessage className="text-xs text-gray-950 italic">
                  {field.value.length > 0
                    ? `${t("selected_items_count", {
                        count: field.value.length,
                      })}`
                    : t("no_items_selected")}
                </FormMessage>
              )}
            />
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

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="link"
              className="text-base font-semibold underline"
              onClick={() => window.history.back()}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary_gradient"
              disabled={createMutation.isPending}
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
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default CreateInvoicePage;
