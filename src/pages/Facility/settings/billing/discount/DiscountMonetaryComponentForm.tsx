import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { Code, CodeSchema } from "@/types/questionnaire/code";

const formSchema = z
  .object({
    monetary_component_type: z.literal(MonetaryComponentType.discount),
    code: CodeSchema.nullable().optional(),
    factor: z.number().min(0).max(100).nullable().optional(),
    amount: z.number().min(0).nullable().optional(),
    title: z.string().min(1, { message: "field_required" }),
  })
  .refine((data) => data.factor != null || data.amount != null, {
    message: "Either factor or amount must be provided",
    path: ["factor", "amount"],
  })
  .refine(
    (data) => {
      // If there's a code, it must have a display value
      return data.code == null || data.code.display.length > 0;
    },
    {
      message: "Display text is required for custom codes",
      path: ["code"],
    },
  );

interface DiscountMonetaryComponentFormProps {
  defaultValues?: MonetaryComponentRead;
  onSubmit: (data: MonetaryComponentRead) => void;
  systemCodes: Code[];
  facilityCodes: Code[];
}

export function DiscountMonetaryComponentForm({
  defaultValues,
  onSubmit,
  systemCodes,
  facilityCodes,
}: DiscountMonetaryComponentFormProps) {
  const { t } = useTranslation();
  const [valueType, setValueType] = useState<"factor" | "amount">(
    defaultValues?.factor != null ? "factor" : "amount",
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monetary_component_type: MonetaryComponentType.discount,
      code: defaultValues?.code || null,
      factor: defaultValues?.factor || null,
      amount: defaultValues?.amount || null,
      title: defaultValues?.title || "",
    },
  });

  const handleValueTypeChange = (value: "factor" | "amount") => {
    setValueType(value);
    if (value === "factor") {
      form.setValue("amount", null);
    } else {
      form.setValue("factor", null);
    }
  };

  const isExistingCode = (code: Code) => {
    return (
      (systemCodes.find((c) => c.code === code.code) ??
        facilityCodes.find((c) => c.code === code.code)) != null
    );
  };

  const currentCode = form.watch("code");
  const isCustomCode = currentCode != null && !isExistingCode(currentCode);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("billing.component_title")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>{t("billing.value")}</FormLabel>
          <div className="flex gap-1">
            <div className="flex-2">
              {valueType === "factor" ? (
                <FormField
                  control={form.control}
                  name="factor"
                  render={({ field }) => (
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          value={field.value === null ? "" : field.value}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          value={field.value === null ? "" : field.value}
                          className="pl-8"
                        />
                      </div>
                    </FormControl>
                  )}
                />
              )}
            </div>
            <Select value={valueType} onValueChange={handleValueTypeChange}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="factor">{t("billing.factor")}</SelectItem>
                <SelectItem value="amount">{t("billing.amount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormDescription>
            {valueType === "factor"
              ? t("billing.factor_range_description")
              : t("billing.amount_min_description")}
          </FormDescription>
          <FormMessage />
        </FormItem>

        <div className="space-y-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("billing.component_code")}</FormLabel>
                <FormControl>
                  <Autocomplete
                    options={[...systemCodes, ...facilityCodes].map((code) => ({
                      label: code.display,
                      value: code.code,
                    }))}
                    value={field.value?.code ?? ""}
                    onChange={(value) => {
                      if (value === "") {
                        form.setValue("code", null);
                        return;
                      }

                      // Check if the code is already in the system or facility codes
                      const existingCode =
                        systemCodes.find((code) => code.code === value) ??
                        facilityCodes.find((code) => code.code === value);

                      if (existingCode) {
                        form.setValue("code", existingCode);
                        return;
                      }

                      // If the code is not in the system or facility codes, it's a custom code
                      form.setValue("code", {
                        code: value,
                        display: "",
                        system: "http://ohc.network/codes/monetary/discount",
                      });
                    }}
                    noOptionsMessage={`Create a new code for '${form.getValues("code.code")}'`}
                    freeInput
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isCustomCode && (
            <FormField
              control={form.control}
              name="code.display"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Display label for the code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full">
            {isCustomCode ? t("save_and_create_discount_code") : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
