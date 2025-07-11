import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import {
  SubstitutionReason,
  SubstitutionType,
  getSubstitutionReasonDescription,
  getSubstitutionReasonDisplay,
  getSubstitutionTypeDescription,
  getSubstitutionTypeDisplay,
} from "@/types/emr/medicationDispense/medicationDispense";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

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
  substitutedProductKnowledge: z.any().refine((val) => val?.id, {
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
  facilityId,
}: SubstitutionSheetProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubstitute, setSelectedSubstitute] = useState<
    ProductKnowledgeBase | undefined
  >(currentSubstitution?.substitutedProductKnowledge);
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const form = useForm<SubstitutionFormValues>({
    resolver: zodResolver(substitutionSchema),
    defaultValues: {
      substitutedProductKnowledge:
        currentSubstitution?.substitutedProductKnowledge || undefined,
      type: currentSubstitution?.type,
      reason: currentSubstitution?.reason,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        substitutedProductKnowledge:
          currentSubstitution?.substitutedProductKnowledge || undefined,
        type: currentSubstitution?.type,
        reason: currentSubstitution?.reason,
      });
      setSelectedSubstitute(currentSubstitution?.substitutedProductKnowledge);
      setSearchTerm(
        currentSubstitution?.substitutedProductKnowledge?.name || "",
      );
    }
  }, [open, currentSubstitution, form]);

  useEffect(() => {
    form.setValue("substitutedProductKnowledge", selectedSubstitute, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedSubstitute, form]);

  const { data: productKnowledges, isLoading: isProductLoading } = useQuery({
    queryKey: ["productKnowledge", "medication", searchTerm, facilityId],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 20,
        offset: 0,
        name: searchTerm,
        product_type: "medication",
        status: "active",
      },
    }),
    enabled: searchTerm.length >= 3,
  });

  const onSubmit = (values: SubstitutionFormValues) => {
    if (!values.substitutedProductKnowledge) return;
    onSave({
      substitutedProductKnowledge: values.substitutedProductKnowledge,
      type: values.type,
      reason: values.reason,
    });
    onOpenChange(false);
  };

  const handleProductSelect = (product: ProductKnowledgeBase) => {
    setSelectedSubstitute(product);
    setSearchTerm(product.name);
    setProductPopoverOpen(false);
  };

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setProductPopoverOpen(isOpen);
    if (!isOpen) {
      setSearchTerm(selectedSubstitute?.name || "");
    }
  };

  const renderProductSelector = (className?: string) => {
    return (
      <Command className={className}>
        <div className="flex flex-col px-3 py-2 border-b sticky top-0 bg-white z-10">
          <span className="font-semibold text-base text-gray-900">
            {t("search_substitute_medications")}
          </span>
          <span className="text-sm text-gray-500 mt-0.5">
            {t("type_at_least_3_characters_to_search")}
          </span>
        </div>
        <div className="flex items-center border-b px-3 sticky top-[48px] bg-white z-10">
          <CommandInput
            placeholder={t("search_products")}
            onValueChange={setSearchTerm}
            value={searchTerm}
            className="border-none focus:ring-0"
          />
        </div>
        <CommandList
          className="max-h-[calc(100vh-20rem)]"
          onWheel={(e) => e.stopPropagation()}
        >
          <CommandEmpty>
            {isProductLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">
                  {t("searching")}
                </span>
              </div>
            ) : searchTerm.length < 3 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">
                  {t("type_at_least_3_characters_to_search")}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-medium">{t("no_products_found")}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("try_different_search_terms")}
                </p>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {!isProductLoading &&
              productKnowledges?.results?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleProductSelect(product)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center">
                    <span>{product.name}</span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
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
                      {/* Product Selector Button */}
                      {isMobile ? (
                        <>
                          <Sheet
                            open={productPopoverOpen}
                            onOpenChange={setProductPopoverOpen}
                          >
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={productPopoverOpen}
                                className="w-full justify-between h-12 border border-gray-300"
                                type="button"
                              >
                                <span className="truncate text-left">
                                  {selectedSubstitute
                                    ? selectedSubstitute.name
                                    : t("search_and_select_product")}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0" side="bottom">
                              {renderProductSelector("mb-12")}
                            </SheetContent>
                          </Sheet>
                        </>
                      ) : (
                        <Popover
                          open={productPopoverOpen}
                          onOpenChange={handlePopoverOpenChange}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productPopoverOpen}
                              className="w-full justify-between h-12 border border-gray-300"
                              type="button"
                            >
                              <span className="truncate text-left">
                                {selectedSubstitute
                                  ? selectedSubstitute.name
                                  : t("search_and_select_product")}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            sideOffset={4}
                            className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[80vh] overflow-auto"
                          >
                            {renderProductSelector()}
                          </PopoverContent>
                        </Popover>
                      )}
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
