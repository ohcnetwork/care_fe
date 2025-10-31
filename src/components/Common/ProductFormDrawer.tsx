import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { ChargeItemDefinitionPicker } from "@/components/Common/ChargeItemDefinitionPicker";

import mutate from "@/Utils/request/mutate";
import {
  ProductCreate,
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";

const formSchema = z.object({
  lot_number: z.string().min(1, "Lot/Batch number is required"),
  expiration_date: z.date({
    required_error: "Expiration date is required",
  }),
  charge_item_definition: z.string().optional(),
});

interface ProductFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  productKnowledgeSlug: string;
  receivingItem?: string;
  quantity?: string;
  onSuccess?: (product: ProductRead) => void;
}

export function ProductFormDrawer({
  open,
  onOpenChange,
  facilityId,
  productKnowledgeSlug,
  receivingItem = "",
  quantity = "",
  onSuccess,
}: ProductFormDrawerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lot_number: "",
      expiration_date: undefined,
      charge_item_definition: "",
    },
  });

  const { mutate: createProduct, isPending } = useMutation({
    mutationFn: mutate(productApi.createProduct, {
      pathParams: { facilityId },
    }),
    onSuccess: (product: ProductRead) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("product_created_successfully"));
      onSuccess?.(product);
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error(t("error_creating_product"));
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const formattedData = {
      ...data,
      expiration_date: format(data.expiration_date, "yyyy-MM-dd"),
    };

    const createPayload: ProductCreate = {
      status: ProductStatusOptions.active,
      batch: {
        lot_number: formattedData.lot_number,
      },
      expiration_date: formattedData.expiration_date,
      product_knowledge: productKnowledgeSlug,
      charge_item_definition: formattedData.charge_item_definition || undefined,
    };

    createProduct(createPayload);
  }

  function handleCancel() {
    form.reset();
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col px-8">
        <DrawerHeader className="relative flex-shrink-0">
          <div className="max-w-4xl mx-auto w-full relative">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
            <DrawerTitle className="text-left">
              {t("add_lot_expiry")}
            </DrawerTitle>
            <DrawerDescription className="text-left">
              {t("add_lot_expiry_link_charge_item_description")}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="max-w-4xl mx-auto w-full px-4 flex-1 overflow-y-auto pb-4">
          {/* Receiving Item and Quantity Display */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t("receiving_item")}
              </p>
              <p className="text-xl font-bold text-gray-900">{receivingItem}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t("quantity")}
              </p>
              <p className="text-xl font-bold text-gray-900">{quantity}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* Create new lot/expiry section */}
              <div className="flex flex-col gap-2 bg-gray-100 py-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <h3 className="border-l-4 border-blue-500 pl-2 mt-2 text-base font-semibold text-gray-900">
                    {t("create_new_lot_expiry")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 px-3">
                  <FormField
                    control={form.control}
                    name="lot_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t("lot_batch_number")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder=""
                            {...field}
                            className="border-gray-300 h-11 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t("expiry_date")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={
                              field.value
                                ? format(field.value, "yyyy-MM-dd")
                                : ""
                            }
                            onChange={(e) => {
                              field.onChange(new Date(e.target.value));
                            }}
                            className="w-full border-gray-300 h-11 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Charge Item for Billing section */}
              <div className="flex flex-col gap-2 bg-gray-100 py-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <h3 className="border-l-4 border-blue-500 pl-2 mt-2 text-base font-semibold text-gray-900">
                    {t("charge_item_for_billing")}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed px-3">
                  {t("charge_item_for_billing_description")}
                </p>

                <div className="px-3">
                  <FormField
                    control={form.control}
                    name="charge_item_definition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t("charge_item")}
                        </FormLabel>
                        <FormControl>
                          <ChargeItemDefinitionPicker
                            facilityId={facilityId}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select charge item definition"
                            className="w-full h-11 text-base"
                            showCreateButton={true}
                            showCopyButton={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>

        <DrawerFooter className="max-w-4xl mx-auto w-full flex-row justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-11 px-6 text-base"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
            className="h-11 px-6 text-base font-medium"
          >
            {isPending ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                {t("saving")}...
              </>
            ) : (
              <>
                <CareIcon icon="l-check" className="mr-2 h-4 w-4" />
                {t("confirm_add_lot")}
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
