import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Interpretation,
  NumericRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import { Plus, X } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { InterpretationComponent } from "./InterpretationField";

export function NumericRangeEditor<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  ranges,
  setRanges,
  fieldName,
}: {
  form: UseFormReturn<TFieldValues>;
  ranges: NumericRange[];
  setRanges: (value: NumericRange[]) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();
  const handleSetRange = (value: NumericRange, index: number) => {
    const newRanges = [...ranges];
    newRanges[index] = value;
    setRanges(newRanges);
  };

  const handleSetInterpretation = (
    interpretation: Interpretation,
    index: number,
  ) => {
    handleSetRange(
      {
        ...ranges[index],
        interpretation,
      },
      index,
    );
  };

  const handleSetMin = (value: string, index: number) => {
    handleSetRange({ ...ranges[index], min: value || undefined }, index);
  };

  const handleSetMax = (value: string, index: number) => {
    handleSetRange({ ...ranges[index], max: value || undefined }, index);
  };

  const handleAddRange = () => {
    setRanges([
      ...ranges,
      {
        interpretation: { display: "", highlight: false, code: undefined },
        min: undefined,
        max: undefined,
      },
    ]);
  };

  const handleRemoveRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("ranges")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAddRange}
          className="h-7 text-xs gap-1"
        >
          <Plus className="size-3" />
          {t("add")}
        </Button>
      </div>
      {ranges && ranges.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {ranges.map((range, index) => {
            const { min, max } = range;
            return (
              <div
                key={index}
                className="flex gap-2 p-2.5 items-center"
                title={`Range ${index + 1}`}
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {range?.interpretation && (
                    <InterpretationComponent
                      form={form}
                      interpretation={range.interpretation}
                      setInterpretation={(value) =>
                        handleSetInterpretation(value, index)
                      }
                      fieldName={`${fieldName}.ranges.${index}.interpretation`}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <FormField
                      control={form.control}
                      name={`${fieldName}.ranges.${index}.min` as any}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              value={min}
                              placeholder={t("min")}
                              className="h-8 text-xs"
                              onChange={(e) =>
                                handleSetMin(e.target.value, index)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-gray-300 text-xs shrink-0">–</span>
                    <FormField
                      control={form.control}
                      name={`${fieldName}.ranges.${index}.max` as any}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              value={max}
                              placeholder={t("max")}
                              className="h-8 text-xs"
                              onChange={(e) =>
                                handleSetMax(e.target.value, index)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="size-7 shrink-0 text-gray-400 hover:text-red-600 mt-0.5"
                  onClick={() => handleRemoveRange(index)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
