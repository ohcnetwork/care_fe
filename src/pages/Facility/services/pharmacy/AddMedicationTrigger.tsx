import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { billMedicationsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface Props {
  form: UseFormReturn<z.infer<typeof billMedicationsFormSchema>>;
}

export const AddMedicationTrigger = ({ form }: Props) => {
  const { t } = useTranslation();

  const { append } = useFieldArray({
    control: form.control,
    name: "otherItems",
  });

  // TODO: switch to using AddMedicationSheet once it's cleaned up to use the new form schema approach

  return (
    <ProductKnowledgeSelect
      onChange={(productKnowledge) => {
        if (!productKnowledge) return;

        append({
          reference_id: crypto.randomUUID(),
          isSelected: true,
          medication: null,
          dosageInstructions: [
            {
              dose_and_rate: productKnowledge.base_unit
                ? {
                    type: "ordered",
                    dose_quantity: {
                      value: "1",
                      unit: productKnowledge.base_unit,
                    },
                  }
                : undefined,
              timing: undefined,
              as_needed_boolean: true,
              route: undefined,
              site: undefined,
              method: undefined,
              additional_instruction: undefined,
              as_needed_for: undefined,
            },
          ],
          productKnowledge,
          substitution: null,
          lots: [],
          allGiven: true,
        });
      }}
      placeholder={t("add_medication")}
      className="w-full"
    />
  );
};
