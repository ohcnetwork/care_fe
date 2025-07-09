import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, Plus, X } from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { ProductSearch } from "@/pages/Facility/services/inventory/ProductSearch";
import { SupplierSelect } from "@/pages/Facility/services/inventory/SupplierSelect";
import { ProductRead } from "@/types/inventory/product/product";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCreate,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import { Organization } from "@/types/organization/organization";

import { ProductKnowledgeSelect } from "./ProductKnowledgeSelect";
import { ReceiveStockTable } from "./ReceiveStockTable";
import { SupplyRequestSelect } from "./SupplyRequestSelect";
import { EditingItem, ReceiveStockEntry } from "./utils";

const itemReference = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string().optional(),
});

const supplyRequestReference = z.object({
  id: z.string(),
  item: itemReference,
  quantity: z.number(),
});

const objectReference = z.object({ id: z.string(), name: z.string() });

const receiveStockSchema = z.object({
  supplier: objectReference.nullable(),
  entries: z
    .array(
      z.object({
        supply_request: supplyRequestReference.nullable(),
        supplied_item: z.any().nullable(),
        supplied_item_quantity: z.number().min(0),
        _checked: z.boolean().optional(),
        _product_knowledge: objectReference.nullable(),
        _is_additional: z.boolean(),
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
  const { goBack } = useAppHistory();
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

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
      navigate("/external_supply/inward_entry");
    },
    onError: () => {
      toast.error(t("error_receiving_stock"));
    },
  });

  function onSubmit(data: z.infer<typeof receiveStockSchema>) {
    batchRequest.mutate({
      requests: data.entries
        .filter((entry) => entry._checked)
        .map((entry) => ({
          url: supplyDeliveryApi.createSupplyDelivery.path,
          method: supplyDeliveryApi.createSupplyDelivery.method,
          reference_id: `supplied-item-${entry.supplied_item?.id}`,
          body: {
            supplier: data.supplier?.id,
            supply_request: entry.supply_request?.id,
            destination: locationId,
            supplied_item: entry.supplied_item?.id,
            supplied_item_quantity: entry.supplied_item_quantity,
            status: SupplyDeliveryStatus.completed,
            supplied_item_type: SupplyDeliveryType.product,
          } satisfies SupplyDeliveryCreate,
        })),
    });
  }

  const entries = form.watch("entries");
  const supplier = form.watch("supplier");

  const handleDeleteItem = (index: number) => {
    form.setValue(
      "entries",
      entries.filter((_, i) => i !== index),
    );
  };

  const handleAddItem = () => {
    setEditingItem({
      entry: {
        supply_request: null,
        supplied_item: null,
        supplied_item_quantity: 1,
        _checked: false,
        _product_knowledge: null,
        _is_additional: false,
      },
      index: null,
    });
  };

  return (
    <Page
      title={t("receive_stock")}
      className="flex flex-col gap-4"
      hideTitleOnPage
    >
      <div className="flex flex-row gap-2 justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{t("receive_stock")}</h1>
          <p className="text-sm text-gray-500">
            {t("receive_stock_description")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            goBack(
              `/facility/${facilityId}/locations/${locationId}/external_supply/inward_entry`,
            )
          }
        >
          <X className="size-4" />
        </Button>
      </div>
      <Separator className="my-1" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-row gap-2 items-end justify-between"
        >
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem className="grow-1 max-w-md">
                <FormLabel>{t("supplier")}</FormLabel>
                <FormControl>
                  <SupplierSelect
                    value={
                      field.value ? (field.value as Organization) : undefined
                    }
                    onChange={field.onChange}
                    showClearButton={entries.length === 0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                handleAddItem();
              }}
              disabled={batchRequest.isPending || !supplier}
            >
              <Plus className="size-4" />
              {t("add_item")}
            </Button>
            {entries.length > 0 && (
              <Button
                type="submit"
                variant="primary"
                disabled={
                  batchRequest.isPending ||
                  entries.filter(
                    (entry) => entry._checked && entry.supplied_item,
                  ).length === 0
                }
              >
                <Plus className="size-4" />
                {t("save_as_received")}
              </Button>
            )}
          </div>
        </form>
      </Form>
      <div className="mt-2">
        <ReceiveStockTable
          entries={entries as ReceiveStockEntry[]}
          form={form}
          setEditingItem={setEditingItem}
          handleAddItem={handleAddItem}
          handleDeleteItem={handleDeleteItem}
          buttonDisabled={batchRequest.isPending || !supplier}
        />
      </div>
      {editingItem && (
        <AddItemForm
          facilityId={facilityId}
          locationId={locationId}
          entry={editingItem.entry}
          index={editingItem.index}
          open={!!editingItem}
          setOpen={(open) => {
            if (!open) setEditingItem(null);
          }}
          onSuccess={(newEntry, idx) => {
            if (idx === null) {
              form.setValue("entries", [...entries, newEntry]);
            } else {
              const updated = [...entries];
              updated[idx] = newEntry;
              form.setValue("entries", updated);
            }
            setEditingItem(null);
          }}
          supplier={supplier?.id || ""}
        />
      )}
    </Page>
  );
}

function AddItemForm({
  entry,
  supplier,
  facilityId,
  locationId,
  index,
  open,
  setOpen,
  onSuccess,
}: {
  entry: ReceiveStockEntry;
  supplier: string;
  facilityId: string;
  locationId: string;
  index: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: (newEntry: ReceiveStockEntry, idx: number | null) => void;
}) {
  const { t } = useTranslation();
  const [currentEntry, setCurrentEntry] = useState(entry);
  const [productFormSubmit, setProductFormSubmit] = useState<
    (() => void) | null
  >(null);
  const [isProductCreationInProgress, setIsProductCreationInProgress] =
    useState(false);
  const [activeTab, setActiveTab] = useState(
    entry._is_additional ? "additional" : "requested",
  );

  useEffect(() => {
    setCurrentEntry(entry);
  }, [entry, open]);

  useEffect(() => {
    if (currentEntry.supplied_item && currentEntry.supplied_item.id) {
      setProductFormSubmit(null);
      setIsProductCreationInProgress(false);
    }
  }, [currentEntry.supplied_item]);

  if (!currentEntry) return null;

  const handleSave = () => {
    if (productFormSubmit && isProductCreationInProgress) {
      // If product creation is in progress, trigger the submit
      productFormSubmit();
    } else {
      onSuccess(currentEntry, index);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-2xl p-3">
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 p-3">
          <div className="flex flex-col gap-2">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                setCurrentEntry((prev) => ({
                  ...prev,
                  supplied_item: null,
                  supply_request: null,
                  _product_knowledge: null,
                  _is_additional: value === "additional",
                }));
              }}
            >
              <TabsList className="w-full flex flex-row">
                <TabsTrigger value="requested" className="w-full">
                  {t("requested_items")}
                </TabsTrigger>
                <TabsTrigger value="additional" className="w-full">
                  {t("additional_item", { count: 2 })}
                </TabsTrigger>
              </TabsList>

              <div className="bg-gray-100 p-3 rounded flex flex-col gap-2">
                <TabsContent value="requested">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      {t("received_item")}
                    </label>
                    <SupplyRequestSelect
                      value={
                        currentEntry.supply_request
                          ? (currentEntry.supply_request as SupplyRequestRead)
                          : undefined
                      }
                      onChange={(value) => {
                        if (value && value.quantity) {
                          setCurrentEntry((prev) => ({
                            ...prev,
                            supply_request: value,
                            supplied_item_quantity: value.quantity,
                            _product_knowledge: value.item,
                            supplied_item: null,
                          }));
                        } else {
                          setCurrentEntry((prev) => ({
                            ...prev,
                            supply_request: null,
                            _product_knowledge: null,
                            supplied_item: null,
                          }));
                        }
                      }}
                      locationId={locationId}
                      placeholder={t("select_item")}
                      inputPlaceholder={t("search") + " " + t("items")}
                      noOptionsMessage={t("no_items_found")}
                      supplier={supplier}
                      enabled={open}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="additional">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      {t("received_item")}
                    </label>
                    <ProductKnowledgeSelect
                      value={
                        currentEntry._product_knowledge
                          ? (currentEntry._product_knowledge as ProductKnowledgeBase)
                          : undefined
                      }
                      onChange={(productKnowledge) => {
                        setCurrentEntry((prev) => ({
                          ...prev,
                          _product_knowledge: productKnowledge,
                          supplied_item: null,
                        }));
                      }}
                    />
                  </div>
                </TabsContent>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">
                    {t("received_quantity")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={currentEntry.supplied_item_quantity || 0}
                    onChange={(e) =>
                      setCurrentEntry((prev) => ({
                        ...prev,
                        supplied_item_quantity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </Tabs>
            <ProductSearch
              key={`${activeTab}-product-search`}
              facilityId={facilityId}
              value={currentEntry.supplied_item || undefined}
              onChange={(product: ProductRead | null) => {
                if (product && product.id) {
                  setCurrentEntry((prev) => ({
                    ...prev,
                    supplied_item: product,
                  }));
                } else {
                  setCurrentEntry((prev) => ({
                    ...prev,
                    supplied_item: null,
                  }));
                }
                // Clear the submit function and creation state since product is now selected
                setProductFormSubmit(null);
                setIsProductCreationInProgress(false);
              }}
              onProductSubmit={(submitFn) => {
                setProductFormSubmit(() => submitFn);
                setIsProductCreationInProgress(true);
              }}
              onProductCreate={(product) => {
                const updatedEntry = {
                  ...currentEntry,
                  supplied_item: product,
                };
                setCurrentEntry(updatedEntry);
                onSuccess(updatedEntry, index);
                setOpen(false);
              }}
              enabled={open}
              productKnowledgeId={currentEntry._product_knowledge?.id || ""}
            />
          </div>
        </ScrollArea>
        <div className="flex flex-row gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={
              (currentEntry._is_additional
                ? !currentEntry._product_knowledge
                : !currentEntry.supply_request) ||
              (!isProductCreationInProgress && !currentEntry.supplied_item) ||
              !currentEntry.supplied_item_quantity ||
              (isProductCreationInProgress && !productFormSubmit)
            }
          >
            <CheckIcon className="size-6" />
            {t("add_item")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
