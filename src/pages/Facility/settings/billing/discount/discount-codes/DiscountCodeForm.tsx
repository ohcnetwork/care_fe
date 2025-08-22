import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

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

import { Code } from "@/types/base/code/code";

const formSchema = z.object({
  code: z.string().min(1, { message: "field_required" }),
  display: z.string().min(1, { message: "field_required" }),
});

interface DiscountCodeFormProps {
  defaultValues?: Code;
  onSubmit: (data: Code) => void;
}

export function DiscountCodeForm({
  defaultValues,
  onSubmit,
}: DiscountCodeFormProps) {
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: defaultValues?.code || "",
      display: defaultValues?.display || "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit({
            ...data,
            system: "http://ohc.network/codes/monetary/discount",
          }),
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="display"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {t("discount_code_name_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("code")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {t("discount_code_code_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" className="w-full">
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
