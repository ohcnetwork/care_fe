import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { WalletMinimal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ChargeItemDefinitionPicker } from "@/components/Common/ChargeItemDefinitionPicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { ScheduleTemplate } from "@/types/scheduling/schedule";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ScheduleChargeItemDefinitionSelectorProps {
  facilityId: string;
  scheduleTemplate: ScheduleTemplate;
  onChange: (value: {
    charge_item_definition_slug: string;
    re_visit_allowed_days: number;
    re_visit_charge_item_definition_slug: string | null;
  }) => void;
}

export default function ScheduleChargeItemDefinitionSelector({
  facilityId,
  scheduleTemplate,
  onChange,
}: ScheduleChargeItemDefinitionSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const scheduleChargeItemSchema = z.object({
    charge_item_definition: z
      .custom<ChargeItemDefinitionBase>()
      .refine((val) => val?.slug, { message: t("field_required") }),
    re_visit_allowed_days: z
      .number({ required_error: t("field_required") })
      .min(0, t("revisit_days_non_negative")),
    re_visit_charge_item_definition: z
      .custom<ChargeItemDefinitionBase>()
      .nullable(),
  });

  type FormValues = z.infer<typeof scheduleChargeItemSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleChargeItemSchema),
    defaultValues: {
      charge_item_definition: scheduleTemplate.charge_item_definition,
      re_visit_allowed_days: scheduleTemplate.revisit_allowed_days ?? undefined,
      re_visit_charge_item_definition:
        scheduleTemplate.revisit_charge_item_definition,
    },
  });

  const reVisitDays = form.watch("re_visit_allowed_days");
  const chargeItemDef = form.watch("charge_item_definition");

  useEffect(() => {
    if (!reVisitDays) {
      form.setValue("re_visit_charge_item_definition", null);
    }
  }, [reVisitDays, form]);

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({
        charge_item_definition: scheduleTemplate.charge_item_definition,
        re_visit_allowed_days: scheduleTemplate.revisit_allowed_days,
        re_visit_charge_item_definition:
          scheduleTemplate.revisit_charge_item_definition,
      });
    }
  };

  const onSubmit = (data: FormValues) => {
    onChange({
      charge_item_definition_slug: data.charge_item_definition?.slug ?? "",
      re_visit_allowed_days: data.re_visit_allowed_days,
      re_visit_charge_item_definition_slug:
        data.re_visit_charge_item_definition?.slug ?? null,
    });
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-full gap-2">
          <WalletMinimal className="size-4" />
          <span className="text-gray-950 font-medium">
            {t("manage_charges")}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[90%] sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("select_charge_item_definitions")}</SheetTitle>
          <SheetDescription>
            {t("select_or_create_charge_item_definitions")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="charge_item_definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("consultation_charge")}</FormLabel>
                  <FormControl>
                    <div className="mt-2 flex gap-2 flex-col sm:flex-row">
                      <ChargeItemDefinitionPicker
                        facilityId={facilityId}
                        value={field.value}
                        onValueChange={(def) => {
                          if (!def) {
                            field.onChange(null);
                            return;
                          }
                          const selected = Array.isArray(def) ? def[0] : def;
                          field.onChange(selected);
                        }}
                        placeholder={t("select_charge_item_definition")}
                        className="grow-1"
                        showCreateButton
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="re_visit_allowed_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("re_visit_allowed_days")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={reVisitDays ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          field.onChange(undefined);
                          return;
                        }
                        const parsed = Number(value);
                        if (!isNaN(parsed)) {
                          field.onChange(parsed);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="re_visit_charge_item_definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={!reVisitDays ? "text-gray-400" : ""}>
                    {t("re_visit_consultation_charge")}
                  </FormLabel>
                  <FormControl>
                    <div className="mt-2 flex gap-2 flex-col sm:flex-row">
                      <ChargeItemDefinitionPicker
                        facilityId={facilityId}
                        value={field.value ?? undefined}
                        onValueChange={(def) => {
                          const selected = Array.isArray(def) ? def[0] : def;
                          field.onChange(selected ?? null);
                        }}
                        placeholder={t("select_charge_item_definition")}
                        className="grow-1"
                        showCreateButton
                        disabled={!reVisitDays}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 border-t pt-4 sticky bottom-0 bg-white">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={!chargeItemDef}
              >
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
