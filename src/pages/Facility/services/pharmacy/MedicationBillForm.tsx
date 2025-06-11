import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { ChevronDownIcon, Info, PlusIcon } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
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
import { SubstitutionSheet } from "@/components/Medication/SubstitutionSheet";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import { formatDoseRange } from "@/components/Medicine/utils";
import { reverseFrequencyOption } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { PatientHeader } from "@/pages/Facility/services/serviceRequests/components/PatientHeader";
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
  SubstitutionReason,
  SubstitutionType,
  getSubstitutionReasonDescription,
  getSubstitutionReasonDisplay,
  getSubstitutionTypeDescription,
  getSubstitutionTypeDisplay,
} from "@/types/emr/medicationDispense/medicationDispense";
import {
  DoseRange,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestDispenseStatus,
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
      substitution: z
        .object({
          substitutedProductKnowledge: z.any(), // ProductKnowledgeBase of the substitute
          type: z.nativeEnum(SubstitutionType),
          reason: z.nativeEnum(SubstitutionReason),
        })
        .optional(),
    }),
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMedicationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct?: ProductKnowledgeBase;
  onAdd: (
    product: ProductKnowledgeBase,
    dosageInstructions: MedicationRequestDosageInstruction[],
  ) => void;
  existingDosageInstructions?: MedicationRequestDosageInstruction;
  isEditing: boolean;
  onChange?: (dosageInstructions: MedicationRequestDosageInstruction[]) => void;
}

const AddMedicationSheet = ({
  open,
  onOpenChange,
  selectedProduct,
  onAdd,
  existingDosageInstructions,
  isEditing,
  onChange,
}: AddMedicationSheetProps) => {
  const { t } = useTranslation();
  const [localDosageInstruction, setLocalDosageInstruction] =
    useState<MedicationRequestDosageInstruction>({
      dose_and_rate: undefined,
      timing: undefined,
      as_needed_boolean: false,
      route: undefined,
      site: undefined,
      method: undefined,
      additional_instruction: undefined,
      as_needed_for: undefined,
    });
  const [showDosageDialog, setShowDosageDialog] = useState(false);

  // Update local state when the sheet opens or when editing a different item
  useEffect(() => {
    if (open && existingDosageInstructions) {
      setLocalDosageInstruction(existingDosageInstructions);
    } else if (!open) {
      resetForm();
    }
  }, [open, existingDosageInstructions]);

  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    setLocalDosageInstruction((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetForm = () => {
    setLocalDosageInstruction({
      dose_and_rate: undefined,
      timing: undefined,
      as_needed_boolean: false,
      route: undefined,
      site: undefined,
      method: undefined,
      additional_instruction: undefined,
      as_needed_for: undefined,
    });
    setShowDosageDialog(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    if (isEditing) {
      onChange?.([localDosageInstruction]);
    } else {
      if (selectedProduct) {
        onAdd(selectedProduct, [localDosageInstruction]);
      }
    }
    onOpenChange(false);
    resetForm();
  };

  // Helper functions for additional instructions
  const currentInstructions =
    localDosageInstruction?.additional_instruction || [];

  const addInstruction = (instruction: Code) => {
    const currentInstructions =
      localDosageInstruction?.additional_instruction || [];
    if (!currentInstructions.some((inst) => inst.code === instruction.code)) {
      handleUpdateDosageInstruction({
        additional_instruction: [...currentInstructions, instruction],
      });
    }
  };

  const removeInstruction = (code: string) => {
    const currentInstructions =
      localDosageInstruction?.additional_instruction || [];
    handleUpdateDosageInstruction({
      additional_instruction: currentInstructions.filter(
        (inst) => inst.code !== code,
      ),
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] min-h-[50vh] px-4 pt-2 pb-0 rounded-t-lg overflow-y-auto pb-safe"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
        <div className="mt-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 px-20">
            <SheetHeader>
              <SheetTitle>
                {isEditing
                  ? t("edit_dosage_instructions")
                  : t("add_medication")}
              </SheetTitle>
            </SheetHeader>
          </div>
          <div className="flex-1 px-20">
            <div className="space-y-6">
              {selectedProduct && (
                <>
                  <div>
                    <Label className="text-sm text-gray-500 mb-1.5 block">
                      {t("selected")} {t("product")}
                    </Label>
                    <div className="font-medium text-lg">
                      {selectedProduct.name}
                    </div>
                  </div>
                  <div className="space-y-4 pb-4">
                    {/* Dosage and Frequency Row */}
                    <div className="grid grid-cols-2 gap-4">
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
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <ComboboxQuantityInput
                                    data-cy="dosage-input"
                                    quantity={
                                      localDosageInstruction?.dose_and_rate
                                        ?.dose_quantity
                                    }
                                    onChange={(value) => {
                                      if (!value?.value || !value.unit) return;
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 rounded-full hover:bg-transparent"
                                  onClick={() => setShowDosageDialog(true)}
                                >
                                  +
                                </Button>
                              </div>
                            </>
                          )}
                        </div>

                        {localDosageInstruction?.dose_and_rate?.dose_range && (
                          <Popover
                            open={showDosageDialog}
                            onOpenChange={setShowDosageDialog}
                          >
                            <PopoverTrigger asChild>
                              <div className="w-full" />
                            </PopoverTrigger>
                            <PopoverContent className="w-55 p-4" align="start">
                              <DosageDialog
                                dosageRange={
                                  localDosageInstruction.dose_and_rate
                                    .dose_range
                                }
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
                              : reverseFrequencyOption(
                                  localDosageInstruction?.timing,
                                )
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
                          <SelectTrigger
                            data-cy="frequency"
                            className={cn("h-9 text-sm")}
                          >
                            <SelectValue placeholder={t("select_frequency")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRN">
                              {t("as_needed_prn")}
                            </SelectItem>
                            {Object.entries(
                              MEDICATION_REQUEST_TIMING_OPTIONS,
                            ).map(([key, option]) => (
                              <SelectItem key={key} value={key}>
                                {option.display}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Duration and Method Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Duration */}
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          {t("duration")}
                        </Label>
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
                                localDosageInstruction.timing.repeat
                                  .bounds_duration?.value == 0
                                  ? ""
                                  : localDosageInstruction.timing.repeat
                                      .bounds_duration?.value
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
                                        unit: localDosageInstruction.timing
                                          .repeat.bounds_duration.unit,
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
                              localDosageInstruction?.timing?.repeat
                                ?.bounds_duration?.unit ?? UCUM_TIME_UNITS[0]
                            }
                            onValueChange={(
                              unit: (typeof UCUM_TIME_UNITS)[number],
                            ) => {
                              if (localDosageInstruction?.timing?.repeat) {
                                const value =
                                  localDosageInstruction?.timing?.repeat
                                    ?.bounds_duration?.value ?? 0;
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

                      {/* Method */}
                      <div data-cy="method">
                        <Label className="mb-1.5 block text-sm">
                          {t("method")}
                        </Label>
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
                    </div>

                    {/* Instructions */}
                    <div data-cy="instructions">
                      <Label className="mb-1.5 block text-sm">
                        {t("instructions")}
                      </Label>
                      {localDosageInstruction?.as_needed_boolean ? (
                        <div className="space-y-2">
                          <ValueSetSelect
                            system="system-as-needed-reason"
                            value={
                              localDosageInstruction?.as_needed_for || null
                            }
                            placeholder={t("select_prn_reason")}
                            onSelect={(value) => {
                              handleUpdateDosageInstruction({
                                as_needed_for: value || undefined,
                              });
                            }}
                            asSheet
                          />

                          <InstructionsPopover
                            currentInstructions={currentInstructions}
                            removeInstruction={removeInstruction}
                            addInstruction={addInstruction}
                            isReadOnly={false}
                            disabled={false}
                          />
                        </div>
                      ) : (
                        <InstructionsPopover
                          currentInstructions={currentInstructions}
                          removeInstruction={removeInstruction}
                          addInstruction={addInstruction}
                          isReadOnly={false}
                          disabled={false}
                        />
                      )}
                    </div>

                    {/* Route and Site Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Route */}
                      <div data-cy="route">
                        <Label className="mb-1.5 block text-sm">
                          {t("route")}
                        </Label>
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
                        <Label className="mb-1.5 block text-sm">
                          {t("site")}
                        </Label>
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
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="sticky bottom-0 py-4 bg-white border-t flex justify-end px-20">
            <Button
              className="mr-1"
              disabled={
                !selectedProduct ||
                !localDosageInstruction?.dose_and_rate ||
                (!localDosageInstruction.as_needed_boolean &&
                  !localDosageInstruction.timing)
              }
              onClick={handleSave}
            >
              {isEditing ? t("save") : t("add_medication")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

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
  const [selectedProduct, setSelectedProduct] = useState<
    ProductKnowledgeBase | undefined
  >();
  const [isAddMedicationSheetOpen, setIsAddMedicationSheetOpen] =
    useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isSubstitutionSheetOpen, setIsSubstitutionSheetOpen] = useState(false);
  const [substitutingItemIndex, setSubstitutingItemIndex] = useState<
    number | null
  >(null);
  const [originalProductForSubstitution, setOriginalProductForSubstitution] =
    useState<ProductKnowledgeBase | undefined>();

  const tableHeaderClass =
    "px-4 py-3 border-r font-medium border-y-1 border-r-none border-gray-200 rounded-b-none border-b-0";
  const tableCellClass = "px-4 py-4 border-r";

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
          exclude_dispense_status: "complete",
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

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: {
        id: patientId,
      },
    }),
    enabled: !!patientId,
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
            net_content_gt: 0,
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
    form.reset({ items: [] }); // Reset form with empty items array
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
      return item.lots.every(
        (lot) =>
          lot.quantity === 0 ||
          !lot.selectedInventoryId ||
          !lot.selectedInventoryId.length,
      );
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
      return !item.lots.some((lot) => lot.selectedInventoryId);
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
      const effectiveProductKnowledge =
        item.substitution?.substitutedProductKnowledge || productKnowledge;

      item.lots.forEach((lot) => {
        if (!lot.selectedInventoryId) {
          return;
        }

        const inventoryListForEffectiveProduct =
          productKnowledgeInventoriesMap[effectiveProductKnowledge.id];

        const selectedInventory = inventoryListForEffectiveProduct?.find(
          (inv: InventoryRead) => inv.id === lot.selectedInventoryId,
        );

        if (!selectedInventory) {
          toast.error(
            `Inventory for ${effectiveProductKnowledge.name} (Lot ID: ${lot.selectedInventoryId || "None"}) not found in local map. Cannot dispense this lot.`,
          );
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

  return (
    <Page title={t("bill_medications")} hideTitleOnPage={true} isInsidePage>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold whitespace-nowrap">
            {t("bill_medications")}
          </h1>
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

        {patient && (
          <div className="mb-4 p-4 rounded-none shadow-none bg-gray-100">
            <PatientHeader patient={patient} facilityId={facilityId} />
          </div>
        )}

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : (
          <Form {...form}>
            <form>
              <Table className="w-full border-separate border-spacing-y-2 px-1">
                <TableHeader>
                  <TableRow className="bg-white rounded-lg shadow-sm rounded-b-none">
                    <TableHead
                      className={cn(
                        "w-12",
                        tableHeaderClass,
                        "rounded-l-lg border-y-1 border-l-1 border-gray-200 rounded-b-none border-b-0",
                      )}
                    >
                      <FormField
                        control={form.control}
                        name="items"
                        render={() => (
                          <FormItem className="mr-1.5">
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
                    <TableHead
                      className={cn(
                        tableHeaderClass,
                        "border-y-1 border-r-none border-gray-200 rounded-b-none border-b-0",
                      )}
                    >
                      {t("medicine")}
                    </TableHead>
                    <TableHead className={tableHeaderClass}>
                      {t("select_lot")}
                    </TableHead>
                    <TableHead className={tableHeaderClass}>
                      {t("quantity")}
                    </TableHead>
                    <TableHead className={cn(tableHeaderClass)}>
                      {t("days_supply")}
                    </TableHead>
                    <TableHead className={tableHeaderClass}>
                      {t("expiry")}
                    </TableHead>
                    <TableHead className={tableHeaderClass}>
                      {t("unit_price")}
                    </TableHead>
                    <TableHead className={tableHeaderClass}>
                      {t("discount")}
                    </TableHead>
                    <TableHead className={cn(tableHeaderClass, "rounded-r-lg")}>
                      {t("all_dispensed")}?
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const productKnowledge =
                      field.productKnowledge as ProductKnowledgeBase;
                    const substitution = form.watch(
                      `items.${index}.substitution`,
                    );
                    const effectiveProductKnowledge =
                      substitution?.substitutedProductKnowledge ||
                      productKnowledge;

                    return (
                      <TableRow
                        key={field.id}
                        className="bg-white hover:bg-gray-50/50 shadow-sm rounded-lg"
                      >
                        <TableCell
                          className={cn(tableCellClass, "rounded-l-lg")}
                        >
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
                        <TableCell className={tableCellClass}>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-medium text-gray-950 text-base flex items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    {effectiveProductKnowledge.name}
                                    {substitution && (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-6 w-6 rounded-full hover:bg-blue-100"
                                          >
                                            <Info className="h-4 w-4" />
                                            <span className="sr-only">
                                              {t("substitution_details")}
                                            </span>
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="p-4 w-auto"
                                          align="start"
                                          side="bottom"
                                        >
                                          <div className="space-y-3">
                                            <div className="font-semibold text-sm text-gray-950 underline">
                                              {t("substitution_details")} :
                                            </div>
                                            <div className="space-y-3 text-sm max-w-md">
                                              <div>
                                                <div className="flex items-center gap-1 mb-1">
                                                  <span className="font-medium text-gray-600">
                                                    {t("original_medication")}:
                                                  </span>
                                                  <div className="text-gray-950 font-medium">
                                                    {productKnowledge.name}
                                                  </div>
                                                </div>
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-1 mb-1">
                                                  <span className="font-medium text-gray-600">
                                                    {t("substituted_with")}:
                                                  </span>
                                                  <div className="text-gray-950 font-medium">
                                                    {
                                                      effectiveProductKnowledge.name
                                                    }
                                                  </div>
                                                </div>
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-1">
                                                  <span className="font-medium text-gray-600">
                                                    {t("substitution_type")}:
                                                  </span>
                                                  <div className="text-gray-950 font-medium">
                                                    {getSubstitutionTypeDisplay(
                                                      t,
                                                      substitution.type,
                                                    )}{" "}
                                                    ({substitution.type})
                                                  </div>
                                                </div>
                                                <div className="text-gray-700 text-xs italic leading-relaxed">
                                                  {getSubstitutionTypeDescription(
                                                    t,
                                                    substitution.type,
                                                  )}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="flex items-center gap-1">
                                                  <span className="font-medium text-gray-600">
                                                    {t("substitution_reason")}:
                                                  </span>
                                                  <div className="text-gray-950 font-medium">
                                                    {getSubstitutionReasonDisplay(
                                                      t,
                                                      substitution.reason,
                                                    )}{" "}
                                                    ({substitution.reason})
                                                  </div>
                                                </div>
                                                <div className="text-gray-700 text-xs italic leading-relaxed">
                                                  {getSubstitutionReasonDescription(
                                                    t,
                                                    substitution.reason,
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    )}
                                    {substitution && (
                                      <Badge
                                        variant="outline"
                                        className="border-orange-300 text-orange-800 bg-orange-100 text-xs -ml-1"
                                      >
                                        {t("substituted")}
                                      </Badge>
                                    )}
                                    {field.medication?.dispense_status ===
                                      MedicationRequestDispenseStatus.partial && (
                                      <Badge
                                        variant="outline"
                                        className="border-yellow-300 text-yellow-800 bg-yellow-100 text-xs"
                                      >
                                        {t("partially_dispensed")}
                                      </Badge>
                                    )}
                                  </div>
                                  {substitution && (
                                    <div className="text-gray-500 font-normal italic line-through text-sm">
                                      {productKnowledge.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {field.medication ? (
                                <div className="text-sm text-gray-700 font-medium flex items-center gap-1">
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
                                    field.dosageInstructions?.[0]?.timing
                                      ?.repeat?.bounds_duration?.unit
                                  }{" "}
                                  ={" "}
                                  <div className="text-gray-700 font-semibold text-sm">
                                    {(() => {
                                      const dosage =
                                        field.dosageInstructions?.[0]
                                          ?.dose_and_rate?.dose_quantity
                                          ?.value || 0;
                                      const duration =
                                        field.dosageInstructions?.[0]?.timing
                                          ?.repeat?.bounds_duration?.value || 0;
                                      const frequency =
                                        field.dosageInstructions?.[0]?.timing
                                          ?.code?.code || "";

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
                                </div>
                              ) : (
                                <div
                                  className="text-sm text-gray-500 cursor-pointer hover:text-gray-900"
                                  onClick={() => {
                                    setSelectedProduct(productKnowledge);
                                    setEditingItemIndex(index);
                                    setIsAddMedicationSheetOpen(true);
                                  }}
                                >
                                  {(() => {
                                    const currentDosageInstructions =
                                      form.watch(
                                        `items.${index}.dosageInstructions`,
                                      )?.[0];

                                    if (
                                      currentDosageInstructions?.dose_and_rate
                                        ?.dose_quantity
                                    ) {
                                      return (
                                        <div>
                                          {
                                            currentDosageInstructions
                                              .dose_and_rate.dose_quantity.value
                                          }{" "}
                                          {
                                            currentDosageInstructions
                                              .dose_and_rate.dose_quantity.unit
                                              ?.display
                                          }{" "}
                                          ×{" "}
                                          {
                                            currentDosageInstructions.timing
                                              ?.code?.code
                                          }{" "}
                                          ×{" "}
                                          {currentDosageInstructions.timing
                                            ?.repeat?.bounds_duration?.value ||
                                            0}
                                          {
                                            currentDosageInstructions.timing
                                              ?.repeat?.bounds_duration?.unit
                                          }{" "}
                                          ={" "}
                                          {(() => {
                                            const dosage =
                                              currentDosageInstructions
                                                .dose_and_rate.dose_quantity
                                                .value || 0;
                                            const duration =
                                              currentDosageInstructions.timing
                                                ?.repeat?.bounds_duration
                                                ?.value || 0;
                                            const frequency =
                                              currentDosageInstructions.timing
                                                ?.code?.code || "";

                                            let dosesPerDay = 1;
                                            if (frequency.includes("BID"))
                                              dosesPerDay = 2;
                                            if (frequency.includes("TID"))
                                              dosesPerDay = 3;
                                            if (frequency.includes("QID"))
                                              dosesPerDay = 4;

                                            return (
                                              dosage * dosesPerDay * duration
                                            );
                                          })()}{" "}
                                          {t("units")}
                                        </div>
                                      );
                                    }

                                    return t(
                                      "click_to_add_dosage_instructions",
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            {field.medication && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-400 border text-gray-950"
                                type="button"
                                onClick={() => {
                                  setSubstitutingItemIndex(index);
                                  setOriginalProductForSubstitution(
                                    productKnowledge,
                                  );
                                  setIsSubstitutionSheetOpen(true);
                                }}
                              >
                                {t("substitute")}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={tableCellClass}>
                          {productKnowledgeInventoriesMap[
                            effectiveProductKnowledge.id
                          ]?.length ? (
                            <div className="space-y-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-auto min-w-40 justify-between h-auto min-h-[40px] p-2 border-gray-300 border"
                                    type="button"
                                  >
                                    <div className="flex flex-col items-start gap-1 w-full">
                                      {(() => {
                                        const selectedLots = form
                                          .watch(`items.${index}.lots`)
                                          .filter(
                                            (lot) => lot.selectedInventoryId,
                                          );

                                        if (selectedLots.length === 0) {
                                          return (
                                            <span className="text-gray-500">
                                              {t("select_stock")}
                                            </span>
                                          );
                                        }

                                        return selectedLots.map((lot) => {
                                          const selectedInventory =
                                            productKnowledgeInventoriesMap[
                                              effectiveProductKnowledge.id
                                            ]?.find(
                                              (inv) =>
                                                inv.id ===
                                                lot.selectedInventoryId,
                                            );

                                          return (
                                            <div
                                              key={lot.selectedInventoryId}
                                              className="flex items-center gap-2 w-full bg-gray-50 px-2 border-gray-200 border-1 text-gray-950"
                                            >
                                              <span className="font-medium text-sm">
                                                {"Lot #" +
                                                  selectedInventory?.product
                                                    .batch?.lot_number}
                                              </span>
                                              <Badge
                                                className={cn(
                                                  "text-sm font-medium my-0.5",
                                                  selectedInventory?.status ===
                                                    "active" &&
                                                    selectedInventory?.net_content >
                                                      0
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800",
                                                )}
                                                variant="outline"
                                              >
                                                {selectedInventory?.net_content}{" "}
                                                {t("units")}
                                              </Badge>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <div className="max-h-60 overflow-auto">
                                    {productKnowledgeInventoriesMap[
                                      effectiveProductKnowledge.id
                                    ]?.length ? (
                                      productKnowledgeInventoriesMap[
                                        effectiveProductKnowledge.id
                                      ]?.map((inv) => {
                                        const currentLots = form.watch(
                                          `items.${index}.lots`,
                                        );
                                        const isSelected = currentLots.some(
                                          (lot) =>
                                            lot.selectedInventoryId === inv.id,
                                        );

                                        return (
                                          <div
                                            key={inv.id}
                                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-accent"
                                            onClick={() => {
                                              const lots = form.getValues(
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
                                                const medication =
                                                  form.getValues(
                                                    `items.${index}.medication`,
                                                  );
                                                const initialQuantity =
                                                  medication
                                                    ? computeInitialQuantity(
                                                        medication,
                                                      )
                                                    : 0;

                                                form.setValue(
                                                  `items.${index}.lots`,
                                                  [
                                                    ...lots,
                                                    {
                                                      selectedInventoryId:
                                                        inv.id,
                                                      quantity: initialQuantity,
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
                                                {"Lot #" +
                                                  inv.product.batch?.lot_number}
                                              </span>
                                              <Badge
                                                className={cn(
                                                  "ml-2",
                                                  inv.status === "active" &&
                                                    inv.net_content > 0
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800",
                                                )}
                                                variant="outline"
                                              >
                                                {inv.net_content} {t("units")}
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
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800"
                            >
                              {t("no_stock")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={tableCellClass}>
                          <div className="space-y-2">
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
                                              className="border-gray-300 border rounded-none w-24"
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
                          </div>
                        </TableCell>
                        <TableCell className={tableCellClass}>
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
                                    className="border-gray-300 border rounded-none w-24"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className={tableCellClass}>
                          {form
                            .watch(`items.${index}.lots`)
                            .filter((lot) => lot.selectedInventoryId)
                            .map((lot) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  effectiveProductKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );

                              return (
                                <div
                                  key={lot.selectedInventoryId}
                                  className="py-2.5 text-gray-950 font-normal text-base"
                                >
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
                          {form
                            .watch(`items.${index}.lots`)
                            .filter((lot) => lot.selectedInventoryId).length ===
                            0 && (
                            <div className="text-sm text-gray-500 py-2">-</div>
                          )}
                        </TableCell>
                        <TableCell className={tableCellClass}>
                          {form
                            .watch(`items.${index}.lots`)
                            .filter((lot) => lot.selectedInventoryId)
                            .map((lot) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  effectiveProductKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );
                              const prices = calculatePrices(selectedInventory);

                              return (
                                <div
                                  key={lot.selectedInventoryId}
                                  className="py-2.5 text-gray-950 font-normal text-base"
                                >
                                  <MonetaryDisplay amount={prices.basePrice} />
                                </div>
                              );
                            })}
                          {form
                            .watch(`items.${index}.lots`)
                            .filter((lot) => lot.selectedInventoryId).length ===
                            0 && <div className="text-sm py-2">-</div>}
                        </TableCell>
                        <TableCell className={tableCellClass}>
                          {form
                            .watch(`items.${index}.lots`)
                            .filter((lot) => lot.selectedInventoryId)
                            .map((lot) => {
                              const selectedInventory =
                                productKnowledgeInventoriesMap[
                                  effectiveProductKnowledge.id
                                ]?.find(
                                  (inv) => inv.id === lot.selectedInventoryId,
                                );

                              return selectedInventory ? (
                                <div
                                  key={lot.selectedInventoryId}
                                  className="py-2.5 text-gray-950 font-normal text-base"
                                >
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
                                <div
                                  key={lot.selectedInventoryId}
                                  className="py-2.5"
                                >
                                  --
                                </div>
                              );
                            })}
                          {form
                            .watch(`items.${index}.lots`)
                            .filter((lot) => lot.selectedInventoryId).length ===
                            0 && (
                            <div className="text-sm text-gray-500 py-2">-</div>
                          )}
                        </TableCell>
                        <TableCell className={tableCellClass}>
                          {field.medication ? (
                            <FormField
                              control={form.control}
                              name={`items.${index}.isFullyDispensed`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Switch
                                      className="data-[state=checked]:bg-primary-600"
                                      checked={formField.value}
                                      onCheckedChange={formField.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-white rounded-lg shadow-sm">
                    <TableCell colSpan={11} className="p-0 rounded-lg">
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
                                      setSelectedProduct(productKnowledge);
                                      setIsAddMedicationSheetOpen(true);
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
                          className="w-full h-12 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-lg"
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
                `/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/preparation`,
              );
            }}
          />
        )}

        <AddMedicationSheet
          open={isAddMedicationSheetOpen}
          onOpenChange={setIsAddMedicationSheetOpen}
          selectedProduct={selectedProduct}
          existingDosageInstructions={
            editingItemIndex !== null
              ? form.watch(`items.${editingItemIndex}.dosageInstructions`)?.[0]
              : undefined
          }
          isEditing={editingItemIndex !== null}
          onChange={
            editingItemIndex !== null
              ? (dosageInstructions) => {
                  form.setValue(
                    `items.${editingItemIndex}.dosageInstructions`,
                    dosageInstructions,
                    {
                      shouldDirty: true,
                      shouldTouch: true,
                    },
                  );

                  if (dosageInstructions?.[0]) {
                    const newDaysSupply = convertDurationToDays(
                      dosageInstructions[0]?.timing?.repeat?.bounds_duration
                        ?.value || 0,
                      dosageInstructions[0]?.timing?.repeat?.bounds_duration
                        ?.unit || "",
                    );
                    form.setValue(
                      `items.${editingItemIndex}.daysSupply`,
                      newDaysSupply,
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                      },
                    );

                    const medicationDataForQuantity =
                      form.getValues(`items.${editingItemIndex}.medication`) ||
                      ({
                        dosage_instruction: dosageInstructions,
                      } as MedicationRequestRead);
                    // Ensure dosage_instruction is updated if medicationDataForQuantity was from form
                    if (
                      form.getValues(`items.${editingItemIndex}.medication`)
                    ) {
                      medicationDataForQuantity.dosage_instruction =
                        dosageInstructions;
                    }

                    const newQuantity = computeInitialQuantity(
                      medicationDataForQuantity,
                    );

                    const currentLots = form.getValues(
                      `items.${editingItemIndex}.lots`,
                    );
                    form.setValue(
                      `items.${editingItemIndex}.lots`,
                      currentLots.map((lot) => ({
                        ...lot,
                        quantity: newQuantity, // Update quantity for existing selected lots
                      })),
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                      },
                    );
                  }
                  setEditingItemIndex(null);
                }
              : undefined
          }
          onAdd={(product, dosageInstructions) => {
            const newQuantity = computeInitialQuantity({
              dosage_instruction: dosageInstructions,
            } as MedicationRequestRead);

            append({
              reference_id: crypto.randomUUID(),
              productKnowledge: product,
              isSelected: true,
              daysSupply: convertDurationToDays(
                dosageInstructions[0]?.timing?.repeat?.bounds_duration?.value ||
                  0,
                dosageInstructions[0]?.timing?.repeat?.bounds_duration?.unit ||
                  "",
              ),
              isFullyDispensed: false,
              dosageInstructions,
              lots: [
                {
                  selectedInventoryId: "",
                  quantity: newQuantity,
                },
              ],
              // No substitution when initially adding
            });

            setProductKnowledgeInventoriesMap((prev) => ({
              [product.id]: undefined,
              ...prev,
            }));

            setSelectedProduct(undefined);
          }}
        />

        {originalProductForSubstitution && (
          <SubstitutionSheet
            open={isSubstitutionSheetOpen}
            onOpenChange={setIsSubstitutionSheetOpen}
            originalProductKnowledge={originalProductForSubstitution}
            currentSubstitution={
              substitutingItemIndex !== null
                ? form.watch(`items.${substitutingItemIndex}.substitution`)
                : undefined
            }
            facilityId={facilityId}
            onSave={(substitutionDetails) => {
              if (substitutingItemIndex === null) return;

              if (substitutionDetails) {
                form.setValue(
                  `items.${substitutingItemIndex}.substitution`,
                  substitutionDetails,
                  { shouldDirty: true, shouldTouch: true },
                );
                // Reset lots and quantity for the substituted item
                form.setValue(
                  `items.${substitutingItemIndex}.lots`,
                  [{ selectedInventoryId: "", quantity: 0 }],
                  { shouldDirty: true, shouldTouch: true },
                );

                // Ensure inventory for the new substituted product is fetched
                setProductKnowledgeInventoriesMap((prev) => ({
                  ...prev,
                  [substitutionDetails.substitutedProductKnowledge.id]:
                    prev[substitutionDetails.substitutedProductKnowledge.id] ||
                    undefined,
                }));
              } else {
                // Clearing substitution
                form.setValue(
                  `items.${substitutingItemIndex}.substitution`,
                  undefined,
                  { shouldDirty: true, shouldTouch: true },
                );
                // Reset lots based on original product's medication request or default to 0
                const originalItem = form.getValues(
                  `items.${substitutingItemIndex}`,
                );
                const originalMedication = originalItem.medication as
                  | MedicationRequestRead
                  | undefined;
                const initialQuantity = originalMedication
                  ? computeInitialQuantity(originalMedication)
                  : 0;
                form.setValue(
                  `items.${substitutingItemIndex}.lots`,
                  [{ selectedInventoryId: "", quantity: initialQuantity }],
                  { shouldDirty: true, shouldTouch: true },
                );
              }
              setSubstitutingItemIndex(null);
              setOriginalProductForSubstitution(undefined);
              setIsSubstitutionSheetOpen(false);
            }}
          />
        )}
      </div>
    </Page>
  );
}

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
            if (value) {
              setLocalDoseRange((prev) => ({
                ...prev,
                low: value,
                high: {
                  ...prev.high,
                  unit: value.unit,
                },
              }));
            }
          }}
        />
      </div>
      <div>
        <Label className="mb-1.5">{t("end_dose")}</Label>
        <ComboboxQuantityInput
          quantity={localDoseRange.high}
          onChange={(value) => {
            if (value) {
              setLocalDoseRange((prev) => ({
                ...prev,
                high: value,
                low: {
                  ...prev.low,
                  unit: value.unit,
                },
              }));
            }
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
