import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { Check, ChevronDownIcon, LocateFixed, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { CaretSortIcon } from "@radix-ui/react-icons";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import batchApi from "@/types/base/batch/batchApi";
import {
  MedicationDispenseCategory,
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { LocationList } from "@/types/location/location";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LocationSelectorDialog } from "@/components/ui/sidebar/facility/location/location-switcher";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";

interface SelectedLocation {
  id: string;
  name: string;
  path: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  encounterId: string;
  selectedLocation: SelectedLocation;
}

interface FormItemType {
  reference_id: string;
  productKnowledge: ProductKnowledgeBase;
  isSelected: boolean;
  quantity: number;
  lots: Array<{
    selectedInventoryId: string;
    quantity: number;
  }>;
}

const createFormSchema = () =>
  z.object({
    items: z.array(
      z.object({
        reference_id: z.string().uuid(),
        productKnowledge: z.any(),
        isSelected: z.boolean(),
        quantity: z.number().min(1),
        lots: z.array(
          z.object({
            selectedInventoryId: z.string(),
            quantity: z.number().min(1),
          }),
        ),
      }),
    ),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export default function DispenseDrawer({
  open,
  onOpenChange,
  patientId: _patientId,
  encounterId,
  selectedLocation,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facilityId } = useCurrentFacility();

  const [currentLocation, setCurrentLocation] = useState<LocationList>(
    () =>
      ({
        id: selectedLocation.id,
        name: selectedLocation.name,
        status: "active",
        operational_status: "O",
        has_children: false,
        sort_index: 0,
        description: "",
        form: "ward",
        mode: "instance",
        parent: null,
      }) as unknown as LocationList,
  );

  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isLocationWarningOpen, setIsLocationWarningOpen] = useState(false);
  const [productKnowledgeInventoriesMap, setProductKnowledgeInventoriesMap] =
    useState<Record<string, InventoryRead[] | undefined>>({});

  const formSchema = useMemo(() => createFormSchema(), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    form.clearErrors();
    form.trigger();
  }, [formSchema, form]);

  useEffect(() => {
    if (open) {
      form.reset({ items: [] });
    }
  }, [open, form]);

  useEffect(() => {
    const fetchMissingInventories = async () => {
      const missingInventories = Object.entries(
        productKnowledgeInventoriesMap,
      ).filter(([, inventories]) => !inventories);

      if (missingInventories.length === 0) return;

      const promises = missingInventories.map(async ([productKnowledgeId]) => {
        const inventoriesResponse = await query(inventoryApi.list, {
          pathParams: { facilityId, locationId: currentLocation.id },
          queryParams: {
            limit: 100,
            product_knowledge: productKnowledgeId,
            net_content_gt: 0,
          },
        })({ signal: new AbortController().signal });

        return {
          productKnowledgeId,
          inventories: inventoriesResponse.results || [],
        };
      });

      const results = await Promise.all(promises);

      setProductKnowledgeInventoriesMap((prev) => {
        const updated = { ...prev };
        results.forEach(({ productKnowledgeId, inventories }) => {
          updated[productKnowledgeId] = inventories;
        });
        return updated;
      });
    };

    fetchMissingInventories();
  }, [productKnowledgeInventoriesMap, facilityId, currentLocation.id]);

  const { mutate: dispense, isPending } = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
    onSuccess: () => {
      toast.success(t("items_dispensed_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["inventory", currentLocation.id],
      });
      onOpenChange(false);
    },
  });

  //path builder
  const buildLocationPath = useCallback((location: LocationList): string => {
    const pathParts: string[] = [];
    let currentLocation: LocationList | undefined = location;

    while (currentLocation && currentLocation.name) {
      pathParts.unshift(currentLocation.name);

      if (
        currentLocation.parent &&
        currentLocation.parent.id &&
        currentLocation.parent.name
      ) {
        currentLocation = currentLocation.parent as LocationList;
      } else {
        break;
      }
    }

    const validParts = pathParts.filter(
      (part) => part && part.trim().length > 0,
    );
    return validParts.length > 1 ? validParts.join(" → ") : validParts[0] || "";
  }, []);

  const handleLocationChange = useCallback(
    (newLocation: LocationList) => {
      setCurrentLocation(newLocation);
      setIsLocationSelectorOpen(false);
      setProductKnowledgeInventoriesMap({});
      form.reset({ items: [] });
    },
    [form],
  );

  const validateFormWithToasts = useCallback(
    (formData: FormValues) => {
      let hasErrors = false;
      const selectedItems = formData.items.filter((item) => item.isSelected);

      if (selectedItems.length === 0) {
        toast.error(t("please_select_at_least_one_item"));
        return false;
      }

      const itemsNotInStock = selectedItems.filter((item) => {
        const availableInventories =
          productKnowledgeInventoriesMap[item.productKnowledge.id];
        return !availableInventories || availableInventories.length === 0;
      });

      const itemsInStock = selectedItems.filter((item) => {
        const availableInventories =
          productKnowledgeInventoriesMap[item.productKnowledge.id];
        return availableInventories && availableInventories.length > 0;
      });

      if (itemsNotInStock.length > 0) {
        const itemNames = itemsNotInStock.map(
          (item) => item.productKnowledge.name,
        );
        toast.error(
          t("selected_items_not_in_stock", { items: itemNames.join(", ") }),
        );
        hasErrors = true;
      }

      const itemsWithoutLots = itemsInStock.filter((item) => {
        return !item.lots.some((lot) => lot.selectedInventoryId.length > 0);
      });

      if (itemsWithoutLots.length > 0) {
        const itemNames = itemsWithoutLots.map(
          (item) => item.productKnowledge.name,
        );
        toast.error(
          t("please_select_lot_for_items", { items: itemNames.join(", ") }),
        );
        hasErrors = true;
      }

      const itemsWithZeroQuantity = itemsInStock.filter((item) => {
        return item.lots.some(
          (lot) => lot.selectedInventoryId.length > 0 && lot.quantity === 0,
        );
      });

      if (itemsWithZeroQuantity.length > 0) {
        const itemNames = itemsWithZeroQuantity.map(
          (item) => item.productKnowledge.name,
        );
        toast.error(
          t("quantity_cannot_be_zero_for_items", {
            items: itemNames.join(", "),
          }),
        );
        hasErrors = true;
      }

      for (const item of itemsInStock) {
        const inventoryList =
          productKnowledgeInventoriesMap[item.productKnowledge.id] || [];

        for (const lot of item.lots) {
          if (!lot.selectedInventoryId || lot.quantity <= 0) continue;

          const inventory = inventoryList.find(
            (inv) => inv.id === lot.selectedInventoryId,
          );
          if (inventory && lot.quantity > inventory.net_content) {
            toast.error(
              t("quantity_exceeds_available_stock", {
                item: item.productKnowledge.name,
                lot: inventory.product.batch?.lot_number || "N/A",
                requested: lot.quantity,
                available: inventory.net_content,
              }),
            );
            hasErrors = true;
            break;
          }
        }
        if (hasErrors) break;
      }

      return !hasErrors;
    },
    [productKnowledgeInventoriesMap, t],
  );

  const createDispenseRequests = useCallback(
    (selectedItems: FormItemType[]) => {
      const requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: MedicationDispenseCreate;
      }> = [];

      selectedItems.forEach((item) => {
        const productKnowledge = item.productKnowledge;

        item.lots.forEach((lot) => {
          if (!lot.selectedInventoryId) return;

          const inventoryListForProduct =
            productKnowledgeInventoriesMap[productKnowledge.id];
          const selectedInventory = inventoryListForProduct?.find(
            (inv: InventoryRead) => inv.id === lot.selectedInventoryId,
          );

          if (!selectedInventory) {
            toast.error(
              `Inventory for ${productKnowledge.name} (Lot ID: ${lot.selectedInventoryId || "None"}) not found. Cannot dispense this lot.`,
            );
            return;
          }

          const dispenseData: MedicationDispenseCreate = {
            status: MedicationDispenseStatus.completed,
            category: MedicationDispenseCategory.outpatient,
            when_prepared: new Date(),
            dosage_instruction: [],
            encounter: encounterId,
            location: currentLocation.id,
            authorizing_prescription: null,
            item: selectedInventory.id,
            quantity: lot.quantity,
            days_supply: 1,
          };

          requests.push({
            url: `/api/v1/medication/dispense/`,
            method: "POST",
            reference_id: `dispense_${item.reference_id}_lot_${lot.selectedInventoryId}`,
            body: dispenseData,
          });
        });
      });

      return requests;
    },
    [productKnowledgeInventoriesMap, encounterId, currentLocation.id],
  );

  const handleDispense = useCallback(() => {
    const formData = form.getValues();

    // Use Zod-based validation
    if (!validateFormWithToasts(formData)) {
      return;
    }

    const selectedItems = formData.items.filter(
      (item) => item.isSelected && item.productKnowledge,
    ) as FormItemType[];

    const requests = createDispenseRequests(selectedItems);
    if (requests.length === 0) {
      toast.error(t("no_valid_requests_to_dispense"));
      return;
    }

    dispense({ requests });
  }, [form, validateFormWithToasts, createDispenseRequests, dispense, t]);

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
    defaultValue: [],
  });

  const selectedItemsCount = useMemo(
    () => watchedItems.filter((item) => item.isSelected).length,
    [watchedItems],
  );

  const hasSelectedItems = useMemo(
    () => watchedItems.some((item) => item.isSelected),
    [watchedItems],
  );

  const hasUndispensedItems = fields.length > 0;

  const handleLocationSelectorClick = useCallback(() => {
    if (hasUndispensedItems) {
      setIsLocationWarningOpen(true);
    } else {
      setIsLocationSelectorOpen(true);
    }
  }, [hasUndispensedItems]);

  const handleDiscardAndSwitch = useCallback(() => {
    setIsLocationWarningOpen(false);
    setIsLocationSelectorOpen(true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] p-0 flex flex-col bg-gray-50"
      >
        <div className="sticky top-0 z-10 border-b bg-gray-50 border-gray-200">
          <div className="absolute inset-x-0 top-0 h-2 w-16 mx-auto rounded-3xl bg-gray-300 mt-2" />
          <SheetHeader className="max-w-4xl mx-auto w-full py-5 flex flex-row justify-between items-center pt-7">
            <SheetTitle className="text-xl font-semibold m-0">
              {t("dispense")}
            </SheetTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <XIcon className="size-4" />
            </Button>
          </SheetHeader>
        </div>
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0 -m-4">
          {/* Selected Location */}
          <div className="my-4 mr-4">
            <Button
              variant="outline"
              className="w-full justify-between border-gray-300 text-left h-auto py-1 px-2 bg-gray-50 hover:bg-gray-100"
              onClick={handleLocationSelectorClick}
            >
              <div className="flex items-center gap-2">
                <LocateFixed
                  className="text-green-800 bg-primary-100 rounded-full p-0.5"
                  size={24}
                  style={{ width: "24px", height: "24px" }}
                  strokeWidth={1.5}
                />
                <div className="flex flex-col justify-start items-start">
                  <span className="text-sm font-normal text-gray-700">
                    {t("selected_location")}
                  </span>
                  <span className="text-sm font-medium text-gray-950">
                    {currentLocation.id === selectedLocation.id
                      ? selectedLocation.path
                      : buildLocationPath(currentLocation)}
                  </span>
                </div>
              </div>

              <CaretSortIcon />
            </Button>
          </div>

          <ScrollArea className="flex-1 h-0 pr-4">
            <Form {...form}>
              <form>
                {fields.length === 0 ? (
                  <EmptyState
                    icon="l-syringe"
                    title={t("no_items_added_yet")}
                    description={t("add_items_to_dispense_now_no_invoice")}
                    action={
                      <ProductKnowledgeSelect
                        onChange={(product) => {
                          append({
                            reference_id: crypto.randomUUID(),
                            productKnowledge: product,
                            isSelected: true,
                            quantity: 1,
                            lots: [
                              {
                                selectedInventoryId: "",
                                quantity: 1,
                              },
                            ],
                          });

                          setProductKnowledgeInventoriesMap((prev) => ({
                            [product.id]: undefined,
                            ...prev,
                          }));
                        }}
                        className="text-primary-800 border-primary-600"
                        placeholder={t("add_item")}
                      />
                    }
                  />
                ) : (
                  <>
                    <Table className="w-full border-separate border-spacing-y-2 px-1">
                      <TableHeader>
                        <TableRow className="divide-x">
                          <TableHead className="rounded-tl-md bg-gray-100 border-none">
                            <FormField
                              control={form.control}
                              name="items"
                              render={() => (
                                <FormItem className="mr-1.5">
                                  <FormControl>
                                    <Checkbox
                                      checked={
                                        form.watch("items").length > 0 &&
                                        form
                                          .watch("items")
                                          .every((q) => q.isSelected)
                                      }
                                      onCheckedChange={(checked) => {
                                        const items = form.getValues("items");
                                        items.forEach((_, index) => {
                                          form.setValue(
                                            `items.${index}.isSelected`,
                                            !!checked,
                                          );
                                        });
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableHead>
                          <TableHead className="bg-gray-100 text-gray-700">
                            {t("items")}
                          </TableHead>
                          <TableHead className="bg-gray-100 text-gray-700">
                            {t("select_lot")}
                          </TableHead>
                          <TableHead className="bg-gray-100 text-gray-700">
                            {t("quantity")}
                          </TableHead>
                          <TableHead className="bg-gray-100 text-gray-700">
                            {t("base_amount")}
                          </TableHead>
                          <TableHead className="bg-gray-100 rounded-tr-md text-gray-700">
                            {t("expiry")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {fields.map((field, index) => {
                          const productKnowledge =
                            field.productKnowledge as ProductKnowledgeBase;

                          return (
                            <TableRow
                              key={field.id}
                              className="hover:bg-gray-50 rounded-md shadow-sm divide-x"
                            >
                              <TableCell className="align-middle">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.isSelected`}
                                  render={({ field: formField }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Checkbox
                                          checked={formField.value}
                                          onCheckedChange={formField.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="font-medium text-gray-950 text-base">
                                {productKnowledge.name}
                              </TableCell>
                              {!productKnowledgeInventoriesMap[
                                productKnowledge.id
                              ]?.length ? (
                                <TableCell colSpan={4} className="text-center">
                                  <div className="flex items-center justify-center py-3 gap-2 italic">
                                    <Badge
                                      variant="destructive"
                                      className="text-sm"
                                    >
                                      {t("no_stock_available")}
                                    </Badge>
                                    {t(
                                      "no_stock_available_dispense_description",
                                    )}
                                  </div>
                                </TableCell>
                              ) : (
                                <>
                                  <TableCell>
                                    <div className="space-y-2">
                                      <Popover>
                                        <PopoverTrigger>
                                          <Button
                                            variant="outline"
                                            className="w-auto min-w-40 h-auto justify-between px-2 border-gray-300 border"
                                            type="button"
                                          >
                                            <div className="flex flex-col min-w-40 items-start gap-1 w-full">
                                              {(() => {
                                                const selectedLots = form
                                                  .watch(`items.${index}.lots`)
                                                  .filter(
                                                    (lot) =>
                                                      lot.selectedInventoryId,
                                                  );

                                                if (selectedLots.length === 0) {
                                                  return (
                                                    <span className="text-gray-500">
                                                      {t("select_stock")}
                                                    </span>
                                                  );
                                                }

                                                return selectedLots.map(
                                                  (lot) => {
                                                    const selectedInventory =
                                                      productKnowledgeInventoriesMap[
                                                        productKnowledge.id
                                                      ]?.find(
                                                        (inv) =>
                                                          inv.id ===
                                                          lot.selectedInventoryId,
                                                      );

                                                    return (
                                                      <div
                                                        key={
                                                          lot.selectedInventoryId
                                                        }
                                                        className="flex items-center justify-between w-full bg-gray-50 px-px py-px border-gray-200 border-1 rounded-sm text-gray-950"
                                                      >
                                                        <span className="font-medium text-sm ml-1">
                                                          {
                                                            selectedInventory
                                                              ?.product.batch
                                                              ?.lot_number
                                                          }
                                                        </span>
                                                        <Badge
                                                          variant={
                                                            selectedInventory?.status ===
                                                              "active" &&
                                                            selectedInventory?.net_content >
                                                              0
                                                              ? "primary"
                                                              : "destructive"
                                                          }
                                                          className="border-none rounded-sm"
                                                        >
                                                          {
                                                            selectedInventory?.net_content
                                                          }{" "}
                                                          {selectedInventory
                                                            ?.product
                                                            .product_knowledge
                                                            .base_unit
                                                            .display ||
                                                            t("units")}
                                                        </Badge>
                                                      </div>
                                                    );
                                                  },
                                                );
                                              })()}
                                            </div>
                                            <ChevronDownIcon className="size-4 shrink-0" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <div className="max-h-60 overflow-auto">
                                            {productKnowledgeInventoriesMap[
                                              productKnowledge.id
                                            ]?.length ? (
                                              productKnowledgeInventoriesMap[
                                                productKnowledge.id
                                              ]?.map((inv) => {
                                                const currentLots = form.watch(
                                                  `items.${index}.lots`,
                                                );
                                                const isSelected =
                                                  currentLots.some(
                                                    (lot) =>
                                                      lot.selectedInventoryId ===
                                                      inv.id,
                                                  );

                                                return (
                                                  <div
                                                    key={inv.id}
                                                    className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-accent"
                                                    onClick={() => {
                                                      const lots =
                                                        form.getValues(
                                                          `items.${index}.lots`,
                                                        );

                                                      if (isSelected) {
                                                        form.setValue(
                                                          `items.${index}.lots`,
                                                          lots.filter(
                                                            (lot) =>
                                                              lot.selectedInventoryId !==
                                                              inv.id,
                                                          ),
                                                        );
                                                      } else {
                                                        form.setValue(
                                                          `items.${index}.lots`,
                                                          [
                                                            ...lots,
                                                            {
                                                              selectedInventoryId:
                                                                inv.id,
                                                              quantity: 1,
                                                            },
                                                          ],
                                                        );
                                                      }
                                                    }}
                                                  >
                                                    <Checkbox
                                                      checked={isSelected}
                                                      className="mr-2"
                                                    />
                                                    <div className="flex-1 flex items-center justify-between">
                                                      <span>
                                                        {
                                                          inv.product.batch
                                                            ?.lot_number
                                                        }
                                                      </span>
                                                      <Badge
                                                        variant={
                                                          inv.status ===
                                                            "active" &&
                                                          inv.net_content > 0
                                                            ? "primary"
                                                            : "destructive"
                                                        }
                                                        className="ml-2"
                                                      >
                                                        {inv.net_content}{" "}
                                                        {inv.product
                                                          .product_knowledge
                                                          .base_unit.display ||
                                                          t("units")}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                );
                                              })
                                            ) : (
                                              <div className="p-4 text-center text-gray-500">
                                                {t("no_lots_found")}
                                              </div>
                                            )}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </TableCell>
                                  <TableCell className="space-y-2">
                                    {form
                                      .watch(`items.${index}.lots`)
                                      .filter((lot) => lot.selectedInventoryId)
                                      .map((lot) => {
                                        const actualLotIndex = form
                                          .watch(`items.${index}.lots`)
                                          .findIndex(
                                            (l) =>
                                              l.selectedInventoryId ===
                                              lot.selectedInventoryId,
                                          );

                                        return (
                                          <div
                                            key={lot.selectedInventoryId}
                                            className="flex items-center gap-2"
                                          >
                                            <FormField
                                              control={form.control}
                                              name={`items.${index}.lots.${actualLotIndex}.quantity`}
                                              render={({
                                                field: formField,
                                              }) => (
                                                <FormItem>
                                                  <FormControl>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      {...formField}
                                                      onChange={(e) => {
                                                        formField.onChange(
                                                          parseInt(
                                                            e.target.value,
                                                          ) || 0,
                                                        );
                                                      }}
                                                      className="border-gray-300 border rounded-md w-24"
                                                      placeholder="0"
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          </div>
                                        );
                                      })}
                                    {form
                                      .watch(`items.${index}.lots`)
                                      .filter((lot) => lot.selectedInventoryId)
                                      .length === 0 && (
                                      <div className="text-sm text-gray-500 py-2">
                                        {t("select_lots_first")}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {form
                                      .watch(`items.${index}.lots`)
                                      .filter((lot) => lot.selectedInventoryId)
                                      .map((lot) => {
                                        const selectedInventory =
                                          productKnowledgeInventoriesMap[
                                            productKnowledge.id
                                          ]?.find(
                                            (inv) =>
                                              inv.id ===
                                              lot.selectedInventoryId,
                                          );

                                        return (
                                          <div
                                            key={lot.selectedInventoryId}
                                            className="py-2.5 text-gray-950 font-normal text-base"
                                          >
                                            {selectedInventory?.product.charge_item_definition?.price_components
                                              .filter(
                                                (c) =>
                                                  c.monetary_component_type ===
                                                  MonetaryComponentType.base,
                                              )
                                              .map(
                                                (c) =>
                                                  `${c.code?.display || t("inr")} ${c.amount} `,
                                              )
                                              .join(" ") || "-"}
                                          </div>
                                        );
                                      })}
                                    {form
                                      .watch(`items.${index}.lots`)
                                      .filter((lot) => lot.selectedInventoryId)
                                      .length === 0 && (
                                      <div className="text-sm text-gray-500 py-2">
                                        -
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {form
                                      .watch(`items.${index}.lots`)
                                      .filter((lot) => lot.selectedInventoryId)
                                      .map((lot) => {
                                        const selectedInventory =
                                          productKnowledgeInventoriesMap[
                                            productKnowledge.id
                                          ]?.find(
                                            (inv) =>
                                              inv.id ===
                                              lot.selectedInventoryId,
                                          );

                                        return (
                                          <div
                                            key={lot.selectedInventoryId}
                                            className="py-2.5 text-gray-950 font-normal text-base"
                                          >
                                            {selectedInventory?.product
                                              .expiration_date
                                              ? formatDate(
                                                  selectedInventory?.product
                                                    .expiration_date,
                                                  "MM/yyyy",
                                                )
                                              : "-"}
                                          </div>
                                        );
                                      })}
                                    {form
                                      .watch(`items.${index}.lots`)
                                      .filter((lot) => lot.selectedInventoryId)
                                      .length === 0 && (
                                      <div className="text-sm text-gray-500 py-2">
                                        -
                                      </div>
                                    )}
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="my-4">
                      <ProductKnowledgeSelect
                        onChange={(product) => {
                          append({
                            reference_id: crypto.randomUUID(),
                            productKnowledge: product,
                            isSelected: true,
                            quantity: 1,
                            lots: [
                              {
                                selectedInventoryId: "",
                                quantity: 1,
                              },
                            ],
                          });

                          setProductKnowledgeInventoriesMap((prev) => ({
                            [product.id]: undefined,
                            ...prev,
                          }));
                        }}
                        className="text-primary-800 border-primary-600"
                        placeholder={t("add_item")}
                      />
                    </div>
                  </>
                )}
              </form>
            </Form>
          </ScrollArea>
        </div>
        {/* Footer */}
        {fields.length === 0 ? null : (
          <div className="sticky bottom-0 py-4 bg-white border-t px-4">
            <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
              <div className="text-xs text-gray-950 font-medium italic">
                {t("selected_items_count", {
                  count: selectedItemsCount,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="link"
                  className="font-semibold underline underline-offset-1"
                  onClick={() => onOpenChange(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleDispense}
                  className="font-semibold"
                  disabled={!hasSelectedItems || isPending}
                >
                  <Check className="size-4" />
                  {isPending ? t("dispensing") : t("confirm_dispense")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>

      <Dialog
        open={isLocationWarningOpen}
        onOpenChange={setIsLocationWarningOpen}
      >
        <DialogContent className="w-xs xl:w-sm">
          <DialogHeader>
            <DialogTitle>{t("change_location_confirm")}</DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              <Trans
                i18nKey="items_added_current_location_warning"
                components={{ strong: <strong className="font-semibold" /> }}
                values={{ location: selectedLocation.path }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDiscardAndSwitch}
              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white w-full"
            >
              {t("discard_and_switch")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsLocationWarningOpen(false)}
              className="w-full"
            >
              {t("stay_here")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LocationSelectorDialog
        facilityId={facilityId}
        location={currentLocation}
        setLocation={(location) =>
          setCurrentLocation(location || currentLocation)
        }
        open={isLocationSelectorOpen}
        setOpen={setIsLocationSelectorOpen}
        onLocationSelect={handleLocationChange}
      />
    </Sheet>
  );
}
