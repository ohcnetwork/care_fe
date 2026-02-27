import {
  formatDosage,
  formatDuration,
  formatFrequencyShort,
  formatTotalUnits,
} from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Switch } from "@/components/ui/switch";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  InventoryItemsSelector,
  LotSelection,
} from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import {
  BillMedicationLineItemSchemaType,
  billMedicationsByPrescriptionsFormSchema,
} from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getBasePrice,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  displayMedicationName,
  MedicationRequestDispenseStatus,
} from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { getLocationPath } from "@/types/location/utils";
import { round } from "@/Utils/decimal";
import { formatName } from "@/Utils/utils";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { BadgeInfo, PrinterIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export const BillMedicationsPrescriptionCard = ({
  form,
  name,
}: {
  form: UseFormReturn<z.infer<typeof billMedicationsByPrescriptionsFormSchema>>;
  name: `prescriptions.${number}`;
}) => {
  const prescription = form.watch(`${name}.prescription`);
  const items = form.watch(`${name}.items`);

  if (!prescription) {
    return null;
  }

  return (
    <>
      <Summary prescription={prescription} form={form} name={name} />
      <HeaderRow form={form} name={name} />

      {/* TODO: we may need to exclude medications based on their status (enterred in errors?) */}
      {items.map((_, index) => (
        <MedicineLineItem
          key={`${name}.items.${index}`}
          name={`${name}.items.${index}`}
          form={form}
        />
      ))}
    </>
  );
};

const Summary = ({
  prescription,
  form,
  name,
}: {
  prescription: PrescriptionRead;
  form: UseFormReturn<z.infer<typeof billMedicationsByPrescriptionsFormSchema>>;
  name: `prescriptions.${number}`;
}) => {
  const { t } = useTranslation();

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
                {prescription.encounter.current_location
                  ? getLocationPath(prescription.encounter.current_location)
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
                  />
                  <span className="text-sm font-medium text-gray-950">
                    {t("mark_complete")}
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // TODO: wire this
          }}
        >
          <PrinterIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // TODO: wire this
          }}
        >
          <DotsVerticalIcon />
        </Button>
      </div>
    </div>
  );
};

const HeaderRow = ({
  form,
  name,
}: {
  form: UseFormReturn<z.infer<typeof billMedicationsByPrescriptionsFormSchema>>;
  name: `prescriptions.${number}`;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="col-start-1 bg-gray-100 py-1 px-3 flex items-center">
        <FormField
          control={form.control}
          name={`${name}.items`}
          render={() => (
            <FormItem>
              <FormControl>
                <Checkbox
                  checked={
                    form.watch(`${name}.items`).length > 0 &&
                    form.watch(`${name}.items`).every((q) => q.isSelected)
                  }
                  onCheckedChange={(checked) => {
                    const items = form.getValues(`${name}.items`);
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
  form: UseFormReturn<z.infer<typeof billMedicationsByPrescriptionsFormSchema>>;
  name: `prescriptions.${number}.items.${number}`;
}

const MedicineLineItem = ({ name, form }: MedicineLineItemProps) => {
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const item = form.watch(name);
  const isSelected = form.watch(`${name}.isSelected`);
  const medication = form.watch(`${name}.medication`);
  const productKnowledge = form.watch(`${name}.productKnowledge`);
  const substitution = form.watch(`${name}.substitution`);
  const lots = form.watch(`${name}.lots`);

  const disabled = !isSelected;

  const effectiveProductKnowledge =
    substitution?.substitutedProductKnowledge || productKnowledge;

  return (
    <>
      <div className="col-start-1 bg-white py-1 px-3 flex items-center">
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
      </div>

      {/* Medicine */}
      <div className="bg-white py-2 px-3 flex justify-between items-center">
        <MedicineLineItemMedication item={item} />
      </div>

      {/* Select Lot */}
      <div className="bg-white flex flex-col divide-y divide-gray-200">
        {lots.map((_, index) => (
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
                    onChange={(lots) => form.setValue(`${name}.lots`, lots)}
                    facilityId={facilityId}
                    locationId={locationId}
                    // TODO: handle this?
                    productKnowledgeId={effectiveProductKnowledge?.id || ""}
                    showOnlyAvailable
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
        {lots.length === 0 && (
          <div className="w-full flex-1 flex flex-col justify-center px-3 py-2">
            <InventoryItemsSelector
              selected={lots}
              onChange={(lots) => form.setValue(`${name}.lots`, lots)}
              facilityId={facilityId}
              locationId={locationId}
              // TODO: handle this?
              productKnowledgeId={productKnowledge?.id || ""}
              showOnlyAvailable
            />
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="bg-white flex flex-col divide-y divide-gray-200">
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
                    {...field}
                    className="border-gray-300 border rounded-md w-24"
                    placeholder="0"
                    disabled={disabled}
                    autoFocus
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
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
              </FormItem>
            )}
          />
        ) : (
          "-"
        )}
      </div>

      {/* Actions */}
      <div className="bg-white py-1 px-2 flex items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // TODO: wire this
          }}
        >
          <DotsVerticalIcon />
        </Button>
      </div>
    </>
  );
};

const MedicineLineItemMedication = ({
  item,
}: {
  item: BillMedicationLineItemSchemaType;
}) => {
  const { t } = useTranslation();

  const medication = item.medication;
  const productKnowledge = item.productKnowledge;
  const substitution = item.substitution;

  const effectiveProductKnowledge =
    substitution?.substitutedProductKnowledge || productKnowledge;

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-950">
            {effectiveProductKnowledge?.name ||
              (medication && displayMedicationName(medication)) ||
              t("unknown_medication")}
          </span>
          {(substitution || !productKnowledge) && (
            <span className="text-gray-700 font-semibold italic line-through">
              {!productKnowledge
                ? medication?.medication?.display
                : productKnowledge?.name}
            </span>
          )}

          <div className="text-sm text-gray-700 font-medium flex items-center gap-1 whitespace-nowrap capitalize">
            {formatDosage(medication?.dosage_instruction?.[0])} × (
            {formatFrequencyShort(medication?.dosage_instruction?.[0])}) ×{" "}
            {formatDuration(medication?.dosage_instruction?.[0], {
              abbreviated: true,
            }) || "-"}{" "}
            = {formatTotalUnits(medication?.dosage_instruction, t("units"))}
          </div>
        </div>
        <div className="flex gap-1">
          {medication?.status && (
            <Badge variant="yellow" className="text-xs">
              {t(`medication_status__${medication?.status}`)}
            </Badge>
          )}
          {medication?.dispense_status ===
            MedicationRequestDispenseStatus.partial && (
            <Badge variant="yellow" className="text-xs">
              {t("partially_billed")}
            </Badge>
          )}
          {(substitution || !productKnowledge) && (
            <Badge variant="orange">{t("substituted")}</Badge>
          )}
        </div>
        {medication?.note && (
          <span className="text-sm text-gray-700">{`${t("note")}: ${medication?.note}`}</span>
        )}
      </div>
      <div className="flex gap-3">
        {/* TODO: wire this detail info button (sub. plus more...) */}
        <Button variant="outline" size="icon" className="text-gray-950">
          <BadgeInfo />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="text-sm font-semibold text-gray-950 px-6"
          onClick={() => {
            // TODO: wire this
          }}
        >
          {t("sub")}
        </Button>
      </div>
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
        <span className="text-xs text-gray-500 ml-1">
          (
          {discountComponents
            .map((component) =>
              component.factor ? `-${round(component.factor)}%` : "",
            )
            .filter(Boolean)
            .join(", ")}
          )
        </span>
      )}
    </div>
  );
};
