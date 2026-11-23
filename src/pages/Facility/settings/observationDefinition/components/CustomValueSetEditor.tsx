import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CustomValueSet,
  Interpretation,
} from "@/types/base/qualifiedRange/qualifiedRange";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { InterpretationComponent } from "./InterpretationField";

export function CustomValueSetEditor<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  valuesetInterpretations,
  setValuesetInterpretations,
  fieldName,
}: {
  form: UseFormReturn<TFieldValues>;
  valuesetInterpretations: CustomValueSet[];
  setValuesetInterpretations: (value: CustomValueSet[]) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();

  const { data: valuesets } = useQuery({
    queryKey: ["valuesets"],
    queryFn: query(valueSetApi.list),
  });

  const handleSetValueset = (valueset: string, index: number) => {
    setValuesetInterpretations(
      valuesetInterpretations.map((valuesetInterpretation, i) =>
        i === index
          ? { ...valuesetInterpretation, valueset }
          : valuesetInterpretation,
      ),
    );
  };

  const handleSetInterpretation = (
    interpretation: Interpretation,
    index: number,
  ) => {
    setValuesetInterpretations(
      valuesetInterpretations.map((valuesetInterpretation, i) =>
        i === index
          ? {
              ...valuesetInterpretation,
              interpretation,
            }
          : valuesetInterpretation,
      ),
    );
  };
  const handleAddValueset = () => {
    setValuesetInterpretations([
      ...valuesetInterpretations,
      {
        valueset: "",
        interpretation: { display: "", highlight: false, code: undefined },
      },
    ]);
  };

  const handleRemoveValueset = (index: number) => {
    setValuesetInterpretations(
      valuesetInterpretations.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("custom_valueset_interpretations")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAddValueset}
          className="h-7 text-xs gap-1"
        >
          <Plus className="size-3" />
          {t("add")}
        </Button>
      </div>
      {valuesetInterpretations.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {valuesetInterpretations.map((valuesetInterpretation, index) => (
            <div key={index} className="flex gap-2 p-2.5 items-start">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Select
                  value={valuesetInterpretation.valueset}
                  onValueChange={(value) => handleSetValueset(value, index)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t("select_a_value_set")} />
                  </SelectTrigger>
                  <SelectContent>
                    {valuesets?.results?.map((valueset) => (
                      <SelectItem key={valueset.slug} value={valueset.slug}>
                        {valueset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {valuesetInterpretation.valueset && (
                  <InterpretationComponent
                    form={form}
                    interpretation={valuesetInterpretation.interpretation}
                    setInterpretation={(value) =>
                      handleSetInterpretation(value, index)
                    }
                    fieldName={`${fieldName}.valueset_interpretation.${index}.interpretation`}
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="size-7 shrink-0 text-gray-400 hover:text-red-600 mt-0.5"
                onClick={() => handleRemoveValueset(index)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
