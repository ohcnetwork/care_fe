import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Interpretation } from "@/types/base/qualifiedRange/qualifiedRange";
import { Highlighter } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

export function InterpretationComponent<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  interpretation,
  setInterpretation,
  fieldName,
  disableDisplay = false,
}: {
  form: UseFormReturn<TFieldValues>;
  interpretation: Interpretation;
  setInterpretation: (interpretation: Interpretation) => void;
  fieldName: string;
  disableDisplay?: boolean;
}) {
  const { t } = useTranslation();
  const handleDisplayChange = (value: string) => {
    setInterpretation({
      ...interpretation,
      display: value,
    });
  };

  const handleHighlightChange = (value: boolean) => {
    setInterpretation({
      ...interpretation,
      highlight: value,
    });
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {!disableDisplay && (
        <FormField
          control={form.control}
          name={`${fieldName}.display` as any}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  {...field}
                  value={interpretation.display}
                  placeholder={t("display")}
                  className="h-8 text-xs"
                  onChange={(e) => handleDisplayChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <label className="inline-flex items-center gap-1.5 cursor-pointer shrink-0">
        <Switch
          checked={interpretation.highlight ?? false}
          onCheckedChange={handleHighlightChange}
        />
        <Highlighter className="size-3 text-gray-400" />
      </label>
    </div>
  );
}

export function DefaultInterpretationComponent<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  defaultInterpretation,
  setDefaultInterpretation,
  fieldName,
}: {
  form: UseFormReturn<TFieldValues>;
  defaultInterpretation?: Interpretation;
  setDefaultInterpretation: (
    interpretation: Interpretation | undefined,
  ) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();
  const isEnabled = !!defaultInterpretation;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      setDefaultInterpretation({ display: "", highlight: true });
    } else {
      setDefaultInterpretation(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("default_interpretation")}
        </h3>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      </div>
      <p className="text-xs text-gray-400">
        {t("default_interpretation_description")}
      </p>
      {isEnabled && defaultInterpretation && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5">
          <InterpretationComponent
            form={form}
            interpretation={defaultInterpretation}
            setInterpretation={setDefaultInterpretation}
            fieldName={fieldName}
            disableDisplay
          />
        </div>
      )}
    </div>
  );
}
