import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { WalletMinimal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { ScheduleTemplate } from "@/types/scheduling/schedule";

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

  const chargeItemDefinitionSchema = z
    .object({
      charge_item_definition: z
        .custom<ChargeItemDefinitionBase>()
        .refine((val) => val !== undefined, {
          message: t("required"),
        }),
      reVisitDays: z
        .union([z.number(), z.nan()])
        .refine((val) => !isNaN(val) && val >= 0, {
          message: t("must_be_greater_than_value", { value: 0 }),
        }),
      re_visit_charge_item_definition: z
        .custom<ChargeItemDefinitionBase>()
        .optional(),
    })
    .refine(
      (data) => {
        if (data.reVisitDays > 0) {
          return data.re_visit_charge_item_definition !== undefined;
        }
        return true;
      },
      {
        message: t("revisit_charge_def_required"),
        path: ["re_visit_charge_item_definition"],
      },
    );

  type ChargeItemDefinitionFormValues = z.infer<
    typeof chargeItemDefinitionSchema
  >;

  const form = useForm<ChargeItemDefinitionFormValues>({
    resolver: zodResolver(chargeItemDefinitionSchema),
    defaultValues: {
      charge_item_definition: scheduleTemplate.charge_item_definition,
      re_visit_charge_item_definition:
        scheduleTemplate.revisit_charge_item_definition,
      reVisitDays: scheduleTemplate.revisit_allowed_days,
    },
  });

  const reVisitDays = form.watch("reVisitDays");
  const reVisitChargeItemDefinition = form.watch(
    "re_visit_charge_item_definition",
  );

  useEffect(() => {
    if (reVisitDays === 0 || !reVisitDays) {
      form.setValue("re_visit_charge_item_definition", undefined, {
        shouldValidate: true,
      });
    }
  }, [reVisitDays]);

  const handleSubmit = (values: ChargeItemDefinitionFormValues) => {
    onChange({
      charge_item_definition_slug: values.charge_item_definition.slug,
      re_visit_allowed_days: values.reVisitDays,
      re_visit_charge_item_definition_slug:
        values.re_visit_charge_item_definition?.slug || null,
    });
    setIsOpen(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({
        charge_item_definition: scheduleTemplate.charge_item_definition,
        re_visit_charge_item_definition:
          scheduleTemplate.revisit_charge_item_definition,
        reVisitDays: scheduleTemplate.revisit_allowed_days,
      });
    }
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
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-6 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="charge_item_definition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("consulation charge")}</FormLabel>
                      <FormControl>
                        <div className="mt-2 flex gap-2 flex-col sm:flex-row">
                          <ChargeItemDefinitionPicker
                            facilityId={facilityId}
                            value={field.value}
                            onValueChange={(selectedDef) => {
                              field.onChange(
                                selectedDef as
                                  | ChargeItemDefinitionBase
                                  | undefined,
                              );
                            }}
                            placeholder={t("select_charge_item_definition")}
                            className="grow-1"
                            showCreateButton={true}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reVisitDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("re_visit_allowed_days")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                          }}
                          placeholder={t("enter_re_visit_allowed_days")}
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
                      <FormLabel>{t("re_visit_consultation_charge")}</FormLabel>
                      <FormControl>
                        <div className="mt-2 flex gap-2 flex-col sm:flex-row">
                          <ChargeItemDefinitionPicker
                            facilityId={facilityId}
                            value={reVisitChargeItemDefinition}
                            onValueChange={(selectedDef) => {
                              field.onChange(
                                selectedDef as
                                  | ChargeItemDefinitionBase
                                  | undefined,
                              );
                            }}
                            placeholder={t("select_charge_item_definition")}
                            className="flex-1"
                            showCreateButton={true}
                            disabled={reVisitDays === 0 || !reVisitDays}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={!form.getValues("charge_item_definition")}
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
