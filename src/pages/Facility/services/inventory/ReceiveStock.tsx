import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { EmptyState } from "@/components/definition-list/EmptyState";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { ProductSearch } from "@/pages/Facility/services/inventory/ProductSearch";
import { SupplierSelect } from "@/pages/Facility/services/inventory/SupplierSelect";
import {
  SupplyDeliveryCreate,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { Organization } from "@/types/organization/organization";

const objectReference = z.object({ id: z.string(), name: z.string() });

const receiveStockSchema = z.object({
  supplier: objectReference.nullable(),
  entries: z
    .array(
      z.object({
        supplied_item: objectReference,
        supplied_item_quantity: z.number().min(1),
        lot_number: z.string().optional(),
        expiration_date: z.string().optional(),
      }),
    )
    .min(1),
});

export function ReceiveStock({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(receiveStockSchema),
    defaultValues: {
      supplier: null,
      entries: [],
    },
  });

  const batchRequest = useMutation({
    mutationFn: mutate(routes.batchRequest),
    onSuccess: () => {
      toast.success(t("stock_received"));
      form.reset();
      navigate("/external_supply/incoming_deliveries/approve");
    },
    onError: () => {
      toast.error(t("error_receiving_stock"));
    },
  });

  function onSubmit(data: z.infer<typeof receiveStockSchema>) {
    batchRequest.mutate({
      requests: data.entries.map((entry) => ({
        url: supplyDeliveryApi.createSupplyDelivery.path,
        method: supplyDeliveryApi.createSupplyDelivery.method,
        reference_id: `supplied-item-${entry.supplied_item.id}`,
        body: {
          supplier: data.supplier?.id,
          destination: locationId,
          supplied_item: entry.supplied_item.id,
          supplied_item_quantity: entry.supplied_item_quantity,
          status: SupplyDeliveryStatus.completed,
          supplied_item_type: SupplyDeliveryType.product,
        } satisfies SupplyDeliveryCreate,
      })),
    });
  }

  const entries = form.watch("entries");

  const removeEntry = (index: number) => {
    form.setValue(
      "entries",
      entries.filter((_, i) => i !== index),
    );
  };

  return (
    <Page
      title={t("receive_stock")}
      className="flex flex-col gap-4 mx-auto max-w-3xl"
    >
      <Separator className="my-4" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("supplier")}</FormLabel>
                <FormControl className="max-w-sm">
                  <SupplierSelect
                    value={field.value as Organization}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium">{t("products")}</h3>
            <div className="flex w-full gap-2">
              <ProductSearch
                facilityId={facilityId}
                onChange={(product) => {
                  // Skip if product already exists
                  if (
                    entries.some(
                      (entry) => entry.supplied_item.id === product.id,
                    )
                  ) {
                    toast.info(t("product_is_already_in_the_list"));
                    return;
                  }

                  form.setValue("entries", [
                    ...entries,
                    {
                      supplied_item: {
                        id: product.id,
                        name: product.product_knowledge.name,
                      },
                      supplied_item_quantity: 1,
                      lot_number: product.batch?.lot_number,
                      expiration_date: product.expiration_date,
                    },
                  ]);
                }}
              />
            </div>

            {entries.length === 0 ? (
              <EmptyState
                icon="l-box"
                title={t("no_products_added")}
                description={t("add_products_to_receive")}
              />
            ) : (
              <Card className="mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("product")}</TableHead>
                      <TableHead>{t("quantity")}</TableHead>
                      <TableHead>{t("lot")}</TableHead>
                      <TableHead>{t("expires")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={entry.supplied_item.id}>
                        <TableCell>{entry.supplied_item.name}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`entries.${index}.supplied_item_quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="w-32"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>{entry.lot_number || "-"}</TableCell>
                        <TableCell>
                          {entry.expiration_date
                            ? new Date(
                                entry.expiration_date,
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEntry(index)}
                          >
                            <CareIcon icon="l-trash-alt" className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>

          <Button
            type="submit"
            className="mt-4"
            disabled={batchRequest.isPending || entries.length === 0}
          >
            {t("submit")}
          </Button>
        </form>
      </Form>
    </Page>
  );
}
