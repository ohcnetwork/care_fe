import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t as translate } from "i18next";
import { AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { useQueryParams } from "raviger";
import {
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import careConfig from "@/../care.config";
import { cn } from "@/lib/utils";

import { DisablingCover } from "@/components/Common/DisablingCover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ExtensionFormField,
  getExtensionFormFields,
  groupFieldsByAnchor,
  processExtensions,
} from "@/hooks/useExtensions";
import useExtensionSchemas from "@/hooks/useExtensionSchemas";
import UpsertLimitCallout from "@/pages/Facility/services/inventory/externalSupply/components/UpsertLimitCallout";
import { SmartExternalDeliveryRow } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import StockLotSelector from "@/pages/Facility/services/inventory/StockLotSelector";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { getComponentsFromChargeItem } from "@/types/billing/chargeItem/chargeItem";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { ExtensionEntityType } from "@/types/extensions/extensions";
import {
  ProductCreate,
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { RequestOrderStatus } from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
  SupplyDeliveryUpdate,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { isEqual, round, zodDecimal } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { useBatchRequest } from "@/Utils/request/batch";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { ExtensionContexts, SupplyDeliveryAnchor } from "@/Utils/schema/types";
import { dateQueryString, dateTimeQueryString } from "@/Utils/utils";

const supplyDeliveryItemSchema = z.object({
  supplied_inventory_item: z.string().optional(),
  supplied_item_quantity: zodDecimal({ min: 1 }),
  supplied_item_pack_quantity: z.number().nullable().optional(),
  supplied_item_pack_size: z.number().optional(),
  product_knowledge: z
    .custom<ProductKnowledgeBase>()
    .refine((data) => data?.slug, {
      message: "Item is required",
    }),
  supplied_item: z.custom<ProductRead>().optional(),
  supply_request: z.custom<SupplyRequestRead>().optional(),
  _is_inward_stock: z.boolean().optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  charge_item_definition: z.object({ slug: z.string() }).optional(),
  _created_charge_item_definition: z.string().optional(),
  _created_product: z.string().optional(),
  unit_price: z
    .string()
    .refine(
      (value) =>
        value.trim() !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0,
      { message: translate("invalid_value") },
    )
    .optional(),
  purchase_price: zodDecimal({ min: 0 }).optional(),
  total_purchase_price: zodDecimal({ min: 0 }).optional(),
  is_manually_edited: z.boolean().optional(),
  is_charge_item_edited: z.boolean().optional(),
  is_total_purchase_price_edited: z.boolean().optional(),
  is_tax_inclusive: z.boolean().optional(),
  charge_item_category: z.string().optional(),
  informational_components: z.array(z.custom<MonetaryComponent>()).optional(),
  tax_components: z.array(z.custom<MonetaryComponent>()).optional(),
  discount_components: z.array(z.custom<MonetaryComponent>()).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
  replaces_delivery: z.custom<SupplyDeliveryRead>().optional(),
});

export const createFormSchema = z
  .object({
    supplied_item_type: z.enum(SupplyDeliveryType),
    items: z
      .array(supplyDeliveryItemSchema)
      .min(1, translate("at_least_one_item_required")),
  })
  .superRefine(({ items }, context) => {
    items.forEach((item, index) => {
      if (!item._is_inward_stock) return;

      if (
        !Number.isInteger(item.supplied_item_pack_quantity) ||
        (item.supplied_item_pack_quantity ?? 0) < 1
      ) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "supplied_item_pack_quantity"],
          message: translate("pack_quantity_required"),
        });
      }

      if (
        !Number.isInteger(item.supplied_item_pack_size) ||
        (item.supplied_item_pack_size ?? 0) < 1
      ) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "supplied_item_pack_size"],
          message: translate("pack_size_required"),
        });
      }
    });
  });

export type SupplyDeliveryFormValues = z.infer<typeof createFormSchema>;
export type SupplyDeliveryItemValues = z.infer<typeof supplyDeliveryItemSchema>;

/** Extension anchors (x-ui.placement.after) this table renders, in column order */
const EXTENSION_ANCHORS = [
  "product",
  "batch",
  "expiry",
  "category",
  "pack_size",
  "pack_quantity",
  "quantity",
  "sale",
  "purchase",
  "tax",
] as const satisfies readonly SupplyDeliveryAnchor[];

export type SupplyDeliveryFormAnchor = (typeof EXTENSION_ANCHORS)[number];

export interface AddSupplyDeliveryFormHandle {
  editDelivery: (delivery: SupplyDeliveryRead) => void;
}

interface Props {
  ref?: Ref<AddSupplyDeliveryFormHandle>;
  deliveryOrderId: string;
  facilityId: string;
  origin?: string;
  destination: string;
  onSuccess: () => void;
  supplyDeliveriesCount: number;
  isFetchingSupplyDeliveries: boolean;
  currentSupplyDeliveries?: SupplyDeliveryRead[];
  onEditingDeliveryIdsChange?: (ids: string[]) => void;
  onPendingChangesChange?: (hasPendingChanges: boolean) => void;
}

export function AddSupplyDeliveryForm({
  ref,
  deliveryOrderId,
  facilityId,
  origin,
  destination,
  onSuccess,
  supplyDeliveriesCount,
  isFetchingSupplyDeliveries,
  currentSupplyDeliveries,
  onEditingDeliveryIdsChange,
  onPendingChangesChange,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qParams, setQueryParams] = useQueryParams();
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [requestOrderSearch, setRequestOrderSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const formElementRef = useRef<HTMLFormElement>(null);
  const [newlyAddedRowIndex, setNewlyAddedRowIndex] = useState<number | null>(
    null,
  );

  // Get facility data from hook
  const { facility } = useCurrentFacility();
  const { getExtensions } = useExtensionSchemas();

  const informationalCodes = facility?.instance_informational_codes || [];

  // Get extensions from API
  const allExtensions = useMemo(
    () => getExtensions(ExtensionEntityType.supply_delivery, "write"),
    [getExtensions],
  );

  // Process extensions for form rendering (includes owner, defaults, fieldMetadata)
  const processedExtensions = useMemo(
    () =>
      processExtensions(allExtensions, ExtensionContexts.supply_delivery_form),
    [allExtensions],
  );

  // Extension columns grouped by the core column they follow (x-ui.placement).
  // The header and every row read this one grouping, so columns always line up.
  const extensionColumns = useMemo(
    () =>
      groupFieldsByAnchor(
        getExtensionFormFields(processedExtensions),
        EXTENSION_ANCHORS,
        // The tax cell also holds the discount selector
        { discount: "tax" },
      ),
    [processedExtensions],
  );

  const renderExtensionHeads = (fields: ExtensionFormField[]) =>
    fields.map((field) => (
      <TableHead
        rowSpan={2}
        key={`${field.extensionName}-${field.name}`}
        className="min-w-[100px] text-xs font-semibold"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </TableHead>
    ));
  const extensionHeadsAfter = (anchor: SupplyDeliveryFormAnchor) =>
    renderExtensionHeads(extensionColumns.at(anchor));

  // Default values for a new empty item row
  const createEmptyItem = useCallback(
    (): SupplyDeliveryItemValues => ({
      product_knowledge: {} as ProductKnowledgeBase,
      supplied_inventory_item: "",
      supplied_item_quantity: origin ? "1" : "",
      supplied_item_pack_quantity: undefined,
      supplied_item_pack_size: origin ? undefined : 1,
      supplied_item: undefined,
      supply_request: undefined,
      _is_inward_stock: !origin,
      is_tax_inclusive: careConfig.inventory.defaultTaxInclusive,
      extensions: {},
    }),
    [origin],
  );

  // Load supply requests when supplyOrder query parameter is present
  const { data: supplyRequests } = useQuery({
    queryKey: ["supplyRequests", qParams.supplyOrder],
    queryFn: query.paginated(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        order: qParams.supplyOrder,
      },
    }),
    enabled: !!qParams.supplyOrder,
  });

  const { data: requestOrders, isLoading: isLoadingRequestOrders } = useQuery({
    queryKey: [
      "requestOrders",
      facilityId,
      requestOrderSearch,
      destination,
      origin,
    ],
    queryFn: query.debounced(requestOrderApi.listRequestOrder, {
      pathParams: { facilityId },
      queryParams: {
        search: requestOrderSearch || undefined,
        status: RequestOrderStatus.pending,
        ...(!origin ? { destination } : { origin }),
      },
    }),
    enabled: !qParams.supplyOrder,
  });

  const form = useForm<SupplyDeliveryFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      supplied_item_type: SupplyDeliveryType.product,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const newItemsCount = fields.filter((item) => !item.replaces_delivery).length;
  const hasReplacementItems = fields.some((item) => item.replaces_delivery);
  const hasExceedLoad =
    selectedRequestIds.length + supplyDeliveriesCount + newItemsCount >
    careConfig.maxDatapointsPerUpsert;
  const isAtItemLimit =
    supplyDeliveriesCount + newItemsCount >= careConfig.maxDatapointsPerUpsert;
  const disableAddItem =
    isProcessing ||
    isFetchingSupplyDeliveries ||
    isAtItemLimit ||
    fields.length > 0;

  useEffect(() => {
    onEditingDeliveryIdsChange?.(
      fields.flatMap((item) =>
        item.replaces_delivery ? [item.replaces_delivery.id] : [],
      ),
    );
  }, [fields, onEditingDeliveryIdsChange]);

  useEffect(
    () => () => onEditingDeliveryIdsChange?.([]),
    [onEditingDeliveryIdsChange],
  );

  const hasPendingChanges = fields.length > 0;
  useEffect(() => {
    onPendingChangesChange?.(hasPendingChanges);
  }, [hasPendingChanges, onPendingChangesChange]);

  useEffect(
    () => () => onPendingChangesChange?.(false),
    [onPendingChangesChange],
  );

  const focusDeliveryRow = (deliveryId: string) => {
    requestAnimationFrame(() => {
      const row = formElementRef.current?.querySelector<HTMLElement>(
        `[data-pending-delivery-id="${CSS.escape(deliveryId)}"]`,
      );
      const quantityInput = row?.querySelector<HTMLInputElement>(
        "[data-pending-item-quantity]",
      );
      (quantityInput || row)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "center",
        inline: "center",
      });
      quantityInput?.focus({ preventScroll: true });
    });
  };

  useImperativeHandle(ref, () => ({
    editDelivery: (delivery) => {
      if (
        origin ||
        isProcessing ||
        isFetchingSupplyDeliveries ||
        delivery.status !== SupplyDeliveryStatus.in_progress
      ) {
        return;
      }

      if (
        form
          .getValues("items")
          .some((item) => item.replaces_delivery?.id === delivery.id)
      ) {
        focusDeliveryRow(delivery.id);
        return;
      }

      if (form.getValues("items").length > 0) {
        toast.error(t("save_or_discard_delivery_changes"));
        return;
      }

      const product =
        delivery.supplied_item || delivery.supplied_inventory_item?.product;
      if (!product) return;

      const chargeItem = product.charge_item_definition ?? undefined;
      const getComponents = (type: MonetaryComponentType) =>
        chargeItem ? getComponentsFromChargeItem(chargeItem, type) : [];
      const quantity = Number(delivery.supplied_item_quantity);
      let packSize =
        delivery.supplied_item_pack_size ?? product.standard_pack_size ?? 1;
      let packQuantity =
        delivery.supplied_item_pack_quantity ?? quantity / packSize;
      if (
        !Number.isInteger(packQuantity) ||
        packSize * packQuantity !== quantity
      ) {
        packSize = 1;
        packQuantity = quantity;
      }

      append(
        {
          product_knowledge: product.product_knowledge,
          supplied_item: product,
          supplied_item_quantity: String(delivery.supplied_item_quantity),
          supplied_item_pack_size: packSize,
          supplied_item_pack_quantity: packQuantity,
          supply_request: delivery.supply_request,
          _is_inward_stock: true,
          batch_number: product.batch?.lot_number || "",
          expiry_date: dateQueryString(product.expiration_date),
          charge_item_definition: chargeItem,
          charge_item_category: chargeItem?.category?.slug,
          unit_price:
            getComponents(MonetaryComponentType.base)[0]?.amount ?? "0",
          purchase_price: product.purchase_price ?? undefined,
          total_purchase_price:
            delivery.total_purchase_price != null
              ? String(delivery.total_purchase_price)
              : undefined,
          informational_components: getComponents(
            MonetaryComponentType.informational,
          ),
          tax_components: getComponents(MonetaryComponentType.tax),
          discount_components: getComponents(MonetaryComponentType.discount),
          is_tax_inclusive: false,
          is_manually_edited: false,
          extensions: structuredClone(delivery.extensions || {}),
          replaces_delivery: delivery,
        },
        { shouldFocus: false },
      );
      setNewlyAddedRowIndex(null);
      setSaveError(undefined);
      focusDeliveryRow(delivery.id);
    },
  }));

  const loadFromSupplyRequests = () => {
    if (disableAddItem) return;
    handleSelectAll(true);
    setIsSelectDialogOpen(true);
  };

  // Render the request order selector dropdown
  const renderRequestOrderSelector = () => (
    <Autocomplete
      options={
        requestOrders?.results?.map((order) => ({
          label: order.name,
          value: order.id,
        })) || []
      }
      value=""
      onChange={(value) => {
        if (value) {
          setQueryParams({
            ...qParams,
            supplyOrder: value,
          });
        }
      }}
      isLoading={isLoadingRequestOrders}
      onSearch={setRequestOrderSearch}
      placeholder={t("select_order")}
      inputPlaceholder={t("search_order")}
      noOptionsMessage={t("no_orders_found")}
      className="min-w-40"
      popoverContentClassName="w-auto"
      disabled={disableAddItem}
    />
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedRequestIds(
      checked ? supplyRequests?.results.map((request) => request.id) || [] : [],
    );
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedRequestIds((previous) =>
      checked
        ? previous.includes(id)
          ? previous
          : [...previous, id]
        : previous.filter((requestId) => requestId !== id),
    );
  };

  const handleSelectRequests = () => {
    if (disableAddItem) return;
    const selectedRequests = supplyRequests?.results.filter((request) =>
      selectedRequestIds.includes(request.id),
    );
    if (!selectedRequests?.length) return;
    append(
      selectedRequests.map((request) => ({
        ...createEmptyItem(),
        supplied_item_quantity: origin ? request.quantity : "",
        supplied_item_pack_quantity: origin ? undefined : 1,
        product_knowledge: request.item,
        supply_request: request,
      })),
    );
    setIsSelectDialogOpen(false);
    setSelectedRequestIds([]);
  };

  const handleAddAnotherItem = () => {
    if (disableAddItem) return;
    const newIndex = fields.length;
    append(createEmptyItem());
    setNewlyAddedRowIndex(newIndex);
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
    setSaveError(undefined);
  };

  const handleDiscardChanges = () => {
    form.reset();
    setSaveError(undefined);
    setNewlyAddedRowIndex(null);
  };

  const { mutateAsync: createProduct } = useMutation({
    mutationFn: mutate(productApi.createProduct, {
      pathParams: { facilityId },
    }),
  });

  const { mutateAsync: createChargeItemDefinition } = useMutation({
    mutationFn: mutate(chargeItemDefinitionApi.createChargeItemDefinition, {
      pathParams: { facilityId },
    }),
  });

  const { mutateAsync: createSupplyDelivery } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.createSupplyDelivery),
  });

  const { mutateAsync: replaceSupplyDelivery } = useBatchRequest({});

  /**
   * Build price components array from item's monetary components
   */
  const buildPriceComponents = (
    item: SupplyDeliveryFormValues["items"][number],
  ): MonetaryComponent[] => {
    const sourceComponents =
      item.supplied_item?.charge_item_definition?.price_components ?? [];
    const components: MonetaryComponent[] = sourceComponents.filter(
      (component) =>
        component.monetary_component_type === MonetaryComponentType.surcharge,
    );

    // Base price component
    if (item.unit_price != null) {
      components.push({
        ...sourceComponents.find(
          (component) =>
            component.monetary_component_type === MonetaryComponentType.base,
        ),
        monetary_component_type: MonetaryComponentType.base,
        amount: item.unit_price,
      });
    }

    // Informational components (MRP, Purchase Price, etc.)
    if (item.informational_components?.length) {
      components.push(...item.informational_components);
    }

    // Tax components
    if (item.tax_components?.length) {
      components.push(...item.tax_components);
    }

    // Discount components
    if (item.discount_components?.length) {
      components.push(...item.discount_components);
    }

    return components;
  };

  const validateFormWithToasts = useCallback(
    (data: SupplyDeliveryFormValues) => {
      let hasErrors = false;

      if (data.items.length === 0) {
        toast.error(t("at_least_one_item_required"));
        return false;
      }

      // Validate each item
      for (const [index, item] of data.items.entries()) {
        if (!item.product_knowledge?.slug) {
          toast.error(t("select_product_at_row", { row: index + 1 }));
          hasErrors = true;
          break;
        }

        if (origin) {
          if (!item.supplied_inventory_item) {
            toast.error(t("select_stock_at_row", { row: index + 1 }));
            hasErrors = true;
            break;
          }
        }

        // Only validate supplied_item for external if it's NOT a new creation
        if (!origin) {
          // Existing delivery corrections may retain missing legacy metadata.
          if (!item.supplied_item || item.is_manually_edited) {
            if (!item.replaces_delivery && !item.batch_number) {
              toast.error(
                t("batch_number_required_at_row", { row: index + 1 }),
              );
              hasErrors = true;
              break;
            }
            if (!item.replaces_delivery && !item.expiry_date) {
              toast.error(t("expiry_date_required_at_row", { row: index + 1 }));
              hasErrors = true;
              break;
            }
            if (
              (!item.supplied_item || item.is_charge_item_edited) &&
              !item.charge_item_category
            ) {
              toast.error(t("category_required_at_row", { row: index + 1 }));
              hasErrors = true;
              break;
            }
          }
          if (item.unit_price === undefined) {
            toast.error(t("unit_price_required_at_row", { row: index + 1 }));
            hasErrors = true;
            break;
          }
        }
      }

      return !hasErrors;
    },
    [origin, t],
  );

  async function processRowItem(
    item: SupplyDeliveryFormValues["items"][number],
    index: number,
    suppliedItemType: SupplyDeliveryType,
  ) {
    const sourceProduct = item.supplied_item;
    const sourceChargeItem = sourceProduct?.charge_item_definition;
    let productId = item.supplied_item?.id;
    let chargeItemSlug = item.charge_item_definition?.slug;
    const hasPurchasePriceChange =
      sourceProduct &&
      !isEqual(
        item.purchase_price,
        sourceProduct.purchase_price != null
          ? round(sourceProduct.purchase_price)
          : undefined,
      );

    // Create ChargeItemDefinition and Product for external supply (no origin)
    if (
      !origin &&
      (!productId || item.is_manually_edited || hasPurchasePriceChange)
    ) {
      if (!item.replaces_delivery && item.total_purchase_price != null) {
        form.setValue(`items.${index}.is_total_purchase_price_edited`, true);
      }
      // Each new product owns its pricing definition. Reuse only a definition
      // prepared for this draft when retrying a failed product creation.
      if (item.is_manually_edited || hasPurchasePriceChange) {
        productId = undefined;
        if (item._created_product) {
          chargeItemSlug = undefined;
          form.setValue(`items.${index}._created_product`, undefined);
          form.setValue(
            `items.${index}._created_charge_item_definition`,
            undefined,
          );
        } else {
          chargeItemSlug = item._created_charge_item_definition;
        }
      }

      // Only create ChargeItemDefinition if we don't already have one from our creation
      if (
        !chargeItemSlug &&
        (sourceChargeItem || !sourceProduct || item.is_charge_item_edited)
      ) {
        const category =
          item.charge_item_category ?? sourceChargeItem?.category?.slug;
        if (!category && (!sourceChargeItem || item.is_charge_item_edited)) {
          throw new Error(
            t("charge_item_category_required_for_item", {
              item: item.product_knowledge.name,
            }),
          );
        }

        const priceComponents =
          sourceChargeItem && !item.is_charge_item_edited
            ? structuredClone(sourceChargeItem.price_components)
            : buildPriceComponents(item);
        const chargeItemCreate: ChargeItemDefinitionCreate = {
          slug_value: crypto.randomUUID(),
          category: category ?? null,
          title:
            sourceChargeItem?.title ??
            `${item.product_knowledge.name}${item.batch_number ? ` - ${item.batch_number}` : ""}`,
          status: ChargeItemDefinitionStatus.active,
          derived_from_uri: sourceChargeItem?.derived_from_uri,
          description: sourceChargeItem?.description,
          purpose: sourceChargeItem?.purpose,
          can_edit_charge_item: sourceChargeItem?.can_edit_charge_item ?? false,
          price_components: priceComponents,
          discount_configuration:
            sourceChargeItem?.discount_configuration ?? null,
          tags: sourceChargeItem?.tags?.map((tag) => tag.id),
        };

        const newChargeItem =
          await createChargeItemDefinition(chargeItemCreate);
        chargeItemSlug = newChargeItem.slug;

        // Keep the prepared charge item for retries without allowing row auto-fill
        // to replace the draft while its product is still being created.
        form.setValue(`items.${index}.charge_item_definition`, {
          slug: chargeItemSlug,
        });
        form.setValue(
          `items.${index}._created_charge_item_definition`,
          chargeItemSlug,
        );
      }

      // Only create Product if we don't already have one from our creation
      if (!productId) {
        const productCreate: ProductCreate = {
          status: ProductStatusOptions.active,
          batch: item.batch_number
            ? { lot_number: item.batch_number }
            : undefined,
          expiration_date:
            sourceProduct?.expiration_date &&
            item.expiry_date === dateQueryString(sourceProduct.expiration_date)
              ? sourceProduct.expiration_date
              : dateTimeQueryString(item.expiry_date) || undefined,
          product_knowledge: item.product_knowledge.slug,
          charge_item_definition: chargeItemSlug,
          standard_pack_size: item.supplied_item_pack_size,
          purchase_price: item.purchase_price,
          extensions: structuredClone(sourceProduct?.extensions ?? {}),
        };

        const newProduct = await createProduct(productCreate);
        productId = newProduct.id;

        // Immediately persist Product to form state
        // So if Delivery fails, we won't recreate it on retry
        form.setValue(`items.${index}.supplied_item`, newProduct);
        form.setValue(`items.${index}._created_product`, newProduct.id);
        form.setValue(`items.${index}.is_manually_edited`, false);
        form.setValue(`items.${index}.is_charge_item_edited`, false);
      }
    }

    // Create the SupplyDelivery for this item
    const deliveryPayload = {
      status: SupplyDeliveryStatus.in_progress,
      supplied_item_type:
        item.replaces_delivery?.supplied_item_type ?? suppliedItemType,
      supplied_item_condition:
        item.replaces_delivery?.supplied_item_condition ??
        SupplyDeliveryCondition.normal,
      supplied_item_quantity: item.supplied_item_quantity,
      ...(origin
        ? { supplied_inventory_item: item.supplied_inventory_item }
        : {
            supplied_item: productId,
            supplied_item_pack_quantity:
              item.supplied_item_pack_quantity ?? undefined,
            supplied_item_pack_size: item.supplied_item_pack_size,
            total_purchase_price: item.total_purchase_price
              ? parseFloat(item.total_purchase_price)
              : undefined,
          }),
      supply_request: item.supply_request?.id,
      origin: origin,
      destination: destination,
      order: deliveryOrderId,
      extensions: item.extensions || {},
    };

    if (item.replaces_delivery) {
      const original = item.replaces_delivery;
      const cancellation: SupplyDeliveryUpdate &
        Pick<SupplyDeliveryRead, "total_purchase_price"> = {
        status: SupplyDeliveryStatus.abandoned,
        supplied_item_condition: original.supplied_item_condition,
        total_purchase_price: original.total_purchase_price,
        extensions: original.extensions || {},
      };
      await replaceSupplyDelivery([
        {
          api: supplyDeliveryApi.updateSupplyDelivery,
          pathParams: { supplyDeliveryId: original.id },
          referenceId: `cancel-${original.id}`,
          body: cancellation,
        },
        {
          api: supplyDeliveryApi.createSupplyDelivery,
          referenceId: `replace-${original.id}`,
          body: deliveryPayload,
        },
      ]);
    } else {
      await createSupplyDelivery(deliveryPayload);
    }
  }

  async function onSubmit(data: SupplyDeliveryFormValues) {
    if (isProcessing) return;
    setSaveError(undefined);
    if (!validateFormWithToasts(data)) return;

    if (
      currentSupplyDeliveries &&
      data.items.some(
        (item) =>
          item.replaces_delivery &&
          !currentSupplyDeliveries.some(
            (delivery) =>
              delivery.id === item.replaces_delivery?.id &&
              delivery.status === SupplyDeliveryStatus.in_progress,
          ),
      )
    ) {
      const message = t("delivery_item_changed_before_save");
      setSaveError(message);
      toast.error(message);
      return;
    }

    setIsProcessing(true);
    try {
      const successfulIndices: number[] = [];
      let failedCount = 0;

      // Delivery creation locks the order, so rows must not save concurrently.
      for (const [index, item] of data.items.entries()) {
        try {
          await processRowItem(item, index, data.supplied_item_type);
          successfulIndices.push(index);
        } catch {
          failedCount++;
        }
      }

      if (successfulIndices.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
        queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
        queryClient.invalidateQueries({ queryKey: ["products", facilityId] });
        queryClient.invalidateQueries({
          queryKey: ["chargeItemDefinitions", facilityId],
        });
        toast.success(
          t(
            data.items.some((item) => item.replaces_delivery)
              ? "items_saved_successfully"
              : "items_created_successfully",
            { count: successfulIndices.length },
          ),
        );
        onSuccess();
      }

      if (failedCount > 0) {
        setSaveError(t("delivery_items_save_failed", { count: failedCount }));
      }

      if (failedCount === 0) {
        form.reset();
      } else {
        successfulIndices
          .sort((a, b) => b - a)
          .forEach((index) => remove(index));
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <DisablingCover disabled={isProcessing} message={t("saving")}>
        <Card className="bg-gray-50 py-4 rounded-md">
          <CardContent className="space-y-4 px-2 sm:px-6">
            {fields.length > 0 ? (
              <Form {...form}>
                <form
                  ref={formElementRef}
                  onSubmit={form.handleSubmit(onSubmit, () => {
                    const message = t("please_fix_errors");
                    setSaveError(message);
                    toast.error(message);
                  })}
                  className="space-y-6"
                  aria-label={t("pending_changes")}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {t("pending_changes")}
                      </h3>
                      <Badge variant="outline" size="xs">
                        {t("pending_delivery_items", { count: fields.length })}
                      </Badge>
                    </div>
                    {hasReplacementItems && (
                      <p
                        className="text-sm text-muted-foreground"
                        role="status"
                      >
                        {t("editing_delivery_items_description")}
                      </p>
                    )}
                  </div>
                  {saveError && (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertDescription>{saveError}</AlertDescription>
                    </Alert>
                  )}
                  {newItemsCount > 0 && (
                    <div>
                      <FormField
                        control={form.control}
                        name="supplied_item_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {hasReplacementItems
                                ? t("type_for_new_items")
                                : t("item_type")}
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                                className="flex flex-wrap gap-2"
                              >
                                {Object.values(SupplyDeliveryType).map(
                                  (type) => (
                                    <div
                                      key={type}
                                      className={cn(
                                        "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                        field.value === type &&
                                          "border-primary bg-primary/10",
                                      )}
                                    >
                                      <RadioGroupItem value={type} id={type} />
                                      <Label htmlFor={type}>{t(type)}</Label>
                                    </div>
                                  ),
                                )}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="rounded-md border border-gray-200 bg-white shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-100">
                          {origin ? (
                            <TableRow className="divide-x divide-gray-200">
                              <TableHead className="min-w-[180px] text-xs font-semibold">
                                {t("product")}
                              </TableHead>
                              <TableHead className="text-xs font-semibold">
                                {t("inventory_item")}
                              </TableHead>
                              <TableHead className="text-xs font-semibold">
                                {t("quantity")}
                              </TableHead>
                              <TableHead className="text-xs font-semibold">
                                {t("actions")}
                              </TableHead>
                            </TableRow>
                          ) : (
                            <>
                              <TableRow className="divide-x divide-gray-200">
                                <TableHead
                                  rowSpan={2}
                                  className="sticky left-0 z-20 border-r border-gray-200 bg-gray-100 text-xs font-semibold shadow-[1px_0_0_0_var(--color-gray-300)]"
                                >
                                  {t("product")}
                                </TableHead>
                                {extensionHeadsAfter("product")}
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[140px] text-xs font-semibold"
                                >
                                  {t("batch")}
                                </TableHead>
                                {extensionHeadsAfter("batch")}
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[130px] text-xs font-semibold"
                                >
                                  {t("expiry")}
                                </TableHead>
                                {extensionHeadsAfter("expiry")}
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[140px] text-xs font-semibold text-center"
                                >
                                  {t("category")}
                                </TableHead>
                                {extensionHeadsAfter("category")}
                                <TableHead
                                  rowSpan={2}
                                  className="w-20 text-xs font-semibold"
                                >
                                  {t("pack_size")}
                                </TableHead>
                                {extensionHeadsAfter("pack_size")}
                                <TableHead
                                  rowSpan={2}
                                  className="w-28 text-xs font-semibold"
                                >
                                  {t("pack_qty")}
                                </TableHead>
                                {extensionHeadsAfter("pack_quantity")}
                                <TableHead
                                  rowSpan={2}
                                  className="w-32 text-xs font-semibold"
                                >
                                  {t("qty")}
                                </TableHead>
                                {extensionHeadsAfter("quantity")}
                                <TableHead
                                  colSpan={1 + informationalCodes.length}
                                  className="text-xs font-semibold text-center border-b"
                                >
                                  {t("sale")}
                                </TableHead>
                                {extensionHeadsAfter("sale")}
                                <TableHead
                                  colSpan={2}
                                  className="text-xs font-semibold text-center border-b"
                                >
                                  {t("purchase")}
                                </TableHead>
                                {extensionHeadsAfter("purchase")}
                                <TableHead
                                  rowSpan={2}
                                  className="min-w-[120px] text-xs font-semibold"
                                >
                                  {t("tax")}
                                </TableHead>
                                {extensionHeadsAfter("tax")}
                                {renderExtensionHeads(
                                  extensionColumns.trailing,
                                )}
                                <TableHead
                                  rowSpan={2}
                                  className="sm:sticky sm:right-0 z-20 border-l bg-gray-100 text-xs font-semibold"
                                >
                                  {t("actions")}
                                </TableHead>
                              </TableRow>
                              <TableRow className="divide-x divide-gray-200">
                                <TableHead className="min-w-[100px] text-xs font-semibold">
                                  {t("item_price")}
                                </TableHead>
                                {informationalCodes.map((code) => (
                                  <TableHead
                                    key={code.code}
                                    className="min-w-[100px] text-xs font-semibold"
                                  >
                                    {code.display}
                                  </TableHead>
                                ))}
                                <TableHead className="min-w-[100px] text-xs font-semibold">
                                  {t("pr")}
                                </TableHead>
                                <TableHead className="min-w-[120px] text-xs font-semibold border-r">
                                  {t("tpr")}
                                </TableHead>
                              </TableRow>
                            </>
                          )}
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) =>
                            origin ? (
                              <TableRow
                                key={field.id}
                                className="divide-x divide-gray-200"
                              >
                                <TableCell className="align-top p-2">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.product_knowledge`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <ProductKnowledgeSelect
                                            value={field.value}
                                            onChange={(productKnowledge) => {
                                              field.onChange(productKnowledge);
                                              setNewlyAddedRowIndex(null);
                                              // Reset inventory item when product changes
                                              form.setValue(
                                                `items.${index}.supplied_inventory_item`,
                                                "",
                                              );
                                            }}
                                            placeholder={t("select_product")}
                                            className="w-full"
                                            disableFavorites
                                            hideClearButton
                                            defaultOpen={
                                              newlyAddedRowIndex === index
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top p-2">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.supplied_inventory_item`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <StockLotSelector
                                            selectedLots={
                                              field.value
                                                ? [
                                                    {
                                                      selectedInventoryId:
                                                        field.value,
                                                      quantity: "1",
                                                    },
                                                  ]
                                                : []
                                            }
                                            onLotSelectionChange={(lots) =>
                                              field.onChange(
                                                lots[0]?.selectedInventoryId ||
                                                  "",
                                              )
                                            }
                                            facilityId={facilityId}
                                            locationId={origin || ""}
                                            productKnowledge={form.watch(
                                              `items.${index}.product_knowledge`,
                                            )}
                                            enableSearch={true}
                                            multiSelect={false}
                                            className="w-full h-9"
                                            dontRestrictExpired
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top p-2">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.supplied_item_quantity`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={1}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="align-top p-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(index)}
                                    aria-label={t("remove")}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <SmartExternalDeliveryRow
                                key={field.id}
                                form={form}
                                index={index}
                                replacesDeliveryId={field.replaces_delivery?.id}
                                informationalCodes={informationalCodes}
                                autoOpenProductSelect={
                                  newlyAddedRowIndex === index
                                }
                                onProductSelectOpened={() =>
                                  setNewlyAddedRowIndex(null)
                                }
                                extensionColumns={extensionColumns}
                                locationId={destination}
                                onRemove={() => handleRemoveItem(index)}
                              />
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div
                    className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                    role="group"
                    aria-label={t("pending_changes")}
                  >
                    <p className="text-sm text-muted-foreground">
                      {t("pending_delivery_items", { count: fields.length })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isProcessing}
                        onClick={handleDiscardChanges}
                      >
                        {t("discard_changes")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isProcessing ||
                          isFetchingSupplyDeliveries ||
                          supplyDeliveriesCount + newItemsCount >
                            careConfig.maxDatapointsPerUpsert
                        }
                      >
                        {isProcessing ? t("saving") : t("save_changes")}
                        <ShortcutBadge actionId="submit-action" />
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1 basis-64 space-y-1">
                  <h3 className="text-base font-semibold">
                    {t("add_items_to_delivery")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("add_items_to_delivery_description")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {qParams.supplyOrder ? (
                    !!supplyRequests?.results?.length && (
                      <Button
                        type="button"
                        variant="outline_primary"
                        onClick={loadFromSupplyRequests}
                        disabled={disableAddItem}
                      >
                        {t("load_from_order")} ({supplyRequests.count}{" "}
                        {t("items")})
                        <ShortcutBadge actionId="load-from-order" />
                      </Button>
                    )
                  ) : (
                    <div className="w-44">{renderRequestOrderSelector()}</div>
                  )}
                  <Button
                    type="button"
                    variant="outline_primary"
                    onClick={() => handleAddAnotherItem()}
                    disabled={disableAddItem}
                  >
                    <PlusCircle className="mr-2 size-4" />
                    {t("add_item")}
                    <ShortcutBadge actionId="add-item" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DisablingCover>
      {supplyRequests && (
        <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("select_items_to_add")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedRequestIds.length === supplyRequests.results.length
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked === true)
                  }
                  data-shortcut-id="select-all"
                />
                <Label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("select_all")}
                </Label>
              </div>
              <div className="border rounded-md divide-y max-h-[50vh] overflow-y-auto">
                {supplyRequests.results.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center space-x-4 p-2 hover:bg-gray-50"
                  >
                    <Checkbox
                      id={request.id}
                      checked={selectedRequestIds.includes(request.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(request.id, checked === true)
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={request.id}
                        className="text-sm font-medium leading-none"
                      >
                        {request.item.name}
                      </label>
                    </div>
                    <div className="text-sm font-medium">
                      {round(request.quantity)} {request.item.base_unit.display}
                    </div>
                  </div>
                ))}
              </div>
              {hasExceedLoad && (
                <UpsertLimitCallout>
                  {t("max_items_selected_limit_warning", {
                    count: careConfig.maxDatapointsPerUpsert,
                  })}
                </UpsertLimitCallout>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSelectDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSelectRequests}
                disabled={selectedRequestIds.length === 0 || hasExceedLoad}
              >
                {t("done")}
                <ShortcutBadge actionId="enter-action" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
