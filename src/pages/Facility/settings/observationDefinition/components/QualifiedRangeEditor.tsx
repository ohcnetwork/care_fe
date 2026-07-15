import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Condition } from "@/types/base/condition/condition";
import {
  CustomValueSet,
  InterpretationType,
  NumericRange,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ConditionEditor } from "./ConditionEditor";
import { CustomValueSetEditor } from "./CustomValueSetEditor";
import { DefaultInterpretationComponent } from "./InterpretationField";
import { NumericRangeEditor } from "./NumericRangeEditor";

export function QualifiedRangeEditor<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  editedRange,
  setEditedRange,
  onSave,
  onCancel,
  interpretationType,
  fieldName,
  facilityId,
}: {
  form: UseFormReturn<TFieldValues>;
  editedRange: QualifiedRange;
  setEditedRange: (
    range: QualifiedRange,
    field?: keyof QualifiedRange,
    value?: any,
  ) => void;
  onSave: () => void;
  onCancel: () => void;
  interpretationType: InterpretationType;
  fieldName: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  const handleSetConditions = (value: Condition[]) => {
    setEditedRange(editedRange, "conditions", value);
  };

  const handleSetRanges = (value: NumericRange[]) => {
    setEditedRange(editedRange, "ranges", value);
  };

  const customValueSetInterpretations =
    editedRange.valueset_interpretation || [];

  const handleSetCustomValuesetInterpretations = (value: CustomValueSet[]) => {
    setEditedRange(editedRange, "valueset_interpretation", value);
  };

  const handleSave = () => {
    onSave();
  };

  const isDisabled =
    (interpretationType === InterpretationType.ranges &&
      editedRange.ranges.length === 0) ||
    (interpretationType === InterpretationType.valuesets &&
      (editedRange.valueset_interpretation || []).length === 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto py-2 px-0.5">
        <FormField
          control={form.control}
          name={`${fieldName}.title` as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  value={editedRange.title ?? ""}
                  placeholder={t("interpretation_title_placeholder")}
                  className="h-10 text-base font-medium border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                  onChange={(e) =>
                    setEditedRange(editedRange, "title", e.target.value)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ConditionEditor
          conditions={editedRange.conditions ?? []}
          setConditions={handleSetConditions}
          form={form}
          fieldName={`${fieldName}.conditions`}
          facilityId={facilityId}
        />
        {interpretationType === InterpretationType.valuesets ? (
          <CustomValueSetEditor
            form={form}
            valuesetInterpretations={customValueSetInterpretations}
            setValuesetInterpretations={handleSetCustomValuesetInterpretations}
            fieldName={fieldName}
          />
        ) : (
          <NumericRangeEditor
            form={form}
            ranges={editedRange.ranges}
            setRanges={handleSetRanges}
            fieldName={fieldName}
          />
        )}
        <DefaultInterpretationComponent
          form={form}
          defaultInterpretation={editedRange.default_interpretation}
          setDefaultInterpretation={(value) =>
            setEditedRange(editedRange, "default_interpretation", value)
          }
          fieldName={`${fieldName}.default_interpretation`}
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 mt-auto border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          {t("cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isDisabled}
          className="w-full sm:w-auto"
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
