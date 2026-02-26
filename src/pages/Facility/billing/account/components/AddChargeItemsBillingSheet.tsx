import { useMutation } from "@tanstack/react-query";
import { InfoIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import UserSelector from "@/components/Common/UserSelector";
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

import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { UserReadMinimal } from "@/types/user/user";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface AddChargeItemsBillingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  onChargeItemsAdded: () => void;
  disabled?: boolean;
  accountId: string;
}

interface ApplyChargeItemDefinitionRequestWithObject extends ApplyChargeItemDefinitionRequest {
  charge_item_definition_object: ChargeItemDefinitionRead;
  performer_actor_object?: UserReadMinimal;
}

export default function AddChargeItemsBillingSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  onChargeItemsAdded,
  accountId,
  disabled,
}: AddChargeItemsBillingSheetProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedItems, setSelectedItems] = useState<
    ApplyChargeItemDefinitionRequestWithObject[]
  >([]);
  const [selectedDefinition, setSelectedDefinition] =
    useState<ChargeItemDefinitionRead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: applyChargeItems, isPending } = useMutation({
    mutationFn: mutate(chargeItemApi.applyChargeItemDefinitions, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      onChargeItemsAdded();
      setSelectedItems([]);
      onOpenChange(false);
      toast.success(t("charge_items_added_successfully"));
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (selectedDefinition) {
      setSelectedItems([
        ...selectedItems,
        {
          quantity: "1",
          charge_item_definition: selectedDefinition.slug,
          charge_item_definition_object: selectedDefinition,
          patient: patientId,
        },
      ]);
      setSelectedDefinition(null);
    }
  }, [selectedDefinition, selectedItems, patientId]);

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

  const handleUpdatePerformer = (index: number, user: UserReadMinimal) => {
    setSelectedItems(
      selectedItems.map((item, i) =>
        i === index
          ? { ...item, performer_actor: user.id, performer_actor_object: user }
          : item,
      ),
    );
  };

  const handleSubmit = () => {
    if (isPending || isSubmitting) {
      return;
    }
    if (selectedItems.length === 0) {
      toast.error(t("please_select_at_least_one_item"));
      return;
    }
    setIsSubmitting(true);
    applyChargeItems({
      requests: selectedItems.map(
        ({
          charge_item_definition_object: _discard,
          performer_actor_object: _discardPerformer,
          ...charge_item
        }) => ({ ...charge_item, account: accountId }),
      ),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col">
        <SheetHeader className="px-4 py-4">
          <SheetTitle>{t("add_charge_items")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 pb-12 px-4 pt-0">
          <div className="mt-4 space-y-4">
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
                                <MonetaryDisplay
                                  amount={
                                    item.charge_item_definition_object
                                      .price_components?.[0]?.amount || 0
                                  }
                                />
                              </span>
                              {item.charge_item_definition_object
                                .price_components?.length > 0 && (
                                <Popover>
                                  <PopoverTrigger>
                                    <InfoIcon className="h-4 w-4 text-gray-700 cursor-pointer" />
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="right"
                                    className="p-0 w-auto max-w-[calc(100vw-2rem)]"
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

                          <div className="space-y-1">
                            <label className="text-sm text-gray-500">
                              {t("performer")}
                            </label>
                            <UserSelector
                              selected={item.performer_actor_object}
                              onChange={(user) =>
                                handleUpdatePerformer(index, user)
                              }
                              placeholder={t("select_performer")}
                              facilityId={facilityId}
                              disabled={disabled}
                            />
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
                        <TableHead>{t("performer")}</TableHead>
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
                                <MonetaryDisplay
                                  amount={
                                    item.charge_item_definition_object
                                      .price_components?.[0]?.amount || 0
                                  }
                                />
                              </span>
                              {item.charge_item_definition_object
                                .price_components?.length > 0 && (
                                <Popover>
                                  <PopoverTrigger>
                                    <InfoIcon className="size-4 text-gray-700 cursor-pointer" />
                                  </PopoverTrigger>
                                  <PopoverContent
                                    side="right"
                                    className="p-0 w-auto max-w-[calc(100vw-2rem)]"
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
                          </TableCell>
                          <TableCell>
                            <UserSelector
                              selected={item.performer_actor_object}
                              onChange={(user) =>
                                handleUpdatePerformer(index, user)
                              }
                              placeholder={t("select_performer")}
                              facilityId={facilityId}
                              disabled={disabled}
                            />
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
              <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
                facilityId={facilityId}
                value={selectedDefinition || undefined}
                onValueChange={(selectedDef) => {
                  if (!selectedDef) {
                    setSelectedDefinition(null);
                    return;
                  }
                  setSelectedDefinition(
                    selectedDef as ChargeItemDefinitionRead,
                  );
                }}
                placeholder={t("select_charge_item_definition")}
                disabled={disabled}
                className="w-full"
                resourceType={
                  ResourceCategoryResourceType.charge_item_definition
                }
                listDefinitions={{
                  queryFn: chargeItemDefinitionApi.listChargeItemDefinition,
                  pathParams: { facilityId },
                  queryParams: { status: ChargeItemDefinitionStatus.active },
                }}
                translationBaseKey="charge_item_definition"
                data-shortcut-id="keydown-action"
                defaultOpen={open}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={isPending || selectedItems.length === 0 || disabled}
                className="flex flex-row items-center gap-2 justify-between"
              >
                {t("add_items")}
                {open && <ShortcutBadge actionId="enter-action" />}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
