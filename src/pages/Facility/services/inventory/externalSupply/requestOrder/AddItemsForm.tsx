import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";

import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { RequestOrderStatus } from "@/types/inventory/requestOrder/requestOrder";
import { SupplyRequestStatus } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { zodDecimal } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { Box, Check, Trash2 } from "lucide-react";

const supplyRequestFormSchema = z.object({
  requests: z.array(
    z.object({
      item: z.object({
        id: z.string().min(1, "Item ID is required"),
        name: z.string().min(1, "Item name is required"),
      }),
      quantity: zodDecimal({ min: 1 }),
    }),
  ),
});

type SupplyRequestFormValues = z.infer<typeof supplyRequestFormSchema>;

interface AddItemsFormProps {
  requestOrderId: string;
  onSuccess: () => void;
  updateOrderStatus: (status: RequestOrderStatus) => void;
  disableApproveButton: boolean;
  showEmptyState: boolean;
}

export function AddItemsForm({
  requestOrderId,
  onSuccess,
  updateOrderStatus,
  disableApproveButton,
  showEmptyState,
}: AddItemsFormProps) {
  const { t } = useTranslation();

  const form = useForm<SupplyRequestFormValues>({
    resolver: zodResolver(supplyRequestFormSchema),
    defaultValues: {
      requests: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requests",
  });

  const { mutate: createSupplyRequests, isPending: isCreating } = useMutation({
    mutationFn: async (
      requests: Array<{ item: { id: string; name: string }; quantity: string }>,
    ) => {
      const promises = requests.map((request) =>
        mutate(supplyRequestApi.createSupplyRequest)({
          item: request.item.id,
          quantity: request.quantity,
          status: SupplyRequestStatus.active,
          order: requestOrderId,
        }),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(t("supply_requests_created"));
      form.reset();
      onSuccess();
    },
    onError: (_error) => {
      toast.error(t("error_creating_supply_requests"));
    },
  });

  function onSubmitSupplyRequests(data: SupplyRequestFormValues) {
    if (data.requests.length === 0) {
      toast.error(t("no_items_to_add"));
      return;
    }
    createSupplyRequests(data.requests);
  }

  function handleAddItem(product: ProductKnowledgeBase | undefined) {
    if (!product) return;

    append({
      item: {
        id: product.id,
        name: product.name,
      },
      quantity: "1",
    });
  }

  return (
    <div className="space-y-2">
      {showEmptyState && fields.length === 0 && (
        <EmptyState
          icon={<Box className="text-primary size-5" />}
          title={t("no_supply_requests_found")}
          description={t("add_items_to_get_started")}
          action={
            <ProductKnowledgeSelect
              onChange={handleAddItem}
              className="text-primary-800 border-primary-600"
              placeholder={t("add_from_item_list")}
              disableFavorites
            />
          }
        />
      )}
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitSupplyRequests)}>
            {fields.length > 0 && (
              <div className="mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("item")}</TableHead>
                      <TableHead>{t("quantity")}</TableHead>
                      <TableHead className="w-28">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const itemData = form.getValues(`requests.${index}.item`);

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            {itemData?.name ? (
                              <div className="font-medium text-gray-900">
                                {itemData.name}
                              </div>
                            ) : (
                              <div className="text-gray-500 italic">
                                {t("no_product_selected")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`requests.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      {...field}
                                      className="w-20"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => remove(index)}
                              disabled={fields.length === 0}
                            >
                              <Trash2 />
                              {t("remove")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <ProductKnowledgeSelect
              onChange={handleAddItem}
              className="text-secondary-800 border-secondary-600 w-64! h-11 text-md"
              placeholder={t("add_item")}
              disableFavorites
            />

            {fields.length > 0 ? (
              <>
                <Separator className="my-2 bg-gray-200" />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || fields.length === 0}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isCreating ? t("creating") : t("save_list")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <p>-{t("or")}-</p>
                <div className="flex flex-row gap-2 justify-between bg-white p-2 items-center border border-gray-200 rounded-md">
                  <div className="flex flex-col gap-2">
                    <p className="font-bold">
                      {t("review_and_finalise_request")}
                    </p>
                    <span className="text-sm text-gray-500">
                      {t("review_and_finalise_request_description")}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      updateOrderStatus(RequestOrderStatus.pending)
                    }
                    disabled={disableApproveButton}
                  >
                    {t("mark_as_approved")}
                    <ShortcutBadge actionId="mark-as" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
