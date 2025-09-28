import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";

import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { SupplyRequestStatus } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import mutate from "@/Utils/request/mutate";

const supplyRequestFormSchema = z.object({
  requests: z.array(
    z.object({
      item: z.object({
        id: z.string().min(1, "Item ID is required"),
        name: z.string().min(1, "Item name is required"),
      }),
      quantity: z.number().min(1, "Quantity must be at least 1"),
    }),
  ),
});

type SupplyRequestFormValues = z.infer<typeof supplyRequestFormSchema>;

interface AddItemsFormProps {
  requestOrderId: string;
  onSuccess: () => void;
}

export function AddItemsForm({ requestOrderId, onSuccess }: AddItemsFormProps) {
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
      requests: Array<{ item: { id: string; name: string }; quantity: number }>,
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

  function handleAddItem(product: ProductKnowledgeBase) {
    append({
      item: {
        id: product.id,
        name: product.name,
      },
      quantity: 1,
    });
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmitSupplyRequests)}
          className="space-y-4"
        >
          <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
            <Table className="rounded-lg border shadow-sm w-full bg-white">
              <TableHeader className="bg-gray-100">
                <TableRow className="border-b">
                  <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                    {t("item")}
                  </TableHead>
                  <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                    {t("quantity")}
                  </TableHead>
                  <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-[100px]">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {fields.map((field, index) => {
                  const itemData = form.getValues(`requests.${index}.item`);

                  return (
                    <TableRow
                      key={field.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="border-x p-3">
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
                      <TableCell className="border-x p-3">
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
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="w-20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="border-x p-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 0}
                        >
                          {t("remove")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="my-4">
            <ProductKnowledgeSelect
              onChange={handleAddItem}
              className="text-primary-800 border-primary-600"
              placeholder={t("add_item")}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
              }}
            >
              {t("clear_form")}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? t("creating") : t("add_items")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
