import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DefinitionList,
  DefinitionListItem,
} from "@/components/ui/definition-list";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

const completeDeliverySchema = z.object({
  condition: z.nativeEnum(SupplyDeliveryCondition),
});

type CompleteDeliveryForm = z.infer<typeof completeDeliverySchema>;

export function SupplyDeliveryDetails({ deliveryId }: { deliveryId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { location } = useCurrentLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CompleteDeliveryForm>({
    resolver: zodResolver(completeDeliverySchema),
    defaultValues: {
      condition: SupplyDeliveryCondition.normal,
    },
  });

  const { data: delivery } = useQuery({
    queryKey: ["supply-delivery", deliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId: deliveryId },
    }),
  });

  const { mutate: updateDeliveryStatus } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.updateSupplyDelivery, {
      pathParams: { supplyDeliveryId: deliveryId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supply-delivery", deliveryId],
      });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  if (!delivery) {
    return <CardListSkeleton count={2} />;
  }

  const canMarkAsCompleted =
    delivery.status === "in_progress" &&
    delivery.destination.id === location?.id;

  const handleMarkAsCompleted = (values: CompleteDeliveryForm) => {
    updateDeliveryStatus({
      status: SupplyDeliveryStatus.completed,
      supplied_item_condition: values.condition,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("delivery_details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DefinitionList>
          <DefinitionListItem
            term={t("supplied_item")}
            description={
              delivery.supplied_item?.product_knowledge?.name ||
              delivery.supplied_inventory_item?.product?.product_knowledge?.name
            }
          />
          <DefinitionListItem
            term={t("supplied_item_quantity")}
            description={delivery.supplied_item_quantity}
          />
          <DefinitionListItem
            term={t("supplied_item_type")}
            description={t(delivery.supplied_item_type)}
          />
          {delivery.supplied_item_condition && (
            <DefinitionListItem
              term={t("supplied_item_condition")}
              description={t(delivery.supplied_item_condition)}
            />
          )}
          <DefinitionListItem
            term={t("origin")}
            description={delivery.origin?.name}
          />
          <DefinitionListItem
            term={t("destination")}
            description={delivery.destination.name}
          />
          <DefinitionListItem
            term={t("status")}
            description={
              <Badge
                className={
                  {
                    in_progress: "bg-amber-100 text-amber-700",
                    completed: "bg-green-100 text-green-700",
                    abandoned: "bg-red-100 text-red-700",
                    entered_in_error: "bg-red-100 text-red-700",
                  }[delivery.status]
                }
                variant="secondary"
              >
                {t(delivery.status)}
              </Badge>
            }
          />
        </DefinitionList>
        {canMarkAsCompleted && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="primary">
                {t("mark_as_completed")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("complete_delivery")}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleMarkAsCompleted)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("supplied_item_condition")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select_condition")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SupplyDeliveryCondition).map(
                              (condition) => (
                                <SelectItem key={condition} value={condition}>
                                  {t(condition)}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit">{t("complete")}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
