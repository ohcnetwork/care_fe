import { useMutation, useQuery } from "@tanstack/react-query";
import { InfoIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";

import { useIsMobile } from "@/hooks/use-mobile";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

interface AddChargeItemsBillingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  onChargeItemsAdded: () => void;
  disabled?: boolean;
}

interface ApplyChargeItemDefinitionRequestWithObject
  extends ApplyChargeItemDefinitionRequest {
  charge_item_definition_object: ChargeItemDefinitionRead;
}

export default function AddChargeItemsBillingSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  onChargeItemsAdded,
  disabled,
}: AddChargeItemsBillingSheetProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedItems, setSelectedItems] = useState<
    ApplyChargeItemDefinitionRequestWithObject[]
  >([]);
  const [search, setSearch] = useState("");
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<
    string | null
  >(null);

  const { data: chargeItemDefinitions, isLoading } = useQuery({
    queryKey: ["chargeItemDefinitions", search],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: { limit: 100, status: "active", title: search },
    }),
    enabled: open,
  });

  const { mutate: applyChargeItems, isPending } = useMutation({
    mutationFn: mutate(chargeItemApi.applyChargeItemDefinitions, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      onChargeItemsAdded();
      setSelectedItems([]);
      onOpenChange(false);
      toast.success(t("charge_items_added_successfully"));
    },
  });

  const handleSelectChargeItem = (value: string) => {
    if (!value) return;
    setSelectedDefinitionId(value);
  };

  useEffect(() => {
    if (selectedDefinitionId) {
      const selectedCID = chargeItemDefinitions?.results.find(
        (cid) => cid.id === selectedDefinitionId,
      );
      if (!selectedCID) return;

      setSelectedItems([
        ...selectedItems,
        {
          quantity: "1",
          charge_item_definition: selectedCID.id,
          charge_item_definition_object: selectedCID,
          patient: patientId,
        },
      ]);
      setSelectedDefinitionId(null);
    }
  }, [selectedDefinitionId, chargeItemDefinitions, selectedItems, patientId]);

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: string) => {
    setSelectedItems(
      selectedItems.map((item, i) =>
        i === index ? { ...item, quantity } : item,
      ),
    );
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      toast.error(t("please_select_at_least_one_item"));
      return;
    }

    applyChargeItems({
      requests: selectedItems.map(
        ({ charge_item_definition_object: _discard, ...charge_item }) =>
          charge_item,
      ),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-2">
        <ScrollArea className="h-full pb-12 pr-6 p-4">
          <SheetHeader>
            <SheetTitle>{t("add_charge_items")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-medium">{t("selected_items")}</h3>
                {isMobile ? (
                  <div className="space-y-4">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border p-4 space-y-3"
                      >
                        {/* Title and Remove Button */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-base flex-1">
                            {item.charge_item_definition_object.title}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(index)}
                            className="shrink-0"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="space-y-1">
                            <label className="text-sm text-gray-500">
                              {t("quantity")}
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(index, e.target.value)
                              }
                              className="w-24"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm text-gray-500">
                              {t("price")}
                            </label>
                            <div className="flex items-center gap-1">
                              <span>
                                {item.charge_item_definition_object
                                  .price_components?.[0]?.amount || 0}{" "}
                                {item.charge_item_definition_object
                                  .price_components?.[0]?.code?.code || "INR"}
                              </span>
                              {item.charge_item_definition_object
                                .price_components?.length > 0 && (
                                <Popover>
                                  <PopoverTrigger>
                                    <InfoIcon className="h-4 w-4 text-gray-700 cursor-pointer" />
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="right"
                                    className="p-0"
                                    align="start"
                                  >
                                    <ChargeItemPriceDisplay
                                      priceComponents={
                                        item.charge_item_definition_object
                                          .price_components
                                      }
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("quantity")}</TableHead>
                        <TableHead>{t("price")}</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-pre-wrap">
                            {item.charge_item_definition_object.title}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(index, e.target.value)
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>
                                {item.charge_item_definition_object
                                  .price_components?.[0]?.amount || 0}{" "}
                                {item.charge_item_definition_object
                                  .price_components?.[0]?.code?.code || "INR"}
                              </span>
                              {item.charge_item_definition_object
                                .price_components?.length > 0 && (
                                <Popover>
                                  <PopoverTrigger>
                                    <InfoIcon className="size-4 text-gray-700 cursor-pointer" />
                                  </PopoverTrigger>
                                  <PopoverContent side="right" className="p-0">
                                    <ChargeItemPriceDisplay
                                      priceComponents={
                                        item.charge_item_definition_object
                                          .price_components
                                      }
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Autocomplete
                options={
                  chargeItemDefinitions?.results?.map((cid) => ({
                    label: cid.title,
                    value: cid.id,
                  })) || []
                }
                value=""
                onChange={handleSelectChargeItem}
                onSearch={setSearch}
                placeholder={t("select_charge_item_definition")}
                isLoading={isLoading}
                noOptionsMessage={t("no_charge_item_definitions_found")}
                disabled={disabled}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isPending || disabled}>
                {t("add_items")}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
