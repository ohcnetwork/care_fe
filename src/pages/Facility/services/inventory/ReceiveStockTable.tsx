import { formatDate, isValid } from "date-fns";
import { EllipsisVerticalIcon, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";

import { ReceiveStockEntry } from "./utils";

export interface ReceiveStockTableProps {
  entries: ReceiveStockEntry[];
  form: any;
  setEditingItem: (item: any) => void;
  handleAddItem: () => void;
  handleDeleteItem: (index: number) => void;
  buttonDisabled: boolean;
}

export function ReceiveStockTable({
  entries,
  form,
  setEditingItem,
  handleAddItem,
  handleDeleteItem,
  buttonDisabled,
}: ReceiveStockTableProps) {
  const { t } = useTranslation();

  const getUnitInformation = (entry: any) => {
    const priceComponents: MonetaryComponent[] =
      entry.supplied_item?.charge_item_definition.price_components;
    const tax = priceComponents
      ?.filter(
        (component) =>
          component.monetary_component_type === MonetaryComponentType.tax,
      )
      .reduce((acc, component) => acc + (component.factor || 0), 0);
    const discountComponents = priceComponents?.filter(
      (component) =>
        component.monetary_component_type === MonetaryComponentType.discount,
    );
    const amount = priceComponents?.find(
      (component) =>
        component.monetary_component_type === MonetaryComponentType.base,
    )?.amount;
    return { tax, discountComponents, amount };
  };

  return (
    <div className="mt-2">
      <h5 className="font-semibold mb-2">{t("items_section")}</h5>
      {entries.length > 0 ? (
        <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow className="divide-x">
                <TableHead className="w-8">
                  <Checkbox
                    checked={entries.every((entry) => !!entry._checked)}
                    onCheckedChange={(checked) => {
                      form.setValue(
                        "entries",
                        entries.map((entry) => ({
                          ...entry,
                          _checked: checked,
                        })),
                      );
                    }}
                  />
                </TableHead>
                <TableHead>{t("requested_item")}</TableHead>
                <TableHead>{t("received_item")}</TableHead>
                <TableHead>{t("received_quantity")}</TableHead>
                <TableHead>{t("lot")}</TableHead>
                <TableHead>{t("expiry")}</TableHead>
                <TableHead>{t("tax")}</TableHead>
                <TableHead>{t("discount")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white text-base">
              {entries.map((entry, idx) => {
                const { tax, discountComponents, amount } =
                  getUnitInformation(entry);
                return (
                  <TableRow key={idx} className="divide-x">
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={!!entry._checked}
                        onCheckedChange={(checked) => {
                          form.setValue(`entries.${idx}._checked`, checked);
                        }}
                      />
                    </TableCell>
                    {/* Requested Item/Qty */}
                    <TableCell>
                      {entry.supply_request?.item?.name ||
                        t("additional_item", { count: 1 })}
                      <div className="text-xs text-gray-500">
                        {entry.supplied_item_quantity}{" "}
                        {entry.supply_request?.item?.code?.display || ""}
                      </div>
                    </TableCell>
                    {/* Received Item */}
                    <TableCell>
                      {entry.supplied_item?.id ? (
                        <span>
                          {entry.supplied_item.product_knowledge.name}
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingItem({ entry: { ...entry }, index: idx })
                          }
                          className="w-full"
                        >
                          <Plus className="size-4 mr-1" /> {t("receive_item")}
                        </Button>
                      )}
                    </TableCell>
                    {/* Received Qty */}
                    <TableCell>{entry.supplied_item_quantity}</TableCell>
                    {/* Lot */}
                    <TableCell>
                      {entry.supplied_item?.batch?.lot_number || "-"}
                    </TableCell>
                    {/* Expiry Date */}
                    <TableCell>
                      {entry.supplied_item?.expiration_date &&
                      isValid(new Date(entry.supplied_item?.expiration_date))
                        ? formatDate(
                            new Date(entry.supplied_item?.expiration_date),
                            "dd/MM/yy",
                          )
                        : "-"}
                    </TableCell>
                    {/* Tax */}
                    <TableCell>{tax}%</TableCell>
                    {/* Discount */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {discountComponents && discountComponents.length > 0 ? (
                          discountComponents.map((component) => (
                            <div
                              key={component.code?.code}
                              className="flex flex-row gap-1 text-xs"
                            >
                              <span>
                                {component.code?.display || "Discount"}
                              </span>
                              <span>
                                - {component.amount || `${component.factor}%`}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Amount */}
                    <TableCell>{amount}</TableCell>
                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <EllipsisVerticalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingItem({
                                entry: { ...entry },
                                index: idx,
                              })
                            }
                          >
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteItem(idx)}
                            className="text-red-600 focus:text-red-600"
                          >
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-100 p-8 rounded-md">
          <p className="mb-2 text-lg font-semibold">
            {t("no_items_added_yet")}
          </p>
          <p className="mb-4 text-sm">{t("receive_stock_empty_hint")}</p>
          <Button
            variant="outline"
            onClick={handleAddItem}
            disabled={buttonDisabled}
          >
            <Plus className="size-4 mr-2" />
            {t("add_item")}
          </Button>
        </div>
      )}
    </div>
  );
}
