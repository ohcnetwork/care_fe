import { useQuery } from "@tanstack/react-query";
import { InfoIcon, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";

import query from "@/Utils/request/query";
import { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { ResponseValue } from "@/types/questionnaire/form";

interface ChargeItemQuestionProps {
  encounterId: string;
  facilityId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
  ) => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
}

const CHARGE_ITEM_FIELDS = {
  QUANTITY: {
    key: "quantity",
    required: true,
  },
} as const;

interface ApplyChargeItemDefinitionRequestWithObject
  extends ApplyChargeItemDefinitionRequest {
  charge_item_definition_object: ChargeItemDefinitionRead;
}

interface ChargeItemFormProps {
  chargeItem: ApplyChargeItemDefinitionRequestWithObject;
  onUpdate?: (updates: ApplyChargeItemDefinitionRequestWithObject) => void;
  onRemove?: () => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  defaultOpen?: boolean;
}

function ChargeItemForm({
  chargeItem,
  onUpdate,
  onRemove,
  disabled,
  errors,
  questionId,
  index,
}: ChargeItemFormProps) {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell>{chargeItem.charge_item_definition_object.title}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          value={chargeItem.quantity}
          onChange={(e) =>
            onUpdate?.({
              ...chargeItem,
              quantity: e.target.value,
            })
          }
          disabled={disabled}
          className="w-24"
        />
        {questionId && index !== undefined && (
          <FieldError
            fieldKey={CHARGE_ITEM_FIELDS.QUANTITY.key}
            questionId={questionId}
            errors={errors}
            index={index}
          />
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span>
              {chargeItem.charge_item_definition_object.price_components?.[0]
                ?.amount || 0}{" "}
              {chargeItem.charge_item_definition_object.price_components?.[0]
                ?.code?.code || "INR"}
            </span>
            {chargeItem.charge_item_definition_object.price_components?.length >
              0 && (
              <Popover>
                <PopoverTrigger>
                  <InfoIcon className="h-4 w-4 text-gray-700 cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent side="right" className="p-0" align="start">
                  <ChargeItemPriceDisplay
                    priceComponents={
                      chargeItem.charge_item_definition_object.price_components
                    }
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRemove && (
              <DropdownMenuItem
                onSelect={() => onRemove()}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>{t("remove")}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function ChargeItemQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  facilityId,
  encounterId,
  errors,
}: ChargeItemQuestionProps) {
  const { t } = useTranslation();
  const [selectedChargeItemDefinition, setSelectedChargeItemDefinition] =
    useState<ChargeItemDefinitionRead | null>(null);
  const [chargeItems, setChargeItems] = useState<
    ApplyChargeItemDefinitionRequestWithObject[]
  >([]);
  const [cidSearch, setCidSearch] = useState("");

  const { data: chargeItemDefinitions, isLoading } = useQuery({
    queryKey: ["charge_item_definitions", cidSearch],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: { limit: 100, status: "active", title: cidSearch },
    }),
  });

  useEffect(() => {
    if (selectedChargeItemDefinition) {
      const newChargeItem: ApplyChargeItemDefinitionRequestWithObject = {
        quantity: "1",
        encounter: encounterId,
        charge_item_definition: selectedChargeItemDefinition.id,
        charge_item_definition_object: selectedChargeItemDefinition,
      };

      // Automatically add the item when selected
      const updatedChargeItems = [...chargeItems, newChargeItem];
      setChargeItems(updatedChargeItems);
      const updatedChargeItemsWithoutObject = updatedChargeItems.map(
        ({ charge_item_definition_object: _discard, ...chargeItem }) =>
          chargeItem,
      );
      updateQuestionnaireResponseCB(
        [{ type: "charge_item", value: updatedChargeItemsWithoutObject }],
        questionnaireResponse.question_id,
      );

      // Reset selection after adding
      setSelectedChargeItemDefinition(null);
    }
  }, [
    selectedChargeItemDefinition,
    chargeItemDefinitions,
    encounterId,
    chargeItems,
    updateQuestionnaireResponseCB,
    questionnaireResponse.question_id,
  ]);

  const handleRemoveChargeItem = (index: number) => {
    const newChargeItems = chargeItems.filter((_, i: number) => i !== index);
    setChargeItems(newChargeItems);
    const updatedChargeItemsWithoutObject = newChargeItems.map(
      ({ charge_item_definition_object: _discard, ...chargeItem }) =>
        chargeItem,
    );
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: updatedChargeItemsWithoutObject }],
      questionnaireResponse.question_id,
    );
  };

  const handleUpdateChargeItem = (
    index: number,
    updates: ApplyChargeItemDefinitionRequestWithObject,
  ) => {
    const newChargeItems = chargeItems.map((ci, i: number) => {
      if (i !== index) return ci;
      return { ...ci, ...updates };
    });

    setChargeItems(newChargeItems);
    const updatedChargeItemsWithoutObject = newChargeItems.map(
      ({ charge_item_definition_object: _discard, ...chargeItem }) =>
        chargeItem,
    );
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: updatedChargeItemsWithoutObject }],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-4">
      {chargeItems.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("item")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chargeItems.map((chargeItem, index) => (
              <ChargeItemForm
                key={`${chargeItem.charge_item_definition_object.title}-${index}`}
                chargeItem={chargeItem}
                onUpdate={(updates) => handleUpdateChargeItem(index, updates)}
                onRemove={() => handleRemoveChargeItem(index)}
                disabled={disabled}
                errors={errors}
                questionId={questionnaireResponse.question_id}
                index={index}
              />
            ))}

            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <div className="space-y-2 w-full">
        <Autocomplete
          options={
            chargeItemDefinitions?.results?.map((cid) => ({
              label: cid.title,
              value: cid.id,
            })) || []
          }
          value={selectedChargeItemDefinition?.id || ""}
          onChange={(value) => {
            const selectedCID = chargeItemDefinitions?.results.find(
              (cid) => cid.id === value,
            );
            if (!selectedCID) return;
            setSelectedChargeItemDefinition(selectedCID);
          }}
          onSearch={setCidSearch}
          placeholder={t("select_charge_item_definition")}
          isLoading={isLoading}
          noOptionsMessage={t("no_charge_item_definitions_found")}
          disabled={disabled}
          data-cy="charge-item-definition-search"
        />
      </div>
    </div>
  );
}
