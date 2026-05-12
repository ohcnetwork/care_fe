import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { SubstitutionSheet } from "@/components/Medication/SubstitutionSheet";
import { formatMedicationLine } from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  InventoryItemsSelector,
  LotSelection,
} from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import { billMedicationsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { selectEligibleInventoryItems } from "@/pages/Facility/services/pharmacy/billMedications/utils/itemsAutoSelect";
import { isMedicationDispenseable } from "@/pages/Facility/services/pharmacy/billMedications/utils/utils";
import { MedicineInfoPopover } from "@/pages/Facility/services/pharmacy/components/MedicineInfoPopover";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getBasePrice,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  computeMedicationDispenseQuantity,
  displayMedicationName,
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
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { getLocationPath } from "@/types/location/utils";
import { decimal, round } from "@/Utils/decimal";
import { isLotAllowedForDispensing } from "@/Utils/inventory";
import mutate from "@/Utils/request/mutate";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import { DotsVerticalIcon, MinusCircledIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BadgeInfo,
  Check,
  CheckCircleIcon,
  CheckIcon,
  FileTextIcon,
  Pill,
  PrinterIcon,
  RefreshCcwIcon,
  XCircleIcon,
} from "lucide-react";
import { Link, navigate } from "raviger";
import React, { useEffect, useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

export const BillMedicationsPrescriptionCard = ({
  form,
  name,
  onRemove,
}: {
  form: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
  name: `prescriptions.${number}`;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();

  const prescription = form.watch(`${name}.prescription`);

  const { remove, fields } = useFieldArray({
    control: form.control,
    name: `${name}.items`,
  });

  const { mutate: updateMedicationRequest } = useMutation({
    mutationFn: (medication: MedicationRequestRead) => {
      return mutate(medicationRequestApi.update, {
        pathParams: {
          patientId: prescription.encounter.patient.id,
          id: medication.id,
        },
      })(medication);
    },
  });

  return (
    <>
      <PrescriptionSummary form={form} name={name} onRemove={onRemove} />
      <HeaderRow form={form} name={name} />

      {fields.map((field, index) => (
        <React.Fragment key={field.id}>
          <MedicineLineItem
            name={`${name}.items.${index}`}
            form={form}
            onRemove={() =>
              updateMedicationRequest(
                {
                  ...field.medication!,
                  dispense_status: MedicationRequestDispenseStatus.incomplete,
                },
                {
                  onSuccess: () => {
                    toast.success(t("medication_request_removed_successfully"));
                    remove(index);
                  },
                },
              )
            }
            onMarkAsGiven={() =>
              updateMedicationRequest(
                {
                  ...field.medication!,
                  dispense_status: MedicationRequestDispenseStatus.complete,
                },
                {
                  onSuccess: () => {
                    toast.success(
                      t("medication_request_status_updated_successfully"),
                    );
                    remove(index);
                  },
                },
              )
            }
          />
          <div className="col-span-7 h-px bg-gray-200" />
        </React.Fragment>
      ))}

      {fields.length === 0 && (
        <EmptyState
          className="col-span-7 rounded-none border-b border-gray-200"
          icon={<Pill className="text-primary size-6" />}
          title={t("no_medications")}
          description={t("add_medications_to_bill_description")}
        />
      )}
    </>
  );
};

export const BillMedicationsOtherItemsCard = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
}) => {
  const { t } = useTranslation();
  const items = form.watch("otherItems");

  const { remove } = useFieldArray({
    control: form.control,
    name: "otherItems",
  });

  return (
    <>
      <div className="relative flex justify-between col-start-1 col-span-7 bg-white pt-4 pr-2 pb-2 pl-4">
        <div className="absolute top-5 left-0 h-4 w-1 bg-amber-500 rounded-r-md" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-base text-gray-950">
              <span className="font-semibold">{t("other_items")} </span>
            </div>
            <div className="flex gap-2.5">
              <span className="text-sm font-medium text-gray-700">
                ({t("items_count", { count: items.length })})
              </span>
            </div>
          </div>
        </div>
      </div>

      <HeaderRow />

      {items.map((_, index) => (
        <React.Fragment key={`otherItems.${index}`}>
          <MedicineLineItem
            key={`otherItems.${index}`}
            name={`otherItems.${index}`}
            form={form}
            onRemove={() => remove(index)}
          />
          <div className="col-span-7 h-px bg-gray-200" />
        </React.Fragment>
      ))}

      {items.length === 0 && (
        <EmptyState
          className="col-span-7 rounded-none border-b border-gray-200"
          icon={<Pill className="text-primary size-6" />}
          title={t("no_medications")}
          description={t("add_medications_to_bill_description")}
        />
      )}
    </>
  );
};

const PrescriptionSummary = ({
  form,
  name,
  onRemove,
}: {
  form: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
  name: `prescriptions.${number}`;
  onRemove: () => void;
}) => {
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updatePrescriptionStatus, isPending } = useMutation({
    mutationFn: ({
      prescription,
      newStatus,
    }: {
      prescription: PrescriptionRead;
      newStatus: PrescriptionStatus;
    }) => {
      const patientId = prescription.encounter.patient.id;
      const id = prescription.id;
      return mutate(prescriptionApi.update, {
        pathParams: { patientId, id },
        queryParams: { facility: prescription.encounter.facility.id },
      })({ ...prescription, status: newStatus });
    },
    onSuccess: (_, { prescription, newStatus }) => {
      queryClient.invalidateQueries({
        queryKey: [
          "prescription",
          prescription.encounter.patient.id,
          prescription.id,
        ],
      });

      if (newStatus === PrescriptionStatus.completed) {
        onRemove();
        toast.success(t("prescription_marked_as_completed"));
      } else if (newStatus === PrescriptionStatus.cancelled) {
        onRemove();
        toast.success(t("prescription_marked_as_cancelled"));
      }
    },
  });

  const prescription = form.watch(`${name}.prescription`);
  const encounter = prescription.encounter;
  const isActive = prescription.status === PrescriptionStatus.active;

  return (
    <div className="relative flex justify-between col-start-1 col-span-7 bg-white pt-4 pr-2 pb-2 pl-4">
      <div className="absolute top-5 left-0 h-4 w-1 bg-indigo-500 rounded-r-md" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="text-base text-gray-950">
            <span className="font-medium">{t("prescribed_by")} </span>
            <span className="font-semibold">
              {formatName(prescription.prescribed_by)}
            </span>
          </div>
          <div className="flex gap-2.5">
            <span className="text-sm font-medium text-gray-700">
              {format(prescription.created_date, "dd/MM/yyyy · hh:mm a")} (
              {t("items_count", { count: prescription.medications.length })})
            </span>
            <hr className="h-5 w-px bg-gray-300" />
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-950">
                {t("location")}:{" "}
              </span>
              <span className="text-sm text-gray-700">
                {encounter.current_location
                  ? getLocationPath(encounter.current_location)
                  : "-"}
              </span>
            </div>
          </div>
        </div>
        {prescription.note && (
          <span className="text-sm font-medium text-gray-700">
            {t("note")}: {prescription.note}
          </span>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <FormField
          control={form.control}
          name={`${name}.markComplete`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={prescription.status !== PrescriptionStatus.active}
                  />
                  <span className="text-sm font-medium text-gray-950">
                    {t("mark_complete")}
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <Button variant="outline" size="icon" asChild>
          <Link
            href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/prescription/${prescription.id}/print`}
            basePath="/"
          >
            <PrinterIcon />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <DotsVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!isActive || isPending}
              onSelect={() => {
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${encounter.patient.id}/prescriptions/${prescription.id}`,
                );
              }}
            >
              <FileTextIcon />
              {t("view_prescription")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() => {
                navigate(
                  `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/prescription/${prescription.id}/print`,
                );
              }}
            >
              <PrinterIcon />
              {t("print_prescription")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isActive || isPending}
              onSelect={() => {
                updatePrescriptionStatus({
                  prescription,
                  newStatus: PrescriptionStatus.completed,
                });
              }}
            >
              <CheckCircleIcon />
              {t("mark_as_completed")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!isActive || isPending}
              onSelect={() => {
                updatePrescriptionStatus({
                  prescription,
                  newStatus: PrescriptionStatus.cancelled,
                });
              }}
              variant="destructive"
            >
              <XCircleIcon />
              {t("cancel_prescription")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const HeaderRow = ({
  form,
  name,
}: {
  form?: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
  name?: `prescriptions.${number}`;
}) => {
  const { t } = useTranslation();

  const eligibleItems =
    form && name
      ? form
          .watch(`${name}.items`)
          .filter((q) => isMedicationDispenseable(q.medication))
      : [];

  return (
    <>
      <div className="col-start-1 bg-gray-100 py-1 px-3 flex items-center">
        {form && name && (
          <FormField
            control={form.control}
            name={`${name}.items`}
            render={() => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={(() => {
                      if (eligibleItems.length === 0) {
                        return false;
                      }
                      if (eligibleItems.every((q) => q.isSelected)) {
                        return true;
                      }
                      if (eligibleItems.every((q) => !q.isSelected)) {
                        return false;
                      }
                      return "indeterminate";
                    })()}
                    onCheckedChange={(checked) => {
                      const items = eligibleItems;
                      items.forEach((_, index) => {
                        form.setValue(
                          `${name}.items.${index}.isSelected`,
                          !!checked,
                        );
                      });
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("medicine")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 pl-3 pr-13 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {t("select_lot")}
        </span>
        <span className="text-sm font-medium text-gray-700">{t("expiry")}</span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("quantity")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center justify-end">
        <span className="text-sm font-medium text-gray-700">{t("price")}</span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("all_given_question")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("actions")}
        </span>
      </div>
    </>
  );
};

interface MedicineLineItemProps {
  form: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
  name: `prescriptions.${number}.items.${number}` | `otherItems.${number}`;
  onRemove: () => void;
  onMarkAsGiven?: () => void;
}

const MedicineLineItem = ({
  name,
  form,
  onRemove,
  onMarkAsGiven,
}: MedicineLineItemProps) => {
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();
  const { t } = useTranslation();

  const [showDialog, setShowDialog] = useState<"remove" | "markAsGiven" | null>(
    null,
  );

  const isSelected = form.watch(`${name}.isSelected`);
  const medication = form.watch(`${name}.medication`);
  const dosageInstructions = form.watch(`${name}.dosageInstructions`);
  const productKnowledge = form.watch(`${name}.productKnowledge`);
  const substitution = form.watch(`${name}.substitution`);
  const lots = form.watch(`${name}.lots`);

  const canDispense = isMedicationDispenseable(medication);

  const disabled = !isSelected;

  const effectiveProductKnowledge =
    substitution?.substitutedProductKnowledge || productKnowledge;

  const effectiveDosageInstructions =
    dosageInstructions ?? medication?.dosage_instruction;

  const canAutoSelectInventoryItems = !!(
    effectiveDosageInstructions && effectiveProductKnowledge
  );

  const {
    mutate: autoSelectInventoryItems,
    isPending: isAutoSelectingInventoryItems,
  } = useMutation({
    mutationFn: mutate(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        product_knowledge: effectiveProductKnowledge?.id || "",
        status: "active",
        limit: 100,
        net_content_gt: 0,
      },
    }),
    onSuccess: (data: PaginatedResponse<InventoryRead>) => {
      if (!effectiveDosageInstructions) {
        return;
      }

      const quantity = computeMedicationDispenseQuantity(
        effectiveDosageInstructions,
      );
      const autoSelectedLots = selectEligibleInventoryItems(data.results, {
        quantity: decimal(quantity),
        canSelect: isLotAllowedForDispensing,
      });

      form.setValue(`${name}.lots`, autoSelectedLots, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
  });

  useEffect(() => {
    if (canAutoSelectInventoryItems) {
      autoSelectInventoryItems(undefined);
    }
  }, [canAutoSelectInventoryItems, autoSelectInventoryItems]);

  return (
    <div className="contents group divide-x divide-gray-200">
      <div
        className={cn(
          "col-start-1 bg-white group-hover:bg-gray-100 group-focus-within:bg-gray-100 py-1 px-3 flex items-center transition-all duration-200 ease-in-out",
          !canDispense && "bg-gray-100",
        )}
      >
        {canDispense && (
          <FormField
            control={form.control}
            name={`${name}.isSelected`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Medicine */}
      <div
        className={cn(
          "bg-white py-2 px-3 flex justify-between items-center gap-2",
          !canDispense && "bg-gray-100",
        )}
      >
        <MedicineLineItemMedication form={form} name={name} />
      </div>

      {medication?.dispense_status ===
      MedicationRequestDispenseStatus.complete ? (
        <>
          <div className="col-span-5 bg-gray-100 py-2 px-3 flex justify-between items-center">
            <span className="text-sm italic font-medium text-gray-700">
              {t("fully_dispensed_in_this_prescription")}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Select Lot */}
          <div className="relative bg-white">
            {canAutoSelectInventoryItems && (
              <Button
                variant="white"
                type="button"
                onClick={() => autoSelectInventoryItems(undefined)}
                disabled={disabled || isAutoSelectingInventoryItems}
                className="absolute top-1/2 -translate-y-1/2 -right-2.25 size-4.5 [&_svg]:size-3 z-10 text-gray-500"
                size="xs"
                title={t("auto_select_lots")}
              >
                <RefreshCcwIcon
                  className={cn(
                    isAutoSelectingInventoryItems && "animate-spin",
                  )}
                />
              </Button>
            )}

            <div className="flex flex-col divide-y divide-gray-200 h-full w-full">
              {effectiveProductKnowledge &&
                lots.map((_, index) => (
                  <FormField
                    key={`${name}.lots.${index}`}
                    control={form.control}
                    name={`${name}.lots.${index}`}
                    render={({ field }) => (
                      <FormItem className="w-full flex-1 flex flex-col justify-center px-3 py-2">
                        <FormControl>
                          <InventoryItemsSelector
                            {...field}
                            selected={lots}
                            onChange={(lots) => {
                              form.setValue(`${name}.lots`, lots, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                            }}
                            facilityId={facilityId}
                            locationId={locationId}
                            productKnowledgeId={effectiveProductKnowledge.id}
                            showOnlyAvailable
                            disabled={disabled || isAutoSelectingInventoryItems}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              {lots.length === 0 && (
                <div className="w-full flex-1 flex flex-col justify-center px-3 py-2">
                  {effectiveProductKnowledge ? (
                    <InventoryItemsSelector
                      selected={lots}
                      onChange={(lots) =>
                        form.setValue(`${name}.lots`, lots, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      facilityId={facilityId}
                      locationId={locationId}
                      productKnowledgeId={effectiveProductKnowledge.id}
                      showOnlyAvailable
                      disabled={disabled || isAutoSelectingInventoryItems}
                    />
                  ) : (
                    <span className="text-sm italic text-gray-700 font-medium">
                      {t("product_not_available")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="relative bg-white">
            <div className="flex flex-col divide-y divide-gray-200 h-full w-full">
              {lots.map((_, index) => (
                <FormField
                  key={`${name}.lots.${index}.quantity`}
                  control={form.control}
                  name={`${name}.lots.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-full flex-1 flex flex-col justify-center px-3">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={lots[index].item.net_content}
                          {...field}
                          className="w-20"
                          placeholder="0"
                          disabled={disabled || isAutoSelectingInventoryItems}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="bg-white flex flex-col divide-y divide-gray-200">
            {lots.map((lot, index) => (
              <div
                key={`${name}.lots.${index}`}
                className="w-full flex-1 text-end flex flex-col justify-center px-3"
              >
                <MedicineLineItemSelectedLotPrice lot={lot} />
              </div>
            ))}
          </div>

          {/* All Given */}
          {/* TODO: auto toggle this based on the quantity of the lots */}
          <div className="bg-white py-2 px-3 flex items-center justify-center">
            {medication ? (
              <FormField
                control={form.control}
                name={`${name}.allGiven`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        className="data-[state=checked]:bg-primary-600"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              "-"
            )}
          </div>

          {/* Actions */}
          <div className="bg-white py-1 px-2 flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <DotsVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onMarkAsGiven && (
                  <DropdownMenuItem
                    onClick={() => setShowDialog("markAsGiven")}
                  >
                    <CheckIcon className="size-4" />
                    {t("mark_as_already_given")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowDialog("remove")}
                >
                  <MinusCircledIcon className="size-4 text-destructive" />
                  {t("remove_medication")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}

      <FormField
        control={form.control}
        name={name}
        render={({ fieldState }) => (
          <>
            {fieldState.error?.message && (
              <FormItem className="col-start-1 col-span-7 bg-red-50 py-1 px-13 border-y border-b-red-300 border-t-gray-200">
                <FormMessage />
              </FormItem>
            )}
          </>
        )}
      />

      <ConfirmActionDialog
        open={showDialog === "markAsGiven"}
        onOpenChange={(open) => {
          if (!open) setShowDialog(null);
        }}
        title={t("mark_as_already_given")}
        description={
          <>
            <Trans
              i18nKey="confirm_action_description"
              values={{ action: t("mark_as_already_given").toLowerCase() }}
              components={{ 1: <strong className="text-gray-900" /> }}
            />{" "}
            {t("you_cannot_change_once_submitted")}
            <p className="mt-2">
              {t("medication")}:{" "}
              <strong>{medication && displayMedicationName(medication)}</strong>
            </p>
          </>
        }
        onConfirm={() => {
          onMarkAsGiven?.();
          setShowDialog(null);
        }}
        confirmText={t("mark_as_already_given")}
      />

      <ConfirmActionDialog
        open={showDialog === "remove"}
        onOpenChange={(open) => {
          if (!open) setShowDialog(null);
        }}
        title={t("remove_medication")}
        description={
          <>
            <Trans
              i18nKey="confirm_action_description"
              values={{ action: t("remove_medication").toLowerCase() }}
              components={{ 1: <strong className="text-gray-900" /> }}
            />{" "}
            {t("you_cannot_change_once_submitted")}
            <p className="mt-2">
              {t("medication")}:{" "}
              <strong>{medication && displayMedicationName(medication)}</strong>
            </p>
          </>
        }
        onConfirm={() => {
          onRemove();
          setShowDialog(null);
        }}
        confirmText={t("remove_medication")}
        variant="destructive"
      />
    </div>
  );
};

const MedicineLineItemMedication = ({
  form,
  name,
}: {
  form: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
  name: `prescriptions.${number}.items.${number}` | `otherItems.${number}`;
}) => {
  const { t } = useTranslation();

  const isSelected = form.watch(`${name}.isSelected`);
  const medication = form.watch(`${name}.medication`);
  const productKnowledge = form.watch(`${name}.productKnowledge`);
  const substitution = form.watch(`${name}.substitution`);
  const dosageInstructions = form.watch(`${name}.dosageInstructions`);

  const effectiveProductKnowledge =
    substitution?.substitutedProductKnowledge || productKnowledge;

  const dispenseCompleted =
    medication?.dispense_status === MedicationRequestDispenseStatus.complete;

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className={cn("flex flex-col", dispenseCompleted && "italic")}>
          <span
            className={cn(
              "font-semibold text-gray-950",
              !isSelected && "line-through",
            )}
          >
            {effectiveProductKnowledge?.name ||
              (medication && displayMedicationName(medication)) ||
              t("unknown_medication")}
          </span>
          {substitution && (
            <span className="text-gray-700 font-semibold italic line-through">
              {!productKnowledge
                ? medication?.medication?.display
                : productKnowledge?.name}
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            {(dosageInstructions ?? medication?.dosage_instruction)?.map(
              (instruction, index) => {
                const line = formatMedicationLine(instruction);
                if (!line) return null;
                return (
                  <span
                    key={index}
                    className="text-sm text-gray-700 font-medium flex items-center gap-1 whitespace-nowrap capitalize"
                  >
                    {line}
                  </span>
                );
              },
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {medication?.dispense_status ===
            MedicationRequestDispenseStatus.partial && (
            <Badge variant="yellow">{t("partially_dispensed")}</Badge>
          )}

          {medication?.dispense_status ===
            MedicationRequestDispenseStatus.complete && (
            <Badge variant="blue">
              <Check className="size-4" />
              {t("dispensed")}
            </Badge>
          )}

          {substitution && <Badge variant="orange">{t("substituted")}</Badge>}

          {!effectiveProductKnowledge && (
            <Badge variant="secondary">{t("no_product_linked")}</Badge>
          )}
        </div>
        {medication?.note && (
          <span className="text-sm text-gray-700">{`${t("note")}: ${medication?.note}`}</span>
        )}
      </div>
      {!dispenseCompleted && (
        <div className="flex gap-3">
          {effectiveProductKnowledge && (
            <MedicineInfoPopover
              trigger={
                <Button variant="outline" size="icon" className="text-gray-950">
                  <BadgeInfo />
                </Button>
              }
              medication={medication}
              effectiveProductKnowledge={effectiveProductKnowledge}
              substitution={substitution}
              productKnowledge={productKnowledge}
              dosageInstructions={dosageInstructions}
            />
          )}

          <FormField
            control={form.control}
            name={`${name}.substitution`}
            render={({ field }) => (
              <FormItem>
                <SubstitutionSheet
                  original={{
                    productKnowledge: productKnowledge,
                    medicationName: medication?.medication.display,
                  }}
                  initialValue={field.value}
                  onSave={(value) => {
                    field.onChange(value);
                    form.setValue(`${name}.lots`, [], {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  onClear={() => {
                    field.onChange(null);
                    form.setValue(`${name}.lots`, [], {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-sm font-semibold text-gray-950 px-6"
                    >
                      {t("sub")}
                    </Button>
                  }
                />
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  );
};

const MedicineLineItemSelectedLotPrice = ({ lot }: { lot: LotSelection }) => {
  const priceComponents =
    lot.item.product.charge_item_definition?.price_components || [];

  const basePrice = getBasePrice(priceComponents);
  const discountComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.discount,
  );
  const hasDiscount = discountComponents && discountComponents.length > 0;

  return (
    <div className="text-base font-medium">
      <MonetaryDisplay amount={basePrice} />
      {hasDiscount && (
        <p className="text-xs text-gray-500 ml-1">
          (
          {discountComponents
            .map((component) =>
              component.factor ? `-${round(component.factor)}%` : "",
            )
            .filter(Boolean)
            .join(", ")}
          )
        </p>
      )}
    </div>
  );
};
