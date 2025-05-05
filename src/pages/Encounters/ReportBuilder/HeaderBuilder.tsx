import { Trash2Icon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  Control,
  Controller,
  UseFormReturn,
  useFieldArray,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ReportTemplateFormData } from "@/pages/Encounters/ReportBuilder/schema";
import {
  FONT_WEIGHT_OPTIONS,
  HeaderElementType,
} from "@/types/reportTemplate/reportTemplate";

const AlignmentInput = ({
  control,
  rowIndex,
  elementIndex,
}: {
  control: Control<ReportTemplateFormData>;
  rowIndex: number;
  elementIndex: number;
}) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={`config.header.rows.${rowIndex}.${elementIndex}.align`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("REPORT_BUILDER_ALIGNMENT")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("REPORT_BUILDER_SELECT_ALIGNMENT")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">
                {t("REPORT_BUILDER_ALIGN_LEFT")}
              </SelectItem>
              <SelectItem value="center">
                {t("REPORT_BUILDER_ALIGN_CENTER")}
              </SelectItem>
              <SelectItem value="right">
                {t("REPORT_BUILDER_ALIGN_RIGHT")}
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const TextElement = React.memo(function TextElement({
  rowIndex,
  elementIndex,
  control,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.text`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_TEXT")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.size`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_SIZE")}</FormLabel>
            <Input
              {...field}
              type="number"
              placeholder="10"
              pattern="\d*"
              inputMode="numeric"
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.weight`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_WEIGHT")}</FormLabel>
            <Select
              value={field.value?.toString() || "400"}
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("REPORT_BUILDER_SELECT_WEIGHT")} />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
});

const ImageElement = React.memo(function ImageElement({
  rowIndex,
  elementIndex,
  control,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.file_name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_FILE_NAME")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.url`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_URL")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.width`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_WIDTH")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
});

const RuleElement = React.memo(function RuleElement({
  rowIndex,
  elementIndex,
  control,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.length`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_LENGTH")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.stroke`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_STROKE")}</FormLabel>
            <Input {...field} type="color" />
            <FormMessage />
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
});

const DateTimeElement = React.memo(function DateTimeElement({
  rowIndex,
  elementIndex,
  control,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.label`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_LABEL")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.format`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_FORMAT")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.style.fill`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_FILL_COLOR")}</FormLabel>
            <FormControl>
              <Input {...field} type="color" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.style.weight`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("REPORT_BUILDER_WEIGHT")}</FormLabel>
            <Select
              value={field.value?.toString() || "400"}
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("REPORT_BUILDER_SELECT_WEIGHT")} />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
});

const HeaderElement = React.memo(function HeaderElement({
  rowIndex,
  elementIndex,
  control,
  type,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
  type: string;
}) {
  switch (type) {
    case "text":
      return (
        <TextElement
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    case "image":
      return (
        <ImageElement
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    case "rule":
      return (
        <RuleElement
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    case "datetime":
      return (
        <DateTimeElement
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    default:
      return null;
  }
});

interface HeaderRowProps {
  rowIndex: number;
  row: HeaderElementType[];
  form: UseFormReturn<ReportTemplateFormData>;
  onRemoveRow: (rowIndex: number) => void;
  onAddElement: (rowIndex: number, type: string) => void;
  onRemoveElement: (rowIndex: number, elementIndex: number) => void;
  activeElement: number;
  setActiveElement: (elementIndex: number) => void;
}

const RowButtons = ({
  rowIndex,
  size = "sm",
  handleAddElement,
}: {
  rowIndex: number;
  size?: "sm" | "xs" | "default" | "lg" | "icon";
  handleAddElement: (rowIndex: number, type: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-row items-center rounded-lg border overflow-clip">
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "text")}
        className="flex flex-col items-center gap-1 px-5 py-8 rounded-none border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-text" className="w-4 h-4" />
        {t("REPORT_BUILDER_ADD_TEXT")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "image")}
        className="flex flex-col items-center gap-1 px-5 py-8 rounded-none border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-image-v" className="w-4 h-4" />
        {t("REPORT_BUILDER_ADD_IMAGE")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "rule")}
        className="flex flex-col items-center gap-1 px-5 py-8 rounded-none border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-minus" className="w-4 h-4" />
        {t("REPORT_BUILDER_ADD_RULE")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "datetime")}
        className="flex flex-col items-center gap-1 px-4 py-8 rounded-none bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-calender" className="w-4 h-4" />
        {t("REPORT_BUILDER_ADD_DATETIME")}
      </Button>
    </div>
  );
};

const HeaderRow = React.memo(function HeaderRow({
  rowIndex,
  row,
  form,
  onRemoveRow,
  onAddElement,
  onRemoveElement,
  activeElement,
  setActiveElement,
}: HeaderRowProps) {
  const { t } = useTranslation();

  const toggleElement = useCallback(
    (index: number) => {
      setActiveElement(index);
    },
    [setActiveElement],
  );

  const handleAddElement = useCallback(
    (rowIndex: number, type: string) => {
      onAddElement(rowIndex, type);
    },
    [onAddElement],
  );

  const getElementIcon = (type: string) => {
    switch (type) {
      case "text":
        return "l-align-left";
      case "image":
        return "l-image-v";
      case "rule":
        return "l-minus";
      case "datetime":
        return "l-calender";
      default:
        return "l-align-left";
    }
  };

  if (row.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 flex justify-center items-center gap-2">
        <RowButtons
          size="lg"
          rowIndex={rowIndex}
          handleAddElement={handleAddElement}
        />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-2">
      {/* Element Tabs */}
      <div className="p-3 flex justify-between">
        <div className="flex justify-start">
          {row.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={activeElement.toString()}
                onValueChange={(value) => toggleElement(parseInt(value, 10))}
              >
                <SelectTrigger className="bg-green-100">
                  <SelectValue placeholder={t("REPORT_BUILDER_ADD_ELEMENT")}>
                    <CareIcon
                      icon={getElementIcon(row[activeElement].type)}
                      className="w-4 h-4 text-green-900"
                    />
                    <span className="text-sm text-green-900">
                      {t(
                        `REPORT_BUILDER_${row[activeElement].type.toUpperCase()}`,
                      )}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {row.map((element, elementIndex) => (
                    <SelectItem
                      key={elementIndex}
                      value={elementIndex.toString()}
                    >
                      {t(`REPORT_BUILDER_${element.type.toUpperCase()}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onRemoveElement(rowIndex, activeElement)}
              >
                <span className="text-sm">{t("remove")}</span>
                <Trash2Icon className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        <Button
          type="button"
          size={"sm"}
          variant="destructive"
          onClick={() => onRemoveRow(rowIndex)}
        >
          <Trash2Icon className="w-3 h-3" />
          <span className="text-sm">{t("remove_row")}</span>
        </Button>
      </div>

      {/* Element Content */}
      {activeElement !== null && row[activeElement] && (
        <div className="p-4">
          <HeaderElement
            rowIndex={rowIndex}
            elementIndex={activeElement}
            control={form.control}
            type={row[activeElement].type}
          />
        </div>
      )}

      <div className="mt-6 mb-4 flex justify-center items-center">
        <RowButtons
          size="default"
          rowIndex={rowIndex}
          handleAddElement={handleAddElement}
        />
      </div>
    </div>
  );
});

export const HeaderBuilder = React.memo(function HeaderBuilder({
  form,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
}) {
  const { t } = useTranslation();
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "config.header.rows",
  });
  const [activeElements, setActiveElements] = useState<Record<number, number>>(
    {},
  );

  const rows = form.watch("config.header.rows");

  useEffect(() => {
    if (Object.keys(activeElements).length === 0) {
      setActiveElements(
        rows.reduce((acc, _, index) => ({ ...acc, [index]: 0 }), {}),
      );
    }
  }, [rows, activeElements]);

  const handleAddRow = useCallback(() => {
    append([
      {
        type: "text",
        text: t("REPORT_BUILDER_NEW_TEXT"),
        size: "medium",
        weight: 400,
        align: "left",
      },
    ]);
  }, [append, t]);

  const handleRemoveRow = useCallback(
    (rowIndex: number) => {
      remove(rowIndex);
    },
    [remove],
  );

  const handleAddElement = useCallback(
    (rowIndex: number, type: string) => {
      const currentRow = form.getValues(`config.header.rows.${rowIndex}`) || [];
      const updatedRow = [...currentRow];
      const newElementIndex = updatedRow.length;

      let newElement: any;
      switch (type) {
        case "text":
          newElement = {
            type: "text",
            text: t("REPORT_BUILDER_NEW_TEXT"),
            size: "medium",
            weight: 400,
            align: "left",
          };
          break;
        case "image":
          newElement = {
            type: "image",
            file_name: "",
            url: "",
            width: "100%",
            align: "center",
          };
          break;
        case "rule":
          newElement = {
            type: "rule",
            length: "100%",
            stroke: "solid",
            align: "center",
          };
          break;
        case "datetime":
          newElement = {
            type: "datetime",
            label: t("REPORT_BUILDER_CREATED_ON"),
            format: "DD/MM/YYYY",
            style: {
              fill: "#000000",
              weight: 400,
            },
            align: "right",
          };
          break;
        default:
          throw new Error(`Unsupported element type: ${type}`);
      }

      updatedRow.push(newElement);
      update(rowIndex, updatedRow);
      setActiveElements((prev) => ({ ...prev, [rowIndex]: newElementIndex }));
    },
    [form, update, t],
  );

  const handleRemoveElement = useCallback(
    (rowIndex: number, elementIndex: number) => {
      const currentRow = form.getValues(`config.header.rows.${rowIndex}`);
      const updatedRow = [...currentRow];
      updatedRow.splice(elementIndex, 1);
      update(rowIndex, updatedRow);
      if (updatedRow.length !== 0) {
        setActiveElements((prev) => ({
          ...prev,
          [rowIndex]: elementIndex > 0 ? elementIndex - 1 : elementIndex,
        }));
      }
    },
    [form, update],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("REPORT_BUILDER_HEADER")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {Object.keys(activeElements).length > 0 &&
          fields.map((field, rowIndex) => (
            <HeaderRow
              key={field.id}
              rowIndex={rowIndex}
              row={rows[rowIndex] || []}
              form={form}
              onRemoveRow={handleRemoveRow}
              onAddElement={handleAddElement}
              onRemoveElement={handleRemoveElement}
              activeElement={activeElements[rowIndex]}
              setActiveElement={(index: number) =>
                setActiveElements((prev) => ({ ...prev, [rowIndex]: index }))
              }
            />
          ))}
        <Button type="button" onClick={handleAddRow} className="mt-4">
          {t("REPORT_BUILDER_ADD_ROW")}
        </Button>
      </CardContent>
    </Card>
  );
});
