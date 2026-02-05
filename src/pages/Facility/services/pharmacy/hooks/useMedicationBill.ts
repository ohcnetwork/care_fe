import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { useInventoryItemAutoSelect } from "@/pages/Facility/services/pharmacy/hooks/useInventoryItemAutoSelect";
import {
  MedicationBillField,
  medicationBillFormSchema,
  MedicationBillFormValues,
} from "@/pages/Facility/services/pharmacy/types";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

import batchApi from "@/types/base/batch/batchApi";
import {
  calculateTotalPriceWithQuantity,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  DispenseOrderBatchResponse,
  extractDispenseOrderFromBatchResponse,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import {
  MedicationDispenseCategory,
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  ACTIVE_MEDICATION_STATUSES,
  computeMedicationDispenseQuantity,
  MedicationRequestDispenseStatus,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import {
  PrescriptionRead,
  PrescriptionStatus,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { isGreaterThan, isZero, round, roundWhole } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import Decimal from "decimal.js";

export interface GroupedPrescription {
  [key: string]: {
    requests: MedicationRequestRead[];
    prescription?: PrescriptionRead;
  };
}

export interface UseMedicationBillOptions {
  patientId: string;
  /** If provided, fetch only medications from these prescriptions */
  prescriptionIds?: string[];
  /** Filter prescriptions created after this date (ISO string) */
  createdDateAfter?: string;
  /** Filter prescriptions created before this date (ISO string) */
  createdDateBefore?: string;
  /** Callback when dispense succeeds */
  onDispenseSuccess?: (dispenseOrderId: string | null) => void;
}

export interface UseMedicationBillResult {
  // Form
  form: ReturnType<typeof useForm<MedicationBillFormValues>>;
  fields: MedicationBillField[];
  append: ReturnType<
    typeof useFieldArray<MedicationBillFormValues, "items">
  >["append"];
  remove: ReturnType<
    typeof useFieldArray<MedicationBillFormValues, "items">
  >["remove"];

  // Data
  medications: MedicationRequestRead[];
  groupedMedications: GroupedPrescription;
  productKnowledgeInventoriesMap: Record<string, InventoryRead[] | undefined>;
  setProductKnowledgeInventoriesMap: React.Dispatch<
    React.SetStateAction<Record<string, InventoryRead[] | undefined>>
  >;
  prescriptions: PrescriptionRead[];
  patient: PrescriptionRead["encounter"]["patient"] | undefined;
  grandTotal: string;

  // State
  isLoading: boolean;
  isPending: boolean;
  isCreatingInvoice: boolean;
  prescriptionCompletionMap: Record<string, boolean>;
  setPrescriptionCompletionMap: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  alternateIdentifier: string;
  /** Set of product knowledge IDs with insufficient stock */
  insufficientProductKnowledgeIds: Set<string>;
  /** Whether inventory data is still loading */
  isInventoryLoading: boolean;

  // Actions
  handleDispense: () => void;
  handleRemoveMedication: (
    medication: MedicationRequestRead,
    isAdded: boolean,
    index: number,
  ) => void;
  calculatePrices: (inventory: InventoryRead | undefined) => {
    basePrice: string;
  };
  updateMedicationRequest: (
    medication: MedicationRequestRead,
    options?: {
      onSuccess?: () => void;
      onError?: (error: HTTPError) => void;
    },
  ) => void;

  // Context
  facilityId: string;
  locationId: string;
  encounterId: string | undefined;
}

export function useMedicationBill({
  patientId,
  prescriptionIds,
  createdDateAfter,
  createdDateBefore,
  onDispenseSuccess,
}: UseMedicationBillOptions): UseMedicationBillResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();
  const [{ encounterId }] = useQueryParams();

  const [productKnowledgeInventoriesMap, setProductKnowledgeInventoriesMap] =
    useState<Record<string, InventoryRead[] | undefined>>({});
  const [prescriptionCompletionMap, setPrescriptionCompletionMap] = useState<
    Record<string, boolean>
  >({});
  const [alternateIdentifier] = useState<string>(
    `${patientId}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  const dispenseOrderIdRef = useRef<string | null>(null);
  const hasAppliedAutoSelections = useRef(false);

  // Form setup
  const form = useForm<MedicationBillFormValues>({
    resolver: zodResolver(medicationBillFormSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Account query
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

  // Fetch active prescriptions within the date range
  const {
    data: prescriptionListResponse,
    isLoading: isPrescriptionListLoading,
  } = useQuery({
    queryKey: ["prescriptions", patientId, createdDateAfter, createdDateBefore],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        status: PrescriptionStatus.active,
        ...(createdDateAfter && { created_date_after: createdDateAfter }),
        ...(createdDateBefore && { created_date_before: createdDateBefore }),
      },
    }),
    enabled: prescriptionIds === undefined,
  });

  // Get prescription IDs to fetch (either single prescriptionId or all from list)
  const prescriptionIdsToFetch = useMemo(() => {
    return (
      prescriptionIds ||
      prescriptionListResponse?.results?.map((p) => p.id) ||
      []
    );
  }, [prescriptionIds, prescriptionListResponse?.results]);

  // Fetch full prescription details for each prescription ID using useQueries
  const { isLoading: isPrescriptionsLoading, data: prescriptions } = useQueries(
    {
      queries: prescriptionIdsToFetch.map((id) => ({
        queryKey: ["prescription", patientId, id],
        queryFn: query(prescriptionApi.get, { pathParams: { patientId, id } }),
      })),
      combine: (result) => {
        return {
          isLoading: result.some((q) => q.isFetching),
          data: result.map((q) => q.data).filter(Boolean) as PrescriptionRead[],
        };
      },
    },
  );

  const isLoading = isPrescriptionListLoading || isPrescriptionsLoading;

  // Medication updates
  const { mutate: updateMedicationRequest } = useMutation({
    mutationFn: (medication: MedicationRequestRead) => {
      return mutate(medicationRequestApi.update, {
        pathParams: { patientId, id: medication.id },
      })(medication);
    },
    onSuccess: () => {
      toast.success(t("medication_request_status_updated_successfully"));
    },
    onError: () => {
      toast.error(t("something_went_wrong"));
    },
  });

  // Compute medications list from all prescriptions
  const medications = useMemo(() => {
    return prescriptions.flatMap((p) =>
      p.medications.filter(
        (m) =>
          // TODO: filter cancelled medications?
          (ACTIVE_MEDICATION_STATUSES as readonly string[]).includes(
            m.status,
          ) &&
          m.dispense_status !== "complete" &&
          m.dispense_status !== "incomplete",
      ),
    );
  }, [prescriptions]);

  // Group medications by prescription
  const groupedMedications = useMemo((): GroupedPrescription => {
    return prescriptions.reduce((acc, prescription) => {
      const filteredMedications = prescription.medications.filter(
        (m) =>
          // TODO: filter cancelled medications?
          (ACTIVE_MEDICATION_STATUSES as readonly string[]).includes(
            m.status,
          ) &&
          m.dispense_status !== "complete" &&
          m.dispense_status !== "incomplete",
      );
      if (filteredMedications.length > 0) {
        acc[prescription.id] = {
          requests: filteredMedications,
          prescription,
        };
      }
      return acc;
    }, {} as GroupedPrescription);
  }, [prescriptions]);

  // Patient for header (from first prescription)
  const patient = prescriptions[0]?.encounter?.patient;

  // Watch form items for substitution changes
  const watchedItems = form.watch("items");

  // Create a stable key from substitution IDs to trigger recomputation
  const substitutionIdsKey = useMemo(() => {
    return (
      watchedItems
        ?.map((item) => item.substitution?.substitutedProductKnowledge?.id)
        .filter(Boolean)
        .join(",") || ""
    );
  }, [watchedItems]);

  // Compute requirements for inventory auto-selection (product knowledge ID -> required quantity)
  // Includes both original and substituted product knowledge IDs
  const inventoryRequirements = useMemo(() => {
    const requirements: Record<string, number> = {};

    // Add original product knowledge IDs from medications
    medications.forEach((medication) => {
      const productKnowledgeId = medication.requested_product?.id;
      if (productKnowledgeId) {
        const quantity = parseFloat(
          computeMedicationDispenseQuantity(medication),
        );
        requirements[productKnowledgeId] = Math.floor(quantity);
      }
    });

    // Add substituted product knowledge IDs from form state
    watchedItems?.forEach((item) => {
      const substitutedProductKnowledgeId =
        item.substitution?.substitutedProductKnowledge?.id;
      if (
        substitutedProductKnowledgeId &&
        !requirements[substitutedProductKnowledgeId]
      ) {
        // Use the medication's quantity for the substituted product
        const medication = item.medication as MedicationRequestRead | undefined;
        const quantity = medication
          ? parseFloat(computeMedicationDispenseQuantity(medication))
          : 1;
        requirements[substitutedProductKnowledgeId] = Math.floor(quantity);
      }
    });

    return requirements;
  }, [medications, watchedItems, substitutionIdsKey]);

  // Callback for updating inventory map from auto-select hook
  const handleInventoriesFetched = useCallback(
    (map: Record<string, InventoryRead[]>) => {
      setProductKnowledgeInventoriesMap((prev) => ({
        ...prev,
        ...map,
      }));
    },
    [],
  );

  // Auto-select inventory items using FEFO algorithm
  const {
    isLoading: isInventoryLoading,
    selections: autoSelections,
    insufficientProductKnowledgeIds,
  } = useInventoryItemAutoSelect({
    facilityId,
    locationId,
    requirements: inventoryRequirements,
    includeChildren: true,
    onInventoriesFetched: handleInventoriesFetched,
  });

  // Calculate grand total
  const formValues = form.watch();
  const grandTotal = useMemo(() => {
    let total = new Decimal(0);
    const watchedItems = formValues.items || [];

    watchedItems?.forEach((item) => {
      if (!item.isSelected) return;

      const productKnowledge = item.productKnowledge as ProductKnowledgeBase;
      const effectiveProductKnowledge =
        item.substitution?.substitutedProductKnowledge || productKnowledge;

      const inventoryList =
        productKnowledgeInventoriesMap[effectiveProductKnowledge?.id] || [];

      item.lots.forEach((lot) => {
        if (!lot.selectedInventoryId || !lot.quantity) return;

        const inventory = inventoryList.find(
          (inv) => inv.id === lot.selectedInventoryId,
        );

        if (inventory?.product.charge_item_definition?.price_components) {
          const itemTotal = calculateTotalPriceWithQuantity(
            inventory.product.charge_item_definition.price_components,
            lot.quantity,
          );
          total = total.plus(itemTotal);
        }
      });
    });

    return round(total);
  }, [formValues, productKnowledgeInventoriesMap]);

  // Initialize form items when data loads
  useEffect(() => {
    form.reset({ items: [] });
    hasAppliedAutoSelections.current = false;

    // Initialize prescription completion map
    const newPrescriptionCompletionMap: Record<string, boolean> = {};
    Object.keys(groupedMedications).forEach((pId) => {
      if (pId !== "no-prescription") {
        newPrescriptionCompletionMap[pId] = true;
      }
    });
    setPrescriptionCompletionMap(newPrescriptionCompletionMap);

    // Add medications to form with empty lots (will be filled by auto-select effect)
    medications.forEach((medication) => {
      append({
        reference_id: crypto.randomUUID(),
        productKnowledge: medication.requested_product,
        medication,
        isSelected: true,
        fully_dispensed: true,
        dosageInstructions: medication.dosage_instruction,
        lots: [
          {
            selectedInventoryId:
              (medication.inventory_items_internal?.[0]?.id as string) || "",
            quantity: computeMedicationDispenseQuantity(medication),
          },
        ],
        prescriptionId: medication.prescription?.id,
      });
    });
  }, [medications.length, append, form, groupedMedications]);

  // Apply auto-selections to form once (on initial load only)
  useEffect(() => {
    if (
      hasAppliedAutoSelections.current ||
      isInventoryLoading ||
      Object.keys(autoSelections).length === 0 ||
      fields.length === 0
    ) {
      return;
    }

    fields.forEach((field, index) => {
      const productKnowledgeId = (
        field.productKnowledge as ProductKnowledgeBase
      )?.id;
      if (!productKnowledgeId) return;

      const selections = autoSelections[productKnowledgeId];
      if (!selections?.length) return;

      // Only apply if no inventory is currently selected
      const currentLots = form.getValues(`items.${index}.lots`);
      if (currentLots.some((lot) => lot.selectedInventoryId)) return;

      // Apply auto-selections as lots
      form.setValue(
        `items.${index}.lots`,
        selections.map((sel) => ({
          selectedInventoryId: sel.inventoryId,
          quantity: sel.quantity,
        })),
      );
    });

    hasAppliedAutoSelections.current = true;
  }, [isInventoryLoading, autoSelections, fields, form]);

  // Invoice creation mutation
  const { mutate: createInvoice, isPending: isCreatingInvoice } = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(t("invoice_created_successfully"));
      onDispenseSuccess?.(dispenseOrderIdRef.current);
    },
    onError: (error) => {
      toast.error(error.message || t("failed_to_create_invoice"));
      onDispenseSuccess?.(dispenseOrderIdRef.current);
    },
  });

  // Dispense mutation
  const { mutate: dispense, isPending } = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
    onSuccess: (response: unknown) => {
      toast.success(t("medications_billed_and_prescriptions_completed"));

      // Invalidate prescription queries
      queryClient.invalidateQueries({
        queryKey: ["prescriptions", patientId],
      });
      prescriptionIdsToFetch.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["prescription", patientId, id],
        });
      });

      let newDispenseOrderId: string | null = null;

      const dispenseOrder = extractDispenseOrderFromBatchResponse(
        response as DispenseOrderBatchResponse,
      );

      if (dispenseOrder) {
        newDispenseOrderId = dispenseOrder.id;
        dispenseOrderIdRef.current = newDispenseOrderId;
      }

      if (!account?.results[0]) {
        queryClient.invalidateQueries({
          queryKey: ["accounts", patientId],
        });
      }

      // Extract charge items and create invoice
      const chargeItems = extractChargeItemsFromBatchResponse(
        response as unknown as ChargeItemBatchResponse,
      );

      if (chargeItems.length === 0) {
        onDispenseSuccess?.(newDispenseOrderId);
      } else if (account?.results[0]) {
        createInvoice({
          status: InvoiceStatus.draft,
          account: account.results[0].id,
          charge_items: chargeItems.map((item) => item.id),
        });
      } else {
        onDispenseSuccess?.(newDispenseOrderId);
      }
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
              result?.data?.errors?.map((err) => err.msg) ||
              (result?.data?.detail ? [result.data.detail] : []),
          )
          .filter(Boolean);

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
    if (!inventory) return { basePrice: "0" };

    const priceComponents =
      inventory.product.charge_item_definition?.price_components;
    const baseComponent = priceComponents?.find(
      (component) =>
        component.monetary_component_type === MonetaryComponentType.base,
    );
    return { basePrice: baseComponent?.amount || "0" };
  };

  const handleDispense = () => {
    const selectedItems = form
      .getValues("items")
      .filter((item) => item.isSelected);

    // Validate zero quantities
    const medsWithZeroQuantity = selectedItems.filter((item) =>
      item.lots.every(
        (lot) =>
          !lot.quantity ||
          isZero(lot.quantity) ||
          !lot.selectedInventoryId ||
          !lot.selectedInventoryId.length,
      ),
    );

    if (medsWithZeroQuantity.length > 0) {
      toast.error(
        t("please_select_quantity_for_medications", {
          medications: medsWithZeroQuantity
            .map(
              (item) =>
                item.substitution?.substitutedProductKnowledge?.name ||
                (item.productKnowledge as ProductKnowledgeBase)?.name ||
                (item.medication as MedicationRequestRead)?.medication
                  ?.display ||
                "Unknown",
            )
            .join(", "),
        }),
      );
      return;
    }

    // Validate inventory selection
    const medsWithoutInventory = selectedItems.filter(
      (item) => !item.lots.some((lot) => lot.selectedInventoryId),
    );

    if (medsWithoutInventory.length > 0) {
      toast.error(
        t("please_select_inventory_for_medications", {
          medications: medsWithoutInventory
            .map(
              (item) =>
                item.substitution?.substitutedProductKnowledge?.name ||
                (item.productKnowledge as ProductKnowledgeBase)?.name ||
                (item.medication as MedicationRequestRead)?.medication
                  ?.display ||
                "Unknown",
            )
            .join(", "),
        }),
      );
      return;
    }

    // Validate stock availability
    const medsWithInsufficientStock: {
      name: string;
      lot: string;
      requested: string;
      available: string;
    }[] = [];

    selectedItems.forEach((item) => {
      const productKnowledge = item.productKnowledge as ProductKnowledgeBase;
      const effectiveProductKnowledge =
        item.substitution?.substitutedProductKnowledge || productKnowledge;
      if (!effectiveProductKnowledge) return;

      const inventoryList =
        productKnowledgeInventoriesMap[effectiveProductKnowledge.id] || [];

      item.lots.forEach((lot) => {
        const inventory = inventoryList.find(
          (inv) => inv.id === lot.selectedInventoryId,
        );
        if (inventory && isGreaterThan(lot.quantity, inventory.net_content)) {
          medsWithInsufficientStock.push({
            name: effectiveProductKnowledge.name,
            lot: inventory.product.batch?.lot_number || "N/A",
            requested: lot.quantity,
            available: roundWhole(inventory.net_content),
          });
        }
      });
    });

    if (medsWithInsufficientStock.length > 0) {
      medsWithInsufficientStock.forEach((med) => {
        toast.error(
          t("quantity_for_medication_selected_exceeds_available_stock", {
            medication: med.name,
            lot: med.lot,
            requested: med.requested,
            available: med.available,
          }),
        );
      });
      return;
    }

    // Build dispense requests
    const requests: {
      url: string;
      method: string;
      reference_id: string;
      body: unknown;
    }[] = [];
    const defaultEncounterId = prescriptions[0]?.encounter?.id ?? encounterId;

    selectedItems.forEach((item) => {
      const medication = item.medication as MedicationRequestRead | undefined;
      const productKnowledge = item.productKnowledge as ProductKnowledgeBase;
      const effectiveProductKnowledge =
        item.substitution?.substitutedProductKnowledge || productKnowledge;

      item.lots.forEach((lot) => {
        if (!lot.selectedInventoryId) return;

        const inventoryListForEffectiveProduct =
          productKnowledgeInventoriesMap[effectiveProductKnowledge.id];
        const selectedInventory = inventoryListForEffectiveProduct?.find(
          (inv: InventoryRead) => inv.id === lot.selectedInventoryId,
        );

        if (!selectedInventory) {
          toast.error(
            `Inventory for ${effectiveProductKnowledge.name} (Lot ID: ${lot.selectedInventoryId || "None"}) not found.`,
          );
          return;
        }

        const dispenseData: MedicationDispenseCreate = {
          status: MedicationDispenseStatus.preparation,
          category: MedicationDispenseCategory.outpatient,
          when_prepared: new Date(),
          dosage_instruction: item.dosageInstructions ?? [],
          encounter:
            medication?.encounter ?? defaultEncounterId! ?? encounterId,
          location: locationId,
          authorizing_request: medication?.id ?? null,
          item: selectedInventory.id,
          quantity: lot.quantity,
          fully_dispensed: item.fully_dispensed,
          create_dispense_order: {
            alternate_identifier: alternateIdentifier,
          },
        };

        if (
          item.substitution &&
          item.substitution.substitutedProductKnowledge
        ) {
          dispenseData.substitution = {
            was_substituted: true,
            substitution_type: item.substitution.type,
            reason: item.substitution.reason,
          };
        }

        requests.push({
          url: `/api/v1/medication/dispense/`,
          method: "POST",
          reference_id: `dispense_${item.reference_id}_lot_${lot.selectedInventoryId}`,
          body: dispenseData,
        });
      });
    });

    // Add prescription completion requests
    const prescriptionIds = new Set(
      selectedItems
        .filter(
          (item) =>
            (item.medication as MedicationRequestRead)?.prescription?.id &&
            item.prescriptionId !== "no-prescription" &&
            prescriptionCompletionMap[item.prescriptionId || ""],
        )
        .map(
          (item) => (item.medication as MedicationRequestRead).prescription!.id,
        ),
    );

    if (prescriptionIds.size > 0) {
      requests.push({
        url: `/api/v1/patient/${patientId}/medication/prescription/upsert/`,
        method: "POST",
        reference_id: "prescription_completion_upsert",
        body: {
          datapoints: Array.from(prescriptionIds).map((id) => ({
            id,
            status: PrescriptionStatus.completed,
          })),
        },
      });
    }

    dispense({ requests });
  };

  const handleRemoveMedication = (
    medication: MedicationRequestRead,
    isAdded: boolean,
    index: number,
  ) => {
    if (!isAdded) {
      updateMedicationRequest(
        {
          ...medication,
          dispense_status: MedicationRequestDispenseStatus.incomplete,
        },
        {
          onSuccess: () => {
            remove(index);
          },
        },
      );
    } else {
      remove(index);
    }
  };

  return {
    form,
    fields: fields as MedicationBillField[],
    append,
    remove,
    medications,
    groupedMedications,
    productKnowledgeInventoriesMap,
    setProductKnowledgeInventoriesMap,
    prescriptions,
    patient,
    grandTotal,
    isLoading,
    isPending,
    isCreatingInvoice,
    prescriptionCompletionMap,
    setPrescriptionCompletionMap,
    alternateIdentifier,
    insufficientProductKnowledgeIds,
    isInventoryLoading,
    handleDispense,
    handleRemoveMedication,
    calculatePrices,
    updateMedicationRequest,
    facilityId,
    locationId,
    encounterId: encounterId as string | undefined,
  };
}
