import { InfoIcon, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import UserSelector from "@/components/Common/UserSelector";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { UserReadMinimal } from "@/types/user/user";

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
  question: Question;
}

const CHARGE_ITEM_FIELDS = {
  QUANTITY: {
    key: "quantity",
    required: true,
  },
} as const;

interface ApplyChargeItemDefinitionRequestWithObject extends ApplyChargeItemDefinitionRequest {
  charge_item_definition_object: ChargeItemDefinitionRead;
  performer_actor_object?: UserReadMinimal;
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
  facilityId?: string;
}

function ChargeItemForm({
  chargeItem,
  onUpdate,
  onRemove,
  disabled,
  errors,
  questionId,
  index,
  facilityId,
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
              <MonetaryDisplay
                amount={
                  chargeItem.charge_item_definition_object.price_components?.[0]
                    ?.amount || 0
                }
              />
            </span>
            {chargeItem.charge_item_definition_object.price_components?.length >
              0 && (
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
                      chargeItem.charge_item_definition_object.price_components
                    }
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <UserSelector
          selected={chargeItem.performer_actor_object}
          onChange={(user) => {
            onUpdate?.({
              ...chargeItem,
              performer_actor: user.id,
              performer_actor_object: user,
            });
          }}
          placeholder={t("select_performer")}
          facilityId={facilityId}
          disabled={disabled}
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
  question,
}: ChargeItemQuestionProps) {
  const { t } = useTranslation();
  const [selectedChargeItemDefinition, setSelectedChargeItemDefinition] =
    useState<ChargeItemDefinitionRead | null>(null);
  const [chargeItems, setChargeItems] = useState<
    ApplyChargeItemDefinitionRequestWithObject[]
  >([]);

  useEffect(() => {
    if (selectedChargeItemDefinition) {
      const newChargeItem: ApplyChargeItemDefinitionRequestWithObject = {
        quantity: "1",
        encounter: encounterId,
        charge_item_definition: selectedChargeItemDefinition.slug,
        charge_item_definition_object: selectedChargeItemDefinition,
      };

      // Automatically add the item when selected
      const updatedChargeItems = [...chargeItems, newChargeItem];
      setChargeItems(updatedChargeItems);
      const updatedChargeItemsWithoutObject = updatedChargeItems.map(
        ({
          charge_item_definition_object: _discard,
          performer_actor_object: _discardPerformer,
          ...chargeItem
        }) => chargeItem,
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
    encounterId,
    chargeItems,
    updateQuestionnaireResponseCB,
    questionnaireResponse.question_id,
  ]);

  const handleRemoveChargeItem = (index: number) => {
    const newChargeItems = chargeItems.filter((_, i: number) => i !== index);
    setChargeItems(newChargeItems);
    const updatedChargeItemsWithoutObject = newChargeItems.map(
      ({
        charge_item_definition_object: _discard,
        performer_actor_object: _discardPerformer,
        ...chargeItem
      }) => chargeItem,
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
      ({
        charge_item_definition_object: _discard,
        performer_actor_object: _discardPerformer,
        ...chargeItem
      }) => chargeItem,
    );
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: updatedChargeItemsWithoutObject }],
      questionnaireResponse.question_id,
    );
  };

  return (
    <div className="space-y-4">
      <QuestionLabel question={question} />
      {chargeItems.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("item")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("performer")}</TableHead>
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
                facilityId={facilityId}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <div className="space-y-2 w-full">
        <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
          facilityId={facilityId}
          value={selectedChargeItemDefinition || undefined}
          onValueChange={(selectedDef) => {
            if (!selectedDef) {
              setSelectedChargeItemDefinition(null);
              return;
            }
            setSelectedChargeItemDefinition(
              selectedDef as ChargeItemDefinitionRead,
            );
          }}
          placeholder={t("select_charge_item_definition")}
          disabled={disabled}
          className="w-full"
          resourceType={ResourceCategoryResourceType.charge_item_definition}
          listDefinitions={{
            queryFn: chargeItemDefinitionApi.listChargeItemDefinition,
            pathParams: { facilityId },
            queryParams: { status: ChargeItemDefinitionStatus.active },
          }}
          translationBaseKey="charge_item_definition"
        />
      </div>
    </div>
  );
}
