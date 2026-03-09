import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FolderOpen,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import {
  calculateTotalPrice,
  calculateTotalPriceWithQuantity,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";
import { add } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface QuickAddChargeItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  onChargeItemsAdded: () => void;
  accountId: string;
  disabled?: boolean;
}

interface CartItem extends ApplyChargeItemDefinitionRequest {
  definition: ChargeItemDefinitionRead;
  sourcePackage?: string;
}

export default function QuickAddChargeItemsSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  onChargeItemsAdded,
  accountId,
  disabled,
}: QuickAddChargeItemsSheetProps) {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    new Set(),
  );

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setCartItems([]);
      setSelectedPackages(new Set());
    }
  }, [open]);

  // Fetch parent tags (groups) for charge item definitions
  const { data: groupTags, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["chargeItemGroups", facilityId],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource: TagResource.CHARGE_ITEM_DEFINITION,
        status: "active",
        facility: facilityId,
        parent_is_null: true,
      },
    }),
    enabled: open,
  });

  // Submit mutation
  const { mutate: applyChargeItems, isPending: isSubmitting } = useMutation({
    mutationFn: mutate(chargeItemApi.applyChargeItemDefinitions, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      onChargeItemsAdded();
      onOpenChange(false);
      toast.success(t("charge_items_added_successfully"));
    },
  });

  // Calculate totals (including tax)
  const cartTotal = useMemo(() => {
    return cartItems
      .reduce(
        (sum, item) => {
          const itemTotal = calculateTotalPriceWithQuantity(
            item.definition.price_components ?? [],
            item.quantity,
          );
          return add(sum, itemTotal);
        },
        add(0, 0),
      )
      .toString();
  }, [cartItems]);

  // Add item to cart
  const addToCart = useCallback(
    (definition: ChargeItemDefinitionRead, sourcePackage?: string) => {
      setCartItems((prev) => {
        const existing = prev.find(
          (item) => item.definition.slug === definition.slug,
        );
        if (existing) {
          return prev.map((item) =>
            item.definition.slug === definition.slug
              ? { ...item, quantity: String(Number(item.quantity) + 1) }
              : item,
          );
        }
        return [
          ...prev,
          {
            charge_item_definition: definition.slug,
            quantity: "1",
            patient: patientId,
            definition,
            sourcePackage,
          },
        ];
      });
    },
    [patientId],
  );

  // Remove item from cart
  const removeFromCart = useCallback((slug: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.definition.slug !== slug),
    );
  }, []);

  // Update quantity
  const updateQuantity = useCallback((slug: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.definition.slug === slug
          ? { ...item, quantity: String(quantity) }
          : item,
      ),
    );
  }, []);

  // Handle package selection
  const handlePackageSelect = useCallback(
    (tag: TagConfig, items: ChargeItemDefinitionRead[]) => {
      setSelectedPackages((prev) => new Set([...prev, tag.id]));
      items.forEach((item) => addToCart(item, tag.id));
    },
    [addToCart],
  );

  // Handle package deselection
  const handlePackageDeselect = useCallback((tagId: string) => {
    setSelectedPackages((prev) => {
      const next = new Set(prev);
      next.delete(tagId);
      return next;
    });
    setCartItems((prev) => prev.filter((item) => item.sourcePackage !== tagId));
  }, []);

  // Submit cart
  const handleSubmit = () => {
    if (cartItems.length === 0) {
      toast.error(t("please_select_at_least_one_item"));
      return;
    }

    applyChargeItems({
      requests: cartItems.map(({ definition: _, ...item }) => ({
        charge_item_definition: item.charge_item_definition,
        quantity: item.quantity,
        patient: item.patient,
        account: accountId,
      })),
    });
  };

  const groups = groupTags?.results ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 gap-0 overflow-y-auto">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{t("quick_add")}</SheetTitle>
          <SheetDescription>
            {t("select_package_to_add_all_items")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Groups Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-sm">{t("packages")}</h3>
              </div>

              {isLoadingGroups ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <></>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      facilityId={facilityId}
                      selectedPackages={selectedPackages}
                      onPackageSelect={handlePackageSelect}
                      onPackageDeselect={handlePackageDeselect}
                      disabled={disabled}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Cart Section */}
            {cartItems.length > 0 && (
              <>
                <Separator />
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-gray-500" />
                      {t("items_to_add")}
                      <Badge variant="secondary">{cartItems.length}</Badge>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCartItems([]);
                        setSelectedPackages(new Set());
                      }}
                      className="text-destructive hover:text-destructive h-7 text-xs"
                    >
                      {t("clear_all")}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <CartItemRow
                        key={item.definition.slug}
                        item={item}
                        onQuantityChange={(q) =>
                          updateQuantity(item.definition.slug, q)
                        }
                        onRemove={() => removeFromCart(item.definition.slug)}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <SheetFooter className="border-t bg-gray-50/80 px-6 py-4">
          <div className="w-full space-y-4">
            {cartItems.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("estimated_total")}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  <MonetaryDisplay amount={cartTotal} />
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || cartItems.length === 0 || disabled}
                variant="primary"
                className="flex-1"
              >
                {isSubmitting ? (
                  t("adding")
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add_items")} ({cartItems.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Group Card Component (Parent Tag)
interface GroupCardProps {
  group: TagConfig;
  facilityId: string;
  selectedPackages: Set<string>;
  onPackageSelect: (tag: TagConfig, items: ChargeItemDefinitionRead[]) => void;
  onPackageDeselect: (tagId: string) => void;
  disabled?: boolean;
}

function GroupCard({
  group,
  facilityId,
  selectedPackages,
  onPackageSelect,
  onPackageDeselect,
  disabled,
}: GroupCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  // Fetch child tags (packages) for this group
  const { data: childTags, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["childTags", facilityId, group.id],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource: TagResource.CHARGE_ITEM_DEFINITION,
        status: "active",
        facility: facilityId,
        parent: group.id,
      },
    }),
  });

  const packages = childTags?.results ?? [];
  const selectedCount = packages.filter((pkg) =>
    selectedPackages.has(pkg.id),
  ).length;

  if (isLoadingChildren) {
    return <Skeleton className="h-16 rounded-xl" />;
  }

  if (packages.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="p-1.5 rounded-md bg-gray-100">
            <FolderOpen className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-semibold text-sm text-gray-900">
              {group.display}
            </h4>
            <span className="text-xs text-gray-500">
              {t("packages_count", {
                count: packages.length,
                defaultValue: `${packages.length} packages`,
              })}
              {selectedCount > 0 && (
                <span className="text-primary-600 ml-2">
                  ({selectedCount} {t("selected")})
                </span>
              )}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 pt-2 space-y-2">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              tag={pkg}
              facilityId={facilityId}
              isSelected={selectedPackages.has(pkg.id)}
              onSelect={(items) => onPackageSelect(pkg, items)}
              onDeselect={() => onPackageDeselect(pkg.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Package Card Component (Child Tag)
interface PackageCardProps {
  tag: TagConfig;
  facilityId: string;
  isSelected: boolean;
  onSelect: (items: ChargeItemDefinitionRead[]) => void;
  onDeselect: () => void;
  disabled?: boolean;
}

function PackageCard({
  tag,
  facilityId,
  isSelected,
  onSelect,
  onDeselect,
  disabled,
}: PackageCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: packageItems, isLoading } = useQuery({
    queryKey: ["packageItems", facilityId, tag.id],
    queryFn: query(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: {
        status: ChargeItemDefinitionStatus.active,
        tags: tag.id,
        limit: 100,
      },
    }),
  });

  const items = useMemo(
    () => (packageItems?.results ?? []) as ChargeItemDefinitionRead[],
    [packageItems],
  );

  const totalEstimate = useMemo(() => {
    return items
      .reduce(
        (sum, item) => {
          const itemTotal = calculateTotalPrice(item.price_components ?? []);
          return add(sum, itemTotal);
        },
        add(0, 0),
      )
      .toString();
  }, [items]);

  const handleClick = () => {
    if (disabled || isLoading || items.length === 0) return;
    if (isSelected) {
      onDeselect();
    } else {
      onSelect(items);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all duration-200 overflow-hidden",
        isSelected
          ? "border-primary-400 bg-primary-50 shadow-md shadow-primary-100"
          : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm",
        (disabled || items.length === 0) && "opacity-50 cursor-not-allowed",
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading || items.length === 0}
        className="w-full p-3 text-left"
      >
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
              isSelected
                ? "bg-primary-500 border-primary-500"
                : "border-gray-300 bg-white",
            )}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>

          {/* Package info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900">{tag.display}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {isLoading
                  ? "..."
                  : t("items_count", {
                      count: items.length,
                      defaultValue: `${items.length} items`,
                    })}
              </span>
              {!isLoading && Number(totalEstimate) > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-medium text-gray-700">
                    <MonetaryDisplay amount={totalEstimate} />
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Package icon */}
          <div
            className={cn(
              "p-1.5 rounded-lg",
              isSelected ? "bg-primary-100" : "bg-gray-100",
            )}
          >
            <Package
              className={cn(
                "h-4 w-4",
                isSelected ? "text-primary-600" : "text-gray-500",
              )}
            />
          </div>
        </div>
      </button>

      {/* Expandable items preview */}
      {items.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-full px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                {t("hide_details")}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                {t("view_items")}
              </>
            )}
          </button>

          {isExpanded && (
            <div className="px-3 pb-2 space-y-1 bg-gray-50/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="text-xs text-gray-600 flex items-center justify-between py-0.5"
                >
                  <span className="truncate pr-2">{item.title}</span>
                  <MonetaryDisplay
                    amount={calculateTotalPrice(
                      item.price_components ?? [],
                    ).toString()}
                    className="text-gray-500 flex-shrink-0 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Cart Item Row Component
interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  disabled,
}: CartItemRowProps) {
  const unitPrice = calculateTotalPrice(
    item.definition.price_components ?? [],
  ).toString();
  const lineTotal = calculateTotalPriceWithQuantity(
    item.definition.price_components ?? [],
    item.quantity,
  ).toString();

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white border">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.definition.title}
        </p>
        <p className="text-xs text-gray-500">
          <MonetaryDisplay amount={unitPrice} /> × {item.quantity}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onQuantityChange(Number(item.quantity) - 1)}
          disabled={disabled || Number(item.quantity) <= 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <Minus className="h-3 w-3" />
        </button>
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onQuantityChange(Number(e.target.value) || 1)}
          className="w-12 h-7 text-center text-sm px-1"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => onQuantityChange(Number(item.quantity) + 1)}
          disabled={disabled}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Line total */}
      <div className="w-20 text-right">
        <span className="text-sm font-medium">
          <MonetaryDisplay amount={lineTotal} />
        </span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="p-1 text-gray-400 hover:text-destructive rounded"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
