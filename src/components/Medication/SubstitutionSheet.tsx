import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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

interface SubstitutionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalProductKnowledge: ProductKnowledgeBase | undefined;
  currentSubstitution?: {
    substitutedProductKnowledge?: ProductKnowledgeBase;
    type?: SubstitutionType;
    reason?: SubstitutionReason;
  };
  onSave: (
    substitutionDetails?: {
      substitutedProductKnowledge: ProductKnowledgeBase;
      type: SubstitutionType;
      reason: SubstitutionReason;
    } | null, // null to clear substitution
  ) => void;
  facilityId: string;
}

const substitutionSchema = z.object({
  substitutedProductKnowledge: z.any().refine((val) => val?.slug, {
    message: "Product selection is required",
  }),
  type: z.nativeEnum(SubstitutionType),
  reason: z.nativeEnum(SubstitutionReason),
});

type SubstitutionFormValues = z.infer<typeof substitutionSchema>;

export function SubstitutionSheet({
  open,
  onOpenChange,
  originalProductKnowledge,
  currentSubstitution,
  onSave,
  facilityId: _facilityId,
}: SubstitutionSheetProps) {
  const { t } = useTranslation();
  const [selectedSubstitute, setSelectedSubstitute] = useState<
    ProductKnowledgeBase | undefined
  >(currentSubstitution?.substitutedProductKnowledge);

  const form = useForm<SubstitutionFormValues>({
    resolver: zodResolver(substitutionSchema),
    defaultValues: {
      substitutedProductKnowledge:
        currentSubstitution?.substitutedProductKnowledge || undefined,
      type: currentSubstitution?.type || SubstitutionType.E,
      reason: currentSubstitution?.reason || SubstitutionReason.OS,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        substitutedProductKnowledge:
          currentSubstitution?.substitutedProductKnowledge || undefined,
        type: currentSubstitution?.type || SubstitutionType.E,
        reason: currentSubstitution?.reason || SubstitutionReason.OS,
      });
      setSelectedSubstitute(currentSubstitution?.substitutedProductKnowledge);
      // No need to set search term anymore
    }
  }, [open, currentSubstitution, form]);

  useEffect(() => {
    form.setValue("substitutedProductKnowledge", selectedSubstitute, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedSubstitute, form]);

  const onSubmit = (values: SubstitutionFormValues) => {
    if (!values.substitutedProductKnowledge) return;
    onSave({
      substitutedProductKnowledge: values.substitutedProductKnowledge,
      type: values.type,
      reason: values.reason,
    });
    onOpenChange(false);
  };

  const handleProductSelect = (product: ProductKnowledgeBase | undefined) => {
    if (!product) return;
    setSelectedSubstitute(product);
  };

  if (!originalProductKnowledge) return null;

  const handleClearSubstitution = () => {
    onSave(null); // Pass null to indicate clearing
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-2xl">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-xl font-semibold">
            {t("substitute_medication")}
          </SheetTitle>
          <SheetDescription className="text-base">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{t("substituting_for")}:</span>
                <Badge variant="secondary">
                  {originalProductKnowledge.name}
                </Badge>
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
              {/* Product Selection */}
              <FormField
                control={form.control}
                name="substitutedProductKnowledge"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      {t("select_substitute_product")}
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>

                    <div className="space-y-3">
                      <ProductKnowledgeSelect
                        value={selectedSubstitute}
                        onChange={handleProductSelect}
                        placeholder={t("search_substitute_medications")}
                        className="w-full"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Substitution Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      {t("substitution_type")}
                      <span className="text-destructive ml-1">*</span>
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
                      <SelectContent className="max-w-[var(--radix-select-trigger-width)] w-full">
                        {Object.values(SubstitutionType).map((type) => (
                          <SelectItem key={type} value={type} className="py-3">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {getSubstitutionTypeDisplay(t, type)}
                              </p>
                              <p className="text-xs text-muted-foreground">
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

              {/* Substitution Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      {t("substitution_reason")}
                      <span className="text-destructive ml-1">*</span>
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
                      <SelectContent className="max-w-[var(--radix-select-trigger-width)] w-full">
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
                              <p className="text-xs text-muted-foreground">
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
                onClick={handleClearSubstitution}
                disabled={
                  !currentSubstitution?.substitutedProductKnowledge &&
                  !selectedSubstitute
                }
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
                disabled={!form.formState.isValid || !selectedSubstitute}
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
