import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";

import {
  SubstitutionReason,
  SubstitutionType,
  getSubstitutionReasonDescription,
  getSubstitutionReasonDisplay,
  getSubstitutionTypeDescription,
  getSubstitutionTypeDisplay,
} from "@/types/emr/medicationDispense/medicationDispense";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

export const substitutionSchema = z.object({
  substitutedProductKnowledge: z
    .custom<ProductKnowledgeBase>()
    .refine((value) => value !== undefined, {
      message: "Substituted product knowledge is required",
    }),
  type: z.enum(SubstitutionType),
  reason: z.enum(SubstitutionReason),
});

export type SubstitutionFormValues = z.infer<typeof substitutionSchema>;

interface SubstitutionSheetProps {
  original: {
    /** Used when original product knowledge exists */
    productKnowledge?: ProductKnowledgeBase | null;
    /** Used when no original product knowledge exists (e.g., medication without linked product) */
    medicationName?: string | null;
  };
  initialValue?: SubstitutionFormValues | null;
  onSave: (value: SubstitutionFormValues) => void;
  onClear: () => void;
  trigger?: React.ReactNode;
}

export function SubstitutionSheet({
  original,
  initialValue,
  onSave,
  onClear,
  trigger,
}: SubstitutionSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const defaultValues = useMemo(() => {
    return (
      initialValue ?? {
        substitutedProductKnowledge: undefined,
        type: SubstitutionType.E,
        reason: SubstitutionReason.OS,
      }
    );
  }, [initialValue]);

  const form = useForm<SubstitutionFormValues>({
    resolver: zodResolver(substitutionSchema),
    defaultValues,
  });

  const onSubmit = (values: SubstitutionFormValues) => {
    onSave(values);
    setOpen(false);
    form.reset();
  };

  const displayName =
    original?.productKnowledge?.name || original?.medicationName;

  const handleClear = () => {
    onClear();
    setOpen(false);
    form.reset();
  };

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || <Button variant="outline">{t("sub")}</Button>}
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-2xl">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-xl font-semibold">
            {t("substitute_medication")}
          </SheetTitle>
          <SheetDescription className="text-base" asChild>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{t("substituting_for")}:</span>
                <Badge variant="secondary">{displayName}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("select_alternative_medication_and_provide_details")}
              </p>
            </div>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="substitutedProductKnowledge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium" aria-required>
                      {t("select_substitute_product")}
                    </FormLabel>
                    <ProductKnowledgeSelect
                      {...field}
                      placeholder={t("search_substitute_medications")}
                      className="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium" aria-required>
                      {t("substitution_type")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 border-gray-300">
                          <SelectValue placeholder={t("select")}>
                            {field.value
                              ? getSubstitutionTypeDisplay(t, field.value)
                              : t("select")}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-(--radix-select-trigger-width) w-full">
                        {Object.values(SubstitutionType).map((type) => (
                          <SelectItem key={type} value={type} className="py-3">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {getSubstitutionTypeDisplay(t, type)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {getSubstitutionTypeDescription(t, type)}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium" aria-required>
                      {t("substitution_reason")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 border-gray-300">
                          <SelectValue placeholder={t("select")}>
                            {field.value
                              ? getSubstitutionReasonDisplay(t, field.value)
                              : t("select")}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-(--radix-select-trigger-width) w-full">
                        {Object.values(SubstitutionReason).map((reason) => (
                          <SelectItem
                            key={reason}
                            value={reason}
                            className="py-3"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {getSubstitutionReasonDisplay(t, reason)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {getSubstitutionReasonDescription(t, reason)}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="border-t pt-6">
          <div className="flex w-full justify-between gap-3">
            <div className="flex gap-3 flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={!initialValue}
                className="flex-1 sm:flex-initial"
              >
                {t("clear")}
              </Button>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 sm:flex-initial"
                >
                  {t("cancel")}
                </Button>
              </SheetClose>
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={!form.formState.isValid}
                className="flex-1 sm:flex-initial"
              >
                {t("save")}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
