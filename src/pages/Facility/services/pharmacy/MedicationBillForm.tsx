import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { PlusIcon } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
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

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
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
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
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
      quantity: z.number().min(0),
      isSelected: z.boolean(),
      daysSupply: z.number().min(0),
      isFullyDispensed: z.boolean(),
      selectedInventoryId: z.string().uuid(),
    }),
  ),
});

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, update } = useFieldArray({
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
  const encounterId = response?.results[0]?.encounter;

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
        quantity: computeInitialQuantity(medication),
        isSelected: true,
        daysSupply: convertDurationToDays(
          medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
            ?.value || 0,
          medication.dosage_instruction[0]?.timing?.repeat?.bounds_duration
            ?.unit || "",
        ),
        isFullyDispensed: false,
        selectedInventoryId: medication.inventory_items_internal?.[0]
          ?.id as string,
      });
    });
  }, [medications.length]);

  function computeInitialQuantity(medication: any) {
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

    const requests = [];

    // Add all dispense requests
    selectedItems.forEach((item) => {
      const medication = item.medication as MedicationRequestRead | undefined;
      const productKnowledge = item.productKnowledge as ProductKnowledgeBase;
      const selectedInventory = productKnowledgeInventoriesMap[
        productKnowledge.id
      ]?.find((inv: InventoryRead) => inv.id === item.selectedInventoryId);

      if (!selectedInventory) {
        return;
      }

      const dispenseData: MedicationDispenseCreate = {
        status: MedicationDispenseStatus.preparation,
        category: MedicationDispenseCategory.outpatient,
        when_prepared: new Date(),
        dosage_instruction: medication?.dosage_instruction?.[0] as any,
        encounter: encounterId!,
        location: locationId,
        authorizing_prescription: medication?.id ?? null,
        item: selectedInventory.id,
        quantity: item.quantity,
        days_supply: item.daysSupply,
      };

      requests.push({
        url: `/api/v1/medication/dispense/`,
        method: "POST",
        reference_id: `dispense_${item.reference_id}`,
        body: dispenseData,
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
      <div className="container mx-auto">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        form.watch("items").length > 0 &&
                        form.watch("items").every((q) => q.isSelected)
                      }
                      onCheckedChange={(checked) =>
                        form.getValues("items").map((_, index) =>
                          update(index, {
                            ...fields[index],
                            isSelected: !!checked,
                          }),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>{t("medicine")}</TableHead>
                  <TableHead>{t("select_lot")}</TableHead>
                  <TableHead>{t("expiry")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("days_supply")}</TableHead>
                  <TableHead>{t("price")}</TableHead>
                  <TableHead>{t("discount")}</TableHead>
                  {Array.from(
                    new Set(
                      medications
                        .flatMap(
                          (med) =>
                            med.inventory_items_internal?.flatMap((inventory) =>
                              inventory.product.charge_item_definition.price_components
                                .filter(
                                  (c: any) =>
                                    c.monetary_component_type ===
                                    MonetaryComponentType.tax,
                                )
                                .map((c) => c.code?.code || "tax_per_unit"),
                            ) || [],
                        )
                        .filter(Boolean),
                    ),
                  ).map((taxCode) => (
                    <TableHead key={taxCode}>
                      {t(taxCode || "tax_per_unit")}
                    </TableHead>
                  ))}
                  <TableHead>{t("actions")}</TableHead>
                  <TableHead>{t("is_fully_dispensed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const productKnowledge =
                    field.productKnowledge as ProductKnowledgeBase;
                  const selectedInventory = productKnowledgeInventoriesMap[
                    productKnowledge.id
                  ]?.find(
                    (inv: InventoryRead) =>
                      inv.id === field.selectedInventoryId,
                  );
                  const prices = calculatePrices(selectedInventory);

                  // Get all possible tax codes for the current medication
                  const allTaxCodes = Array.from(
                    new Set(
                      medications
                        .flatMap(
                          (med) =>
                            med.inventory_items_internal?.flatMap((inventory) =>
                              inventory.product.charge_item_definition.price_components
                                .filter(
                                  (c: any) =>
                                    c.monetary_component_type ===
                                    MonetaryComponentType.tax,
                                )
                                .map((c) => c.code?.code || "tax_per_unit"),
                            ) || [],
                        )
                        .filter(Boolean),
                    ),
                  );

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Checkbox
                          checked={field.isSelected}
                          onCheckedChange={(checked) =>
                            update(index, {
                              ...field,
                              isSelected: !!checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>{productKnowledge.name}</TableCell>
                      <TableCell>
                        {productKnowledgeInventoriesMap[productKnowledge.id]
                          ?.length ? (
                          <Select
                            value={field.selectedInventoryId}
                            onValueChange={(value) =>
                              update(index, {
                                ...field,
                                selectedInventoryId: value,
                              })
                            }
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
                                <SelectItem key={inv.id} value={inv.id}>
                                  {"Lot #" + inv.product.batch?.lot_number}{" "}
                                  <Badge
                                    variant={
                                      inv.status === "active" &&
                                      inv.net_content > 0
                                        ? "primary"
                                        : "primary"
                                    }
                                  >
                                    {inv.net_content !== 0
                                      ? Math.abs(inv.net_content)
                                      : 150}{" "}
                                    {t("units")}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="destructive">{t("no_stock")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedInventory?.product.expiration_date
                          ? formatDate(
                              selectedInventory?.product.expiration_date,
                              "dd MMM yyyy",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={field.quantity}
                          onChange={(e) =>
                            update(index, {
                              ...field,
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={field.daysSupply}
                          onChange={(e) =>
                            update(index, {
                              ...field,
                              daysSupply: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <MonetaryDisplay amount={prices.basePrice} />
                      </TableCell>
                      <TableCell>
                        {selectedInventory
                          ? selectedInventory.product.charge_item_definition.price_components
                              .filter(
                                (c) =>
                                  c.monetary_component_type ===
                                  MonetaryComponentType.discount,
                              )
                              .map((component, index) => (
                                <div key={index}>
                                  {component.factor
                                    ? `${component.factor}%`
                                    : "-"}
                                </div>
                              ))
                          : "-"}
                      </TableCell>
                      {allTaxCodes.map((taxCode) => {
                        const taxComponent =
                          selectedInventory?.product.charge_item_definition.price_components.find(
                            (c: any) =>
                              c.monetary_component_type ===
                                MonetaryComponentType.tax &&
                              (c.code?.code || "tax_per_unit") === taxCode,
                          );
                        return (
                          <TableCell key={`${productKnowledge?.id}-${taxCode}`}>
                            {selectedInventory ? (
                              <div>
                                {taxComponent?.factor
                                  ? `${taxComponent.factor}%`
                                  : "-"}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleShowAlternatives(productKnowledge.id)
                          }
                        >
                          {t("alt")}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {field.medication ? (
                          <Checkbox
                            checked={field.isFullyDispensed}
                            onCheckedChange={(checked) =>
                              update(index, {
                                ...field,
                                isFullyDispensed: !!checked,
                              })
                            }
                          />
                        ) : (
                          "-"
                        )}
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
                                      quantity: 0,
                                      isSelected: true,
                                      daysSupply: 0,
                                      isFullyDispensed: false,
                                      selectedInventoryId: "",
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
          </div>
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
