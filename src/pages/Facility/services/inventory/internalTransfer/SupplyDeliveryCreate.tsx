import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";

import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";

import Autocomplete from "@/components/ui/autocomplete";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import locationApi from "@/types/location/locationApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDate } from "date-fns";

const supplyDeliveryItemSchema = z.object({
  supplied_inventory_item: z.string().min(1, "Inventory item is required"),
  supplied_item_quantity: z.number().min(1, "Quantity must be at least 1"),
  product_knowledge: z
    .custom<ProductKnowledgeBase>()
    .refine((data) => data?.slug, {
      message: "Item is required",
    }),
});

const createFormSchema = z.object({
  supplied_item_type: z.nativeEnum(SupplyDeliveryType),
  destination: z.string().min(1, "Destination location is required"),
  items: z
    .array(supplyDeliveryItemSchema)
    .min(1, "At least one item is required"),
  supply_request: z.string().optional(),
});

interface Props {
  facilityId: string;
  locationId: string;
  supplyDeliveryId?: string;
  supplyRequestId?: string;
}

export default function SupplyDeliveryCreate({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const title = t("create_supply_delivery");
  const pageDescription = t("supply_delivery_description");
  const returnPath = `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_dispatch`;

  const queryClient = useQueryClient();
  const [searchInventoryItem, setSearchInventoryItem] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const { data: inventoryItems, isLoading: isLoadingInventoryItems } = useQuery(
    {
      queryKey: ["inventoryItems", facilityId, locationId, searchInventoryItem],
      queryFn: query(inventoryApi.list, {
        pathParams: { facilityId, locationId },
        queryParams: { product_knowledge: searchInventoryItem },
      }),
      enabled: Boolean(searchInventoryItem),
    },
  );

  const inventoryItemOptions =
    inventoryItems?.results.map((item: InventoryRead) => ({
      label: `${t("lot")} #${item.product.batch?.lot_number} ${item.product.expiration_date ? `(${t("expiry")} ${formatDate(item.product.expiration_date, "dd/MM/yyyy")})` : ""}`,
      value: item.id,
    })) || [];

  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, searchLocation],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        search: searchLocation,
        limit: 100,
        mode: "kind",
        ordering: "sort_index",
      },
    }),
  });

  const locationOptions =
    locations?.results.map((location) => ({
      label: location.name,
      value: location.id,
    })) || [];

  type FormValues = z.infer<typeof createFormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      supplied_item_type: SupplyDeliveryType.product,
      destination: "",
      items: [
        {
          supplied_inventory_item: "",
          supplied_item_quantity: 1,
        },
      ],
      supply_request: supplyRequestId,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { mutate: upsertDelivery, isPending } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.upsertSupplyDelivery),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
      toast.success(t("supply_delivery_created"));
      navigate(returnPath);
    },
  });

  function onSubmit(data: FormValues) {
    upsertDelivery({
      datapoints: data.items.map((item) => ({
        status: SupplyDeliveryStatus.in_progress,
        supplied_item_type: data.supplied_item_type,
        supplied_item_condition: SupplyDeliveryCondition.normal,
        supplied_item_quantity: item.supplied_item_quantity,
        supplied_inventory_item: item.supplied_inventory_item,
        origin: locationId,
        destination: data.destination,
        supply_request: data.supply_request,
      })),
    });
  }

  return (
    <Page title={title} hideTitleOnPage>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-2 -top-2"
            onClick={() => goBack()}
          >
            <X className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{pageDescription}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-2">
              <CardHeader className="pt-4 pb-1 px-2">
                <CardTitle>{t("request_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-gray-50 m-2 p-2 rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("destination")}</FormLabel>
                        <FormControl>
                          <Autocomplete
                            options={locationOptions}
                            value={field.value || ""}
                            onChange={field.onChange}
                            isLoading={isLoadingLocations}
                            onSearch={setSearchLocation}
                            placeholder={t("select_destination")}
                            inputPlaceholder={t("search_location")}
                            noOptionsMessage={t("no_location_found")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplied_item_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("item_type")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            {Object.values(SupplyDeliveryType).map((type) => (
                              <div
                                key={type}
                                className={cn(
                                  "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                  field.value === type &&
                                    "border-primary bg-primary/10",
                                )}
                              >
                                <RadioGroupItem value={type} id={type} />
                                <Label htmlFor={type}>{t(type)}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader className="pt-4 pb-1 px-2">
                <CardTitle>{t("items")}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="rounded-md border border-gray-200 bg-gray-50 shadow">
                  <Table>
                    <TableHeader className="bg-gray-200/80">
                      <TableRow className="divide-x divide-gray-300">
                        <TableHead>{t("product_knowledge")}</TableHead>
                        <TableHead>{t("inventory_item")}</TableHead>
                        <TableHead>{t("quantity")}</TableHead>
                        <TableHead className="w-[100px]">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow
                          key={field.id}
                          className="divide-x divide-gray-300"
                        >
                          <TableCell className="align-top">
                            <FormField
                              control={form.control}
                              name={`items.${index}.product_knowledge`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ProductKnowledgeSelect
                                      value={field.value}
                                      onChange={(product) => {
                                        field.onChange(product);
                                        // Reset inventory item when product changes
                                        form.setValue(
                                          `items.${index}.supplied_inventory_item`,
                                          "",
                                        );
                                        setSearchInventoryItem(product.id);
                                      }}
                                      placeholder={t("select_product")}
                                      className="w-full"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <FormField
                              control={form.control}
                              name={`items.${index}.supplied_inventory_item`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Autocomplete
                                      options={inventoryItemOptions}
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      isLoading={isLoadingInventoryItems}
                                      onSearch={setSearchInventoryItem}
                                      placeholder={t("select_inventory_item")}
                                      inputPlaceholder={t(
                                        "search_inventory_item",
                                      )}
                                      noOptionsMessage={t(
                                        "no_inventory_items_found",
                                      )}
                                      disabled={
                                        !form.watch(
                                          `items.${index}.product_knowledge`,
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <FormField
                              control={form.control}
                              name={`items.${index}.supplied_item_quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      product_knowledge: {} as ProductKnowledgeBase,
                      supplied_inventory_item: "",
                      supplied_item_quantity: 1,
                    })
                  }
                  className="mt-4"
                >
                  <PlusCircle className="mr-2 size-4" />
                  {t("add_another_item")}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => navigate(returnPath)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
