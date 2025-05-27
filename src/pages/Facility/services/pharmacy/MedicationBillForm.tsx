import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { MoreVertical, PlusIcon, XIcon } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ComboboxQuantityInput from "@/components/Common/ComboboxQuantityInput";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { MultiValueSetSelect } from "@/components/Medicine/MultiValueSetSelect";
import { formatDoseRange } from "@/components/Medicine/utils";
import { reverseFrequencyOption } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import {
  MedicationDispenseCategory,
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  DoseRange,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
  UCUM_TIME_UNITS,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface Props {
  patientId: string;
}

function convertDurationToDays(value: number, unit: string): number {
  switch (unit) {
    case "h":
      return Math.round(value / 24);
    case "d":
      return value;
    case "wk":
      return value * 7;
    case "mo":
      return value * 30; // approximating month as 30 days
    case "a":
      return value * 365; // approximating year as 365 days
    default:
      return value;
  }
}

const formSchema = z.object({
  items: z.array(
    z.object({
      reference_id: z.string().uuid(),
      medication: z.any(),
      productKnowledge: z.any(),
      isSelected: z.boolean(),
      daysSupply: z.number().min(0),
      isFullyDispensed: z.boolean(),
      dosageInstructions: z.any().optional(),
      lots: z
        .array(
          z.object({
            selectedInventoryId: z.string().uuid(),
            quantity: z.number().min(0),
          }),
        )
        .min(1),
    }),
  ),
});

type FormValues = z.infer<typeof formSchema>;

export default function MedicationBillForm({ patientId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();
  const [productKnowledgeInventoriesMap, setProductKnowledgeInventoriesMap] =
    useState<Record<string, InventoryRead[] | undefined>>({});
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [extractedChargeItems, setExtractedChargeItems] = useState<
    ChargeItemRead[]
  >([]);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const { data: account } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_requests", patientId, "dispense"],
    queryFn: async ({ signal }) => {
      const medicationResponse = await query(medicationRequestApi.list, {
        pathParams: { patientId },
        queryParams: {
          facility: facilityId,
          limit: 100,
          status: "active,on-hold,draft,unknown,ended,completed,cancelled",
        },
      })({ signal });

      const productKnowledgeIds = medicationResponse.results
        .filter((medication) => medication.requested_product)
        .reduce(
          (acc, medication) => ({
            ...acc,
            [medication.requested_product!.id]: undefined,
          }),
          {},
        );

      setProductKnowledgeInventoriesMap((prev) => ({
        ...productKnowledgeIds,
        ...prev,
      }));

      return medicationResponse;
    },
  });

  useEffect(() => {
    const fetchMissingInventories = async () => {
      for (const [productKnowledgeId, inventories] of Object.entries(
        productKnowledgeInventoriesMap,
      )) {
        if (inventories) continue;

        const inventoriesResponse = await query(inventoryApi.list, {
          pathParams: { facilityId, locationId },
          queryParams: {
            limit: 100,
            product_knowledge: productKnowledgeId,
          },
        })({ signal: new AbortController().signal });

        setProductKnowledgeInventoriesMap((prev) => ({
          ...prev,
          [productKnowledgeId]: inventoriesResponse.results || [],
        }));
      }
    };

    fetchMissingInventories();
  }, [productKnowledgeInventoriesMap, facilityId, locationId]);

  const medications =
    response?.results.filter((med) => med.requested_product) || [];

  const { data: productKnowledges, isFetching: isProductLoading } = useQuery({
    queryKey: ["productKnowledge", "medication", search],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        offset: 0,
        name: search,
        product_type: "medication",
        status: "active",
      },
    }),
  });

  useEffect(() => {
    medications.forEach((medication) => {
      append({
        reference_id: crypto.randomUUID(),
        productKnowledge: medication.requested_product,
        medication,
        isSelected: true,
        daysSupply: convertDurationToDays(
          medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
            ?.value || 0,
          medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
            ?.unit || "",
        ),
        isFullyDispensed: false,
        dosageInstructions: medication.dosage_instruction,
        lots: [
          {
            selectedInventoryId:
              (medication.inventory_items_internal?.[0]?.id as string) || "",
            quantity: computeInitialQuantity(medication),
          },
        ],
      });
    });
  }, [medications.length]);

  function computeInitialQuantity(medication: MedicationRequestRead) {
    const instruction = medication.dosage_instruction[0];
    if (!instruction) return 0;

    const dosage = instruction.dose_and_rate?.dose_quantity?.value || 0;
    const duration = instruction.timing?.repeat?.bounds_duration?.value || 0;
    const frequency = instruction.timing?.code?.code || "";

    let dosesPerDay = 1;
    if (frequency.includes("BID")) dosesPerDay = 2;
    if (frequency.includes("TID")) dosesPerDay = 3;
    if (frequency.includes("QID")) dosesPerDay = 4;

    return dosage * dosesPerDay * duration;
  }

  const { mutate: dispense, isPending } = useMutation({
    mutationFn: mutate(routes.batchRequest),
    onSuccess: (response) => {
      toast.success(t("medications_dispensed_successfully"));
      queryClient.invalidateQueries({ queryKey: ["medications"] });

      // Extract charge items and open invoice sheet
      const chargeItems = extractChargeItemsFromBatchResponse(
        response as unknown as ChargeItemBatchResponse,
      );
      setExtractedChargeItems(chargeItems);
      setIsInvoiceSheetOpen(true);
    },
    onError: (error) => {
      try {
        const errorData = error.cause as {
          results?: {
            data?: { detail?: string; errors?: { msg: string }[] };
          }[];
        };

        const errorMessages = errorData?.results
          ?.flatMap(
            (result) =>
              result?.data?.errors?.map((err) => err.msg) || // Extract from `errors[].msg`
              (result?.data?.detail ? [result.data.detail] : []), // Extract from `data.detail`
          )
          .filter(Boolean); // Remove undefined/null values

        if (errorMessages?.length) {
          errorMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error(t("error_dispensing_medications"));
        }
      } catch {
        toast.error(t("error_dispensing_medications"));
      }
    },
  });

  const calculatePrices = (inventory: InventoryRead | undefined) => {
    if (!inventory)
      return {
        basePrice: 0,
      };

    const priceComponents =
      inventory.product.charge_item_definition.price_components;

    // Get base price
    const baseComponent = priceComponents.find(
      (component) =>
        component.monetary_component_type === MonetaryComponentType.base,
    );
    const basePrice = baseComponent?.amount || 0;

    return {
      basePrice,
    };
  };

  const handleDispense = () => {
    const selectedItems = form
      .getValues("items")
      .filter((item) => item.isSelected);

    const medsWithZeroQuantity = selectedItems.filter((item) => {
      return item.lots.every((lot) => lot.quantity === 0);
    });

    if (medsWithZeroQuantity.length > 0) {
      toast.error(
        t("please_select_quantity_for_medications", {
          medications: medsWithZeroQuantity
            .map((item) => item.productKnowledge.name)
            .join(", "),
        }),
      );
      return;
    }

    const medsWithoutInventory = selectedItems.filter((item) => {
      return item.lots.some((lot) => !lot.selectedInventoryId);
    });

    if (medsWithoutInventory.length > 0) {
      toast.error(
        t("please_select_inventory_for_medications", {
          medications: medsWithoutInventory
            .map((item) => item.productKnowledge.name)
            .join(", "),
        }),
      );
      return;
    }

    const requests = [];
    const defaultEncounterId = response?.results[0]?.encounter;

    // Add all dispense requests - now one per lot
    selectedItems.forEach((item) => {
      const medication = item.medication as MedicationRequestRead | undefined;
      const productKnowledge = item.productKnowledge as ProductKnowledgeBase;

      item.lots.forEach((lot, lotIndex) => {
        const selectedInventory = productKnowledgeInventoriesMap[
          productKnowledge.id
        ]?.find((inv: InventoryRead) => inv.id === lot.selectedInventoryId);

        if (!selectedInventory) {
          return;
        }

        const dispenseData: MedicationDispenseCreate = {
          status: MedicationDispenseStatus.preparation,
          category: MedicationDispenseCategory.outpatient,
          when_prepared: new Date(),
          dosage_instruction: item.dosageInstructions ?? [],
          encounter: medication?.encounter ?? defaultEncounterId!,
          location: locationId,
          authorizing_prescription: medication?.id ?? null,
          item: selectedInventory.id,
          quantity: lot.quantity,
          days_supply: item.daysSupply,
        };

        requests.push({
          url: `/api/v1/medication/dispense/`,
          method: "POST",
          reference_id: `dispense_${item.reference_id}_lot_${lotIndex}`,
          body: dispenseData,
        });
      });
    });

    // Get all medications marked as fully dispensed
    const fullyDispensedMedications = selectedItems
      .filter((item) => item.isFullyDispensed && item.medication)
      .map((item) => item.medication);

    // If there are any fully dispensed medications, add a single upsert request
    if (fullyDispensedMedications.length > 0) {
      requests.push({
        url: `/api/v1/patient/${patientId}/medication/request/upsert/`,
        method: "POST",
        reference_id: "medication_request_updates",
        body: {
          datapoints: fullyDispensedMedications.map((medication) => ({
            ...medication,
            dispense_status: "complete",
          })),
        },
      });
    }

    dispense({ requests });
  };

  const handleShowAlternatives = (_medicationId?: string) => {
    toast.info(t("alternatives_coming_soon"));
  };

  return (
    <Page title={t("bill_medications")}>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => navigate(`../${patientId}`)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleDispense}
              disabled={
                !form.watch("items").some((q) => q.isSelected) || isPending
              }
            >
              {isPending ? t("billing") : t("bill_selected")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : (
          <Form {...form}>
            <form className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <FormField
                        control={form.control}
                        name="items"
                        render={() => (
                          <FormItem>
                            <FormControl>
                              <Checkbox
                                checked={
                                  form.watch("items").length > 0 &&
                                  form.watch("items").every((q) => q.isSelected)
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
                    <TableHead>{t("medicine")}</TableHead>
                    <TableHead>{t("select_lot")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("days_supply")}</TableHead>
                    <TableHead>{t("expiry")}</TableHead>
                    <TableHead>{t("unit_price")}</TableHead>
                    <TableHead>{t("discount")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const productKnowledge =
                      field.productKnowledge as ProductKnowledgeBase;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {productKnowledge.name}
                            </div>
                            {field.medication ? (
                              <div className="text-sm text-muted-foreground">
                                {/* Existing medication - show read-only dosage instructions */}
                                {
                                  field.dosageInstructions?.[0]?.dose_and_rate
                                    ?.dose_quantity?.value
                                }{" "}
                                {
                                  field.dosageInstructions?.[0]?.dose_and_rate
                                    ?.dose_quantity?.unit?.display
                                }{" "}
                                ×{" "}
                                {
                                  field.dosageInstructions?.[0]?.timing?.code
                                    ?.code
                                }{" "}
                                ×{" "}
                                {field.dosageInstructions?.[0]?.timing?.repeat
                                  ?.bounds_duration?.value || 0}
                                {
                                  field.dosageInstructions?.[0]?.timing?.repeat
                                    ?.bounds_duration?.unit
                                }{" "}
                                ={" "}
                                {(() => {
                                  const dosage =
                                    field.dosageInstructions?.[0]?.dose_and_rate
                                      ?.dose_quantity?.value || 0;
                                  const duration =
                                    field.dosageInstructions?.[0]?.timing
                                      ?.repeat?.bounds_duration?.value || 0;
                                  const frequency =
                                    field.dosageInstructions?.[0]?.timing?.code
                                      ?.code || "";

                                  let dosesPerDay = 1;
                                  if (frequency.includes("BID"))
                                    dosesPerDay = 2;
                                  if (frequency.includes("TID"))
                                    dosesPerDay = 3;
                                  if (frequency.includes("QID"))
                                    dosesPerDay = 4;

                                  return dosage * dosesPerDay * duration;
                                })()}{" "}
                                {t("units")}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {/* Newly added medication - allow editing dosage instructions */}
                                <AddDosageInstructionPopover
                                  dosageInstructions={form.watch(
                                    `items.${index}.dosageInstructions`,
                                  )}
                                  onChange={(value) => {
                                    form.setValue(
                                      `items.${index}.dosageInstructions`,
                                      value,
                                      { shouldDirty: true, shouldTouch: true },
                                    );
                                    // Recalculate days supply based on new dosage instructions
                                    if (value?.[0]) {
                                      const newDaysSupply =
                                        convertDurationToDays(
                                          value[0]?.timing?.repeat
                                            ?.bounds_duration?.value || 0,
                                          value[0]?.timing?.repeat
                                            ?.bounds_duration?.unit || "",
                                        );
                                      form.setValue(
                                        `items.${index}.daysSupply`,
                                        newDaysSupply,
                                        {
                                          shouldDirty: true,
                                          shouldTouch: true,
                                        },
                                      );
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {productKnowledgeInventoriesMap[productKnowledge.id]
                            ?.length ? (
                            <div className="space-y-2">
                              {form
                                .watch(`items.${index}.lots`)
                                .map((lot, lotIndex) => (
                                  <div
                                    key={lotIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.lots.${lotIndex}.selectedInventoryId`}
                                      render={({ field: formField }) => (
                                        <FormItem className="flex-1">
                                          <Select
                                            value={formField.value}
                                            onValueChange={formField.onChange}
                                          >
                                            <SelectTrigger className="w-[200px]">
                                              <SelectValue
                                                placeholder={
                                                  !productKnowledgeInventoriesMap[
                                                    productKnowledge.id
                                                  ]?.length
                                                    ? t("no_stock")
                                                    : t("select_stock")
                                                }
                                              />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {productKnowledgeInventoriesMap[
                                                productKnowledge.id
                                              ]?.map((inv) => (
                                                <SelectItem
                                                  key={inv.id}
                                                  value={inv.id}
                                                >
                                                  {"Lot #" +
                                                    inv.product.batch
                                                      ?.lot_number}{" "}
                                                  <Badge
                                                    variant={
                                                      inv.status === "active" &&
                                                      inv.net_content > 0
                                                        ? "primary"
                                                        : "primary"
                                                    }
                                                  >
                                                    {inv.net_content !== 0
                                                      ? Math.abs(
                                                          inv.net_content,
                                                        )
                                                      : 150}{" "}
                                                    {t("units")}
                                                  </Badge>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </FormItem>
                                      )}
                                    />
                                    <div className="">
                                      {form.watch(`items.${index}.lots`)
                                        .length > 1 && (
                                        <Button
                                          variant="ghost"
                                          type="button"
                                          size="sm"
                                          className="[&_svg]:size-3"
                                          onClick={() => {
                                            const lots = form.getValues(
                                              `items.${index}.lots`,
                                            );
                                            form.setValue(
                                              `items.${index}.lots`,
                                              lots.filter(
                                                (_, i) => i !== lotIndex,
                                              ),
                                            );
                                          }}
                                        >
                                          <XIcon />
                                        </Button>
                                      )}
                                      {lotIndex ===
                                        form.watch(`items.${index}.lots`)
                                          .length -
                                          1 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="[&_svg]:size-3"
                                          onClick={() => {
                                            const lots = form.getValues(
                                              `items.${index}.lots`,
                                            );
                                            form.setValue(
                                              `items.${index}.lots`,
                                              [
                                                ...lots,
                                                {
                                                  selectedInventoryId: "",
                                                  quantity: 0,
                                                },
                                              ],
                                            );
                                          }}
                                        >
                                          <PlusIcon />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <Badge variant="destructive">{t("no_stock")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {form
                              .watch(`items.${index}.lots`)
                              .map((lot, lotIndex) => (
                                <div
                                  key={lotIndex}
                                  className="flex items-center gap-2"
                                >
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.lots.${lotIndex}.quantity`}
                                    render={({ field: formField }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={0}
                                            {...formField}
                                            onChange={(e) => {
                                              formField.onChange(
                                                parseInt(e.target.value) || 0,
                                              );
                                            }}
                                            className="w-24"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="flex flex-col">
                          <FormField
                            control={form.control}
                            name={`items.${index}.daysSupply`}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    {...formField}
                                    onChange={(e) => {
                                      formField.onChange(
                                        parseInt(e.target.value) || 0,
                                      );
                                    }}
                                    className="w-24"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          {form
                            .watch(`items.${index}.lots`)
                            .map((lot, lotIndex) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  productKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );

                              return (
                                <div key={lotIndex} className="py-2.5">
                                  {selectedInventory?.product.expiration_date
                                    ? formatDate(
                                        selectedInventory?.product
                                          .expiration_date,
                                        "MM/yyyy",
                                      )
                                    : "-"}
                                </div>
                              );
                            })}
                        </TableCell>
                        <TableCell>
                          {form
                            .watch(`items.${index}.lots`)
                            .map((lot, lotIndex) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  productKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );
                              const prices = calculatePrices(selectedInventory);

                              return (
                                <div key={lotIndex} className="py-2.5">
                                  <MonetaryDisplay amount={prices.basePrice} />
                                </div>
                              );
                            })}
                        </TableCell>
                        <TableCell>
                          {form
                            .watch(`items.${index}.lots`)
                            .map((lot, lotIndex) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  productKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );

                              return selectedInventory ? (
                                <div key={lotIndex} className="py-2.5">
                                  {selectedInventory.product.charge_item_definition.price_components
                                    .filter(
                                      (c) =>
                                        c.monetary_component_type ===
                                        MonetaryComponentType.discount,
                                    )
                                    .map((component) =>
                                      component.factor
                                        ? `${component.factor}%`
                                        : "--",
                                    )}
                                </div>
                              ) : (
                                <div key={lotIndex} className="mb-2">
                                  --
                                </div>
                              );
                            })}
                        </TableCell>
                        <TableCell>
                          {form
                            .watch(`items.${index}.lots`)
                            .map((lot, lotIndex) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  productKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );
                              const prices = calculatePrices(selectedInventory);

                              return (
                                <div key={lotIndex} className="py-2.5">
                                  <MonetaryDisplay
                                    amount={prices.basePrice * lot.quantity}
                                  />
                                </div>
                              );
                            })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleShowAlternatives(productKnowledge.id)
                              }
                            >
                              {t("alt")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="[&_svg]:size-4"
                              type="button"
                            >
                              <MoreVertical />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={12} className="p-0">
                      {isSearchOpen ? (
                        <Command className="w-full rounded-none border-none">
                          <CommandInput
                            placeholder={t("search_products")}
                            onValueChange={setSearch}
                            value={search}
                            className="h-12 border-none"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setIsSearchOpen(false);
                                setSearch("");
                              }
                            }}
                          />
                          <CommandList className="max-h-[300px] overflow-auto">
                            <CommandEmpty>
                              {search.length < 3 ? (
                                <p className="p-4 text-sm text-gray-500">
                                  {t("min_char_length_error", {
                                    min_length: 3,
                                  })}
                                </p>
                              ) : isProductLoading ? (
                                <p className="p-4 text-sm text-gray-500">
                                  {t("searching")}
                                </p>
                              ) : (
                                <p className="p-4 text-sm text-gray-500">
                                  {t("no_results_found")}
                                </p>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {productKnowledges?.results?.map(
                                (productKnowledge) => (
                                  <CommandItem
                                    key={productKnowledge.id}
                                    value={productKnowledge.name}
                                    onSelect={() => {
                                      append({
                                        reference_id: crypto.randomUUID(),
                                        productKnowledge,
                                        isSelected: true,
                                        daysSupply: 0,
                                        isFullyDispensed: false,
                                        dosageInstructions: [],
                                        lots: [
                                          {
                                            selectedInventoryId: "",
                                            quantity: 0,
                                          },
                                        ],
                                      });

                                      setProductKnowledgeInventoriesMap(
                                        (prev) => ({
                                          [productKnowledge.id]: undefined,
                                          ...prev,
                                        }),
                                      );
                                      setIsSearchOpen(false);
                                      setSearch("");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {productKnowledge.name}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ),
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-12 flex items-center justify-center gap-2 hover:bg-gray-100"
                          onClick={() => setIsSearchOpen(true)}
                        >
                          <PlusIcon className="h-6 w-6" />
                          <span>{t("add_medication")}</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </form>
          </Form>
        )}

        {account?.results[0] && (
          <CreateInvoiceSheet
            facilityId={facilityId}
            accountId={account?.results[0].id}
            open={isInvoiceSheetOpen}
            onOpenChange={setIsInvoiceSheetOpen}
            preSelectedChargeItems={extractedChargeItems}
            onSuccess={() => {
              setIsInvoiceSheetOpen(false);
              navigate(
                `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/dispense`,
              );
            }}
          />
        )}
      </div>
    </Page>
  );
}

type AddDosageInstructionPopoverProps = {
  dosageInstructions?: MedicationRequestDosageInstruction[];
  onChange?: (value?: MedicationRequestDosageInstruction[]) => void;
};

const AddDosageInstructionPopover = ({
  dosageInstructions,
  onChange,
}: AddDosageInstructionPopoverProps) => {
  const { t } = useTranslation();
  const [showDosageDialog, setShowDosageDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [localDosageInstruction, setLocalDosageInstruction] = useState<
    MedicationRequestDosageInstruction | undefined
  >(dosageInstructions?.[0]);

  useEffect(() => {
    if (open) {
      setLocalDosageInstruction(
        dosageInstructions?.[0] || {
          // Provide default values for newly added medications
          dose_and_rate: undefined,
          timing: undefined,
          as_needed_boolean: false,
          route: undefined,
          site: undefined,
          method: undefined,
          additional_instruction: undefined,
          as_needed_for: undefined,
        },
      );
    }
  }, [open, dosageInstructions]);

  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    setLocalDosageInstruction((prev) => ({
      // Provide default object if prev is undefined
      dose_and_rate: undefined,
      timing: undefined,
      as_needed_boolean: false,
      route: undefined,
      site: undefined,
      method: undefined,
      additional_instruction: undefined,
      as_needed_for: undefined,
      ...prev,
      ...updates,
    }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
          {/* Use current dosageInstructions prop or show placeholder for new medications */}
          {dosageInstructions?.[0]?.dose_and_rate ? (
            <div className="line-clamp-2">
              {dosageInstructions[0]?.dose_and_rate?.dose_quantity?.value}{" "}
              {
                dosageInstructions[0]?.dose_and_rate?.dose_quantity?.unit
                  ?.display
              }{" "}
              × {dosageInstructions[0]?.timing?.code?.code} ×{" "}
              {dosageInstructions[0]?.timing?.repeat?.bounds_duration?.value ||
                0}
              {dosageInstructions[0]?.timing?.repeat?.bounds_duration?.unit} ={" "}
              {/* Calculate total quantity based on dosage instructions */}
              {(() => {
                const dosage =
                  dosageInstructions[0]?.dose_and_rate?.dose_quantity?.value ||
                  0;
                const duration =
                  dosageInstructions[0]?.timing?.repeat?.bounds_duration
                    ?.value || 0;
                const frequency =
                  dosageInstructions[0]?.timing?.code?.code || "";

                let dosesPerDay = 1;
                if (frequency.includes("BID")) dosesPerDay = 2;
                if (frequency.includes("TID")) dosesPerDay = 3;
                if (frequency.includes("QID")) dosesPerDay = 4;

                return dosage * dosesPerDay * duration;
              })()}{" "}
              {t("units")}
            </div>
          ) : (
            <div className="line-clamp-2 text-muted-foreground cursor-pointer hover:text-gray-900">
              {t("click_to_add_dosage_instructions")}
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="sm:w-[400px] p-4 flex flex-col gap-2">
        {/* Dosage */}
        <div>
          <Label className="mb-1.5 block text-sm">
            {t("dosage")}
            <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <div data-cy="dosage">
            {localDosageInstruction?.dose_and_rate?.dose_range ? (
              <Input
                readOnly
                value={formatDoseRange(
                  localDosageInstruction.dose_and_rate.dose_range,
                )}
                onClick={() => setShowDosageDialog(true)}
                className={cn("h-9 text-sm cursor-pointer mb-3")}
              />
            ) : (
              <>
                <div>
                  <ComboboxQuantityInput
                    data-cy="dosage-input"
                    quantity={
                      localDosageInstruction?.dose_and_rate?.dose_quantity
                    }
                    onChange={(value) => {
                      if (!value.value || !value.unit) return;
                      handleUpdateDosageInstruction({
                        dose_and_rate: {
                          type: "ordered",
                          dose_quantity: {
                            value: value.value,
                            unit: value.unit,
                          },
                          dose_range: undefined,
                        },
                      });
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-3 rounded-full hover:bg-transparent"
                    onClick={() => setShowDosageDialog(true)}
                  >
                    +
                  </Button>
                </div>
              </>
            )}
          </div>

          {localDosageInstruction?.dose_and_rate?.dose_range && (
            <Popover open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <PopoverTrigger asChild>
                <div className="w-full" />
              </PopoverTrigger>
              <PopoverContent className="w-55 p-4" align="start">
                <DosageDialog
                  dosageRange={localDosageInstruction.dose_and_rate.dose_range}
                  onChange={(value) => {
                    handleUpdateDosageInstruction({
                      dose_and_rate: value,
                    });
                    setShowDosageDialog(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        {/* Frequency */}
        <div>
          <Label className="mb-1.5 block text-sm">
            {t("frequency")}
            <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <Select
            value={
              localDosageInstruction?.as_needed_boolean
                ? "PRN"
                : reverseFrequencyOption(localDosageInstruction?.timing)
            }
            onValueChange={(value) => {
              if (value === "PRN") {
                handleUpdateDosageInstruction({
                  as_needed_boolean: true,
                  timing: undefined,
                });
              } else {
                const timingOption =
                  MEDICATION_REQUEST_TIMING_OPTIONS[
                    value as keyof typeof MEDICATION_REQUEST_TIMING_OPTIONS
                  ];
                handleUpdateDosageInstruction({
                  as_needed_boolean: false,
                  timing: timingOption.timing,
                });
              }
            }}
          >
            <SelectTrigger data-cy="frequency" className={cn("h-9 text-sm")}>
              <SelectValue placeholder={t("select_frequency")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRN">{t("as_needed_prn")}</SelectItem>
              {Object.entries(MEDICATION_REQUEST_TIMING_OPTIONS).map(
                ([key, option]) => (
                  <SelectItem key={key} value={key}>
                    {option.display}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        {/* Duration */}
        <div>
          <Label className="mb-1.5 block text-sm">{t("duration")}</Label>
          <div
            className={cn(
              "flex gap-2",
              localDosageInstruction?.as_needed_boolean &&
                "opacity-50 bg-gray-100 rounded-md",
            )}
          >
            {localDosageInstruction?.timing && (
              <Input
                type="number"
                min={0}
                value={
                  localDosageInstruction.timing.repeat.bounds_duration?.value ==
                  0
                    ? ""
                    : localDosageInstruction.timing.repeat.bounds_duration
                        ?.value
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (!localDosageInstruction.timing) return;
                  handleUpdateDosageInstruction({
                    timing: {
                      ...localDosageInstruction.timing,
                      repeat: {
                        ...localDosageInstruction.timing.repeat,
                        bounds_duration: {
                          value: Number(value),
                          unit: localDosageInstruction.timing.repeat
                            .bounds_duration.unit,
                        },
                      },
                    },
                  });
                }}
                className="h-9 text-sm"
              />
            )}
            <Select
              value={
                localDosageInstruction?.timing?.repeat?.bounds_duration?.unit ??
                UCUM_TIME_UNITS[0]
              }
              onValueChange={(unit: (typeof UCUM_TIME_UNITS)[number]) => {
                if (localDosageInstruction?.timing?.repeat) {
                  const value =
                    localDosageInstruction?.timing?.repeat?.bounds_duration
                      ?.value ?? 0;
                  handleUpdateDosageInstruction({
                    timing: {
                      ...localDosageInstruction.timing,
                      repeat: {
                        ...localDosageInstruction.timing.repeat,
                        bounds_duration: { value, unit },
                      },
                    },
                  });
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-9 text-sm w-full",
                  localDosageInstruction?.as_needed_boolean &&
                    "cursor-not-allowed bg-gray-50",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UCUM_TIME_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Instructions */}
        <div data-cy="instructions">
          <Label className="mb-1.5 block text-sm">{t("instructions")}</Label>
          {localDosageInstruction?.as_needed_boolean ? (
            <MultiValueSetSelect
              options={[
                {
                  system: "system-as-needed-reason",
                  value: localDosageInstruction?.as_needed_for || null,
                  label: t("prn_reason"),
                  placeholder: t("select_prn_reason"),
                  onSelect: (value: Code | null) => {
                    handleUpdateDosageInstruction({
                      as_needed_for: value || undefined,
                    });
                  },
                },
                {
                  system: "system-additional-instruction",
                  value:
                    localDosageInstruction?.additional_instruction?.[0] || null,
                  label: t("additional_instructions"),
                  placeholder: t("select_additional_instructions"),
                  onSelect: (value: Code | null) => {
                    handleUpdateDosageInstruction({
                      additional_instruction: value ? [value] : undefined,
                    });
                  },
                },
              ]}
            />
          ) : (
            <ValueSetSelect
              system="system-additional-instruction"
              value={localDosageInstruction?.additional_instruction?.[0]}
              onSelect={(instruction) => {
                handleUpdateDosageInstruction({
                  additional_instruction: instruction
                    ? [instruction]
                    : undefined,
                });
              }}
              placeholder={t("select_additional_instructions")}
              data-cy="medication-instructions"
              wrapTextForSmallScreen
            />
          )}
        </div>
        {/* Route */}
        <div data-cy="route">
          <Label className="mb-1.5 block text-sm">{t("route")}</Label>
          <ValueSetSelect
            system="system-route"
            value={localDosageInstruction?.route}
            onSelect={(route) => {
              handleUpdateDosageInstruction({ route });
            }}
            placeholder={t("select_route")}
          />
        </div>
        {/* Site */}
        <div data-cy="site">
          <Label className="mb-1.5 block text-sm">{t("site")}</Label>
          <ValueSetSelect
            system="system-body-site"
            value={localDosageInstruction?.site}
            onSelect={(site) => {
              handleUpdateDosageInstruction({ site });
            }}
            placeholder={t("select_site")}
            wrapTextForSmallScreen={true}
          />
        </div>
        {/* Method */}
        <div data-cy="method">
          <Label className="mb-1.5 block text-sm">{t("method")}</Label>
          <ValueSetSelect
            system="system-administration-method"
            value={localDosageInstruction?.method}
            onSelect={(method) => {
              handleUpdateDosageInstruction({ method });
            }}
            placeholder={t("select_method")}
            count={20}
          />
        </div>

        {/* Add Save/Cancel buttons at the bottom */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => {
              // Validate that we have minimum required fields
              if (
                localDosageInstruction?.dose_and_rate &&
                (localDosageInstruction.as_needed_boolean ||
                  localDosageInstruction.timing)
              ) {
                onChange?.([localDosageInstruction]);
                setOpen(false);
              }
            }}
            disabled={
              !localDosageInstruction?.dose_and_rate ||
              (!localDosageInstruction.as_needed_boolean &&
                !localDosageInstruction.timing)
            }
          >
            {t("save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface DosageDialogProps {
  dosageRange: DoseRange;
  onChange?: (
    value?: MedicationRequestDosageInstruction["dose_and_rate"],
  ) => void;
}

const DosageDialog: React.FC<DosageDialogProps> = ({
  dosageRange,
  onChange,
}) => {
  const { t } = useTranslation();

  const [localDoseRange, setLocalDoseRange] = useState<DoseRange>(dosageRange);

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium text-base">{t("taper_titrate_dosage")}</div>
      <div>
        <Label className="mb-1.5">{t("start_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.low}
          onChange={(value) => {
            setLocalDoseRange((prev) => ({
              ...prev,
              low: value,
              high: {
                ...prev.high,
                unit: value.unit,
              },
            }));
          }}
        />
      </div>
      <div>
        <Label className="mb-1.5">{t("end_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.high}
          onChange={(value) => {
            setLocalDoseRange((prev) => ({
              ...prev,
              high: value,
              low: {
                ...prev.low,
                unit: value.unit,
              },
            }));
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            onChange?.(undefined);
          }}
        >
          {t("clear")}
        </Button>
        <Button
          onClick={() => {
            onChange?.({
              type: "ordered",
              dose_range: localDoseRange,
            });
          }}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
};
