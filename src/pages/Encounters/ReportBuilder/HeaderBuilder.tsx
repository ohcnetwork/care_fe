import { Trash2Icon } from "lucide-react";
import React, { useCallback, useState } from "react";
import {
  Control,
  Controller,
  UseFormReturn,
  useFieldArray,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
import { FONT_WEIGHT_OPTIONS } from "@/types/reportTemplate/reportTemplate";

const AlignmentInput = ({
  control,
  rowIndex,
  elementIndex,
}: {
  control: Control<ReportTemplateFormData>;
  rowIndex: number;
  elementIndex: number;
}) => (
  <Controller
    control={control}
    name={`config.header.rows.${rowIndex}.${elementIndex}.align`}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Alignment</FormLabel>
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

const TextElement = React.memo(function TextElement({
  rowIndex,
  elementIndex,
  control,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.text`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text</FormLabel>
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
            <FormLabel>Size</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.weight`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Weight</FormLabel>
            <Select
              value={field.value?.toString() || "400"}
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weight" />
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
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.file_name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>File Name</FormLabel>
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
            <FormLabel>URL</FormLabel>
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
            <FormLabel>Width</FormLabel>
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
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.length`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Length</FormLabel>
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
            <FormLabel>Stroke</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select stroke" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
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

const DateTimeElement = React.memo(function DateTimeElement({
  rowIndex,
  elementIndex,
  control,
}: {
  rowIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 items-start">
      <Controller
        control={control}
        name={`config.header.rows.${rowIndex}.${elementIndex}.label`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
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
            <FormLabel>Format</FormLabel>
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
            <FormLabel>Fill Color</FormLabel>
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
            <FormLabel>Weight</FormLabel>
            <Select
              value={field.value?.toString() || "400"}
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weight" />
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
  row: any[];
  form: UseFormReturn<ReportTemplateFormData>;
  onRemoveRow: (rowIndex: number) => void;
  onAddElement: (rowIndex: number, type: string) => number;
  onRemoveElement: (rowIndex: number, elementIndex: number) => void;
  activeElement: number | null;
  setActiveElement: (activeElement: number | null) => void;
}

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
      setActiveElement(activeElement === index ? null : index);
    },
    [activeElement, setActiveElement],
  );

  const handleAddElement = useCallback(
    (rowIndex: number, type: string) => {
      const newIndex = onAddElement(rowIndex, type);
      setActiveElement(newIndex);
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

  const RowButtons = ({
    rowIndex,
    size = "sm",
  }: {
    rowIndex: number;
    size?: "sm" | "xs" | "default" | "lg" | "icon";
  }) => {
    return (
      <>
        <Button
          size={size}
          variant="outline"
          onClick={() => handleAddElement(rowIndex, "text")}
        >
          {t("add_text")}
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={() => handleAddElement(rowIndex, "image")}
        >
          {t("add_image")}
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={() => handleAddElement(rowIndex, "rule")}
        >
          {t("add_rule")}
        </Button>
        <Button
          size={size}
          variant="outline"
          onClick={() => handleAddElement(rowIndex, "datetime")}
        >
          {t("add_datetime")}
        </Button>
        <Button
          size={size}
          variant="white"
          onClick={() => onRemoveRow(rowIndex)}
        >
          <CareIcon icon="l-trash" className="w-4 h-4" />
        </Button>
      </>
    );
  };

  return (
    <div className="border rounded p-2">
      {row.length > 0 ? (
        <div className="flex justify-end items-center gap-2">
          <RowButtons rowIndex={rowIndex} />
        </div>
      ) : (
        <div className="flex mt-2 justify-center items-center gap-2">
          <RowButtons rowIndex={rowIndex} size="default" />
        </div>
      )}

      {/* Element Tabs */}
      <div className="flex gap-4 p-3">
        {row.map((element, elementIndex) => (
          <Button
            variant="white"
            key={elementIndex}
            className={`flex items-center gap-2 p-2 rounded-md ${
              activeElement === elementIndex
                ? "bg-gray-100 hover:bg-gray-100 scale-105"
                : ""
            }`}
            onClick={() => toggleElement(elementIndex)}
          >
            <CareIcon icon={getElementIcon(element.type)} className="w-4 h-4" />
            <span
              className={cn(
                activeElement === elementIndex
                  ? "font-semibold text-base"
                  : "text-sm",
              )}
            >
              {t(element.type)}
            </span>
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveElement(rowIndex, elementIndex);
              }}
            >
              <Trash2Icon className="w-3 h-3" />
            </Button>
          </Button>
        ))}
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
  const [activeElement, setActiveElement] = useState<number | null>(null);

  const rows = form.watch("config.header.rows");

  const handleAddRow = useCallback(() => {
    append([]);
  }, [append]);

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
            text: "New Text",
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
            label: "Created On",
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
      setActiveElement(newElementIndex);
      return newElementIndex;
    },
    [form, update],
  );

  const handleRemoveElement = useCallback(
    (rowIndex: number, elementIndex: number) => {
      const currentRow = form.getValues(`config.header.rows.${rowIndex}`);
      const updatedRow = [...currentRow];
      updatedRow.splice(elementIndex, 1);
      update(rowIndex, updatedRow);
    },
    [form, update],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header Configuration</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {fields.map((field, rowIndex) => (
          <HeaderRow
            key={field.id}
            rowIndex={rowIndex}
            row={rows[rowIndex] || []}
            form={form}
            onRemoveRow={handleRemoveRow}
            onAddElement={handleAddElement}
            onRemoveElement={handleRemoveElement}
            activeElement={activeElement}
            setActiveElement={setActiveElement}
          />
        ))}
        <Button type="button" onClick={handleAddRow} className="mt-4">
          {t("add_row")}
        </Button>
      </CardContent>
    </Card>
  );
});
