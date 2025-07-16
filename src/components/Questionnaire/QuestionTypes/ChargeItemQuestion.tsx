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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ChargeItemStatus,
  ChargeItemUpsert,
} from "@/types/billing/chargeItem/chargeItem";
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
    note?: string,
  ) => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
}

const CHARGE_ITEM_FIELDS = {
  STATUS: {
    key: "status",
    required: true,
  },
  QUANTITY: {
    key: "quantity",
    required: true,
  },
} as const;

interface ChargeItemFormProps {
  chargeItem: ChargeItemUpsert;
  onUpdate?: (updates: ChargeItemUpsert) => void;
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
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  return (
    <TableRow>
      <TableCell>{chargeItem.title}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          value={chargeItem.quantity}
          onChange={(e) =>
            onUpdate?.({
              ...chargeItem,
              quantity: parseInt(e.target.value, 10),
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
        <Select
          value={chargeItem.status}
          onValueChange={(value: ChargeItemStatus) =>
            onUpdate?.({ ...chargeItem, status: value })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t("select_status")} />
          </SelectTrigger>
          <SelectContent>
            {Object.values([
              ChargeItemStatus.billable,
              ChargeItemStatus.planned,
            ]).map((status) => (
              <SelectItem key={status} value={status}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {questionId && index !== undefined && (
          <FieldError
            fieldKey={CHARGE_ITEM_FIELDS.STATUS.key}
            questionId={questionId}
            errors={errors}
            index={index}
          />
        )}
      </TableCell>
      <TableCell>
        <Input
          value={chargeItem.note || ""}
          onChange={(e) => onUpdate?.({ ...chargeItem, note: e.target.value })}
          disabled={disabled}
          placeholder={t("add_notes")}
        />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {chargeItem.unit_price_components?.length > 0 && (
              <Popover open={isPriceOpen} onOpenChange={setIsPriceOpen}>
                <PopoverTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsPriceOpen(true);
                    }}
                  >
                    <InfoIcon className="h-4 w-4 mr-2" />
                    <span>View Cost</span>
                  </DropdownMenuItem>
                </PopoverTrigger>
                <PopoverContent side="left" className="p-0">
                  <ChargeItemPriceDisplay
                    priceComponents={chargeItem.unit_price_components}
                  />
                </PopoverContent>
              </Popover>
            )}
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
    useState<string | null>(null);
  const [chargeItems, setChargeItems] = useState<ChargeItemUpsert[]>(
    (questionnaireResponse.values?.[0]?.value as ChargeItemUpsert[]) || [],
  );
  const [cidSearch, setCidSearch] = useState("");

  const { data: chargeItemDefinitions, isLoading } = useQuery({
    queryKey: ["charge_item_definitions", cidSearch],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: { limit: 100, status: "active", title: cidSearch },
    }),
  });

  const {
    data: selectedChargeItemDefinitionData,
    isLoading: isLoadingSelectedCID,
  } = useQuery({
    queryKey: ["charge_item_definition", selectedChargeItemDefinition],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: {
        facilityId,
        chargeItemDefinitionId: selectedChargeItemDefinition || "",
      },
    }),
    enabled: !!selectedChargeItemDefinition,
  });

  useEffect(() => {
    if (selectedChargeItemDefinition && selectedChargeItemDefinitionData) {
      const selectedCID = chargeItemDefinitions?.results.find(
        (cid) => cid.id === selectedChargeItemDefinition,
      );
      if (!selectedCID) return;

      const newChargeItem: ChargeItemUpsert = {
        title: selectedCID.title,
        status: ChargeItemStatus.billable,
        quantity: 1,
        unit_price_components: selectedCID.price_components,
        note: undefined,
        override_reason: undefined,
        encounter: encounterId,
      };

      // Automatically add the item when selected
      const updatedChargeItems = [...chargeItems, newChargeItem];
      setChargeItems(updatedChargeItems);
      updateQuestionnaireResponseCB(
        [{ type: "charge_item", value: updatedChargeItems }],
        questionnaireResponse.question_id,
      );

      // Reset selection after adding
      setSelectedChargeItemDefinition(null);
    }
  }, [
    selectedChargeItemDefinition,
    selectedChargeItemDefinitionData,
    chargeItemDefinitions,
    encounterId,
    chargeItems,
    updateQuestionnaireResponseCB,
    questionnaireResponse.question_id,
  ]);

  const handleRemoveChargeItem = (index: number) => {
    const newChargeItems = chargeItems.filter((_, i: number) => i !== index);
    setChargeItems(newChargeItems);
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: newChargeItems }],
      questionnaireResponse.question_id,
    );
  };

  const handleUpdateChargeItem = (index: number, updates: ChargeItemUpsert) => {
    const newChargeItems = chargeItems.map((ci, i: number) => {
      if (i !== index) return ci;
      return { ...ci, ...updates };
    });

    setChargeItems(newChargeItems);
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: newChargeItems }],
      questionnaireResponse.question_id,
    );
  };

  useEffect(() => {
    const initialChargeItems =
      (questionnaireResponse.values?.[0]?.value as ChargeItemUpsert[]) || [];

    if (JSON.stringify(initialChargeItems) !== JSON.stringify(chargeItems)) {
      setChargeItems(initialChargeItems);
    }
  }, [questionnaireResponse.values]);

  return (
    <div className="space-y-4">
      {chargeItems.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("item")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("note")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chargeItems.map((chargeItem, index) => (
              <ChargeItemForm
                key={`${chargeItem.title}-${index}`}
                chargeItem={chargeItem}
                onUpdate={(updates) => handleUpdateChargeItem(index, updates)}
                onRemove={() => handleRemoveChargeItem(index)}
                disabled={disabled}
                errors={errors}
                questionId={questionnaireResponse.question_id}
                index={index}
              />
            ))}

            {isLoadingSelectedCID && (
              <TableRow>
                <TableCell colSpan={5}>
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
          value={selectedChargeItemDefinition || ""}
          onChange={(value) => setSelectedChargeItemDefinition(value)}
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
