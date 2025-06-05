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

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { CodeSchema } from "@/types/base/code/code";
import {
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";

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
}

export function DiscountMonetaryComponentForm({
  defaultValues,
  onSubmit,
}: DiscountMonetaryComponentFormProps) {
  const { t } = useTranslation();
  const [valueType, setValueType] = useState<"factor" | "amount">(
    defaultValues?.factor != null ? "factor" : "amount",
  );

  const { facility } = useCurrentFacility();
  const discountCodes = [
    ...(facility?.instance_discount_codes || []),
    ...(facility?.discount_codes || []),
  ];

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {t("discount_component_name_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>{t("discount_factor_or_amount")}</FormLabel>
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
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
                <SelectItem value="factor">{t("factor")}</SelectItem>
                <SelectItem value="amount">{t("amount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormDescription>
            {valueType === "factor"
              ? t("discount_factor_description", {
                  min: 0,
                  max: 100,
                })
              : t("discount_amount_description")}
          </FormDescription>
          <FormMessage />
        </FormItem>

        <div className="space-y-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("discount_code")}</FormLabel>
                <FormControl>
                  <Autocomplete
                    options={discountCodes.map((code) => ({
                      label: `${code.display} (${code.code})`,
                      value: code.code,
                    }))}
                    value={field.value?.code ?? ""}
                    onChange={(value) => {
                      if (value === "") {
                        form.setValue("code", null);
                        return;
                      }
                      form.setValue(
                        "code",
                        discountCodes.find((code) => code.code === value),
                      );
                    }}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  {t("discount_component_code_description")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full">
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
