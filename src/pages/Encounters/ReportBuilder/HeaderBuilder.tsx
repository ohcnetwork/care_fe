import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Control, UseFormReturn, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
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
  DateFormats,
  FONT_SIZES,
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
    <FormField
      control={control}
      name={`config.header.rows.${rowIndex}.columns.${elementIndex}.align`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("alignment")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("alignment")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">{t("left")}</SelectItem>
              <SelectItem value="center">{t("center")}</SelectItem>
              <SelectItem value="right">{t("right")}</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const SizeRatioInput = ({
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
    <FormField
      control={control}
      name={`config.header.rows.${rowIndex}.size_ratio.${elementIndex}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("size_ratio")}</FormLabel>
          <Input
            {...field}
            value={field.value}
            defaultValue={1}
            type="number"
            placeholder="1"
            pattern="\d*"
            inputMode="numeric"
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              field.onChange(value);
            }}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

function TextElement({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.text`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("text")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.size`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("size")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("select_size")} />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.weight`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("weight")}</FormLabel>
            <Select
              value={field.value?.toString() || "400"}
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_weight")} />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
      <SizeRatioInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
}

function ImageElement({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.file_name`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("file_name")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.url`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("url")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.width`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("width", { unit: "%" })}</FormLabel>
            <FormControl>
              <div className="relative flex items-center">
                <Input {...field} />
                <span className="absolute right-3 text-xs">%</span>
              </div>
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
      <SizeRatioInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
}

function RuleElement({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.length`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("length", { unit: "%" })}</FormLabel>
            <FormControl>
              <div className="relative flex items-center">
                <Input
                  {...field}
                  type="number"
                  value={field.value}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    field.onChange(value);
                  }}
                />
                <span className="absolute right-10 text-xs">%</span>
              </div>
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.stroke`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("stroke")}</FormLabel>
            <Input {...field} type="color" />
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
      <SizeRatioInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
}

function DateTimeElement({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.label`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("label")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.format`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("format")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_format")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DateFormats).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.style.fill`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("fill_color")}</FormLabel>
            <FormControl>
              <Input {...field} type="color" />
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`config.header.rows.${rowIndex}.columns.${elementIndex}.style.weight`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("weight")}</FormLabel>
            <Select
              value={field.value?.toString() || "400"}
              onValueChange={(value) => field.onChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_weight")} />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
      <AlignmentInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
      <SizeRatioInput
        control={control}
        rowIndex={rowIndex}
        elementIndex={elementIndex}
      />
    </div>
  );
}

function HeaderElement({
  columnIndex: rowIndex,
  elementIndex,
  control,
  type,
}: {
  columnIndex: number;
  elementIndex: number;
  control: Control<ReportTemplateFormData>;
  type: HeaderElementType["type"];
}) {
  const elementKey = `${rowIndex}-${elementIndex}-${type}`;
  switch (type) {
    case "text":
      return (
        <TextElement
          key={elementKey}
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    case "image":
      return (
        <ImageElement
          key={elementKey}
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    case "rule":
      return (
        <RuleElement
          key={elementKey}
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    case "datetime":
      return (
        <DateTimeElement
          key={elementKey}
          rowIndex={rowIndex}
          elementIndex={elementIndex}
          control={control}
        />
      );
    default:
      return null;
  }
}

interface HeaderRowProps {
  columnIndex: number;
  column: HeaderElementType[];
  form: UseFormReturn<ReportTemplateFormData>;
  onRemoveRow: (rowIndex: number) => void;
  onAddElement: (rowIndex: number, type: HeaderElementType["type"]) => void;
  onRemoveElement: (rowIndex: number, elementIndex: number) => void;
  activeElement: number;
  setActiveElement: (elementIndex: number) => void;
}

const RowButtons = ({
  columnIndex: rowIndex,
  size = "sm",
  handleAddElement,
}: {
  columnIndex: number;
  size?: "sm" | "xs" | "default" | "lg" | "icon";
  handleAddElement: (rowIndex: number, type: HeaderElementType["type"]) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row items-center rounded-lg border overflow-clip">
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "text")}
        className="w-full flex flex-col items-center gap-1 px-5 py-8 rounded-none border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-text" className="w-4 h-4" />
        {t("add_text")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "image")}
        className="w-full flex flex-col items-center gap-1 px-5 py-8 rounded-none border-t sm:border-t-0 border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-image-v" className="w-4 h-4" />
        {t("add_image")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "rule")}
        className="w-full flex flex-col items-center gap-1 px-5 py-8 rounded-none border-t sm:border-t-0 border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-minus" className="w-4 h-4" />
        {t("add_rule")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "datetime")}
        className="w-full flex flex-col items-center gap-1 px-4 py-8 rounded-none border-t sm:border-t-0 border-r border-gray-200 bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900"
      >
        <CareIcon icon="l-calender" className="w-4 h-4" />
        {t("add_datetime")}
      </Button>
    </div>
  );
};

function HeaderRow({
  columnIndex: columnIndex,
  column: column,
  form,
  onRemoveRow,
  onAddElement,
  onRemoveElement,
  activeElement,
  setActiveElement,
}: HeaderRowProps) {
  const { t } = useTranslation();

  const toggleElement = (index: number) => {
    setActiveElement(index);
  };

  const handleAddElement = (
    rowIndex: number,
    type: HeaderElementType["type"],
  ) => {
    onAddElement(rowIndex, type);
  };

  const getElementIcon = (type: HeaderElementType["type"]) => {
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

  if (column.length === 0) {
    return (
      <div className="border rounded-lg p-2 bg-gray-50 flex justify-center items-center gap-2">
        <RowButtons
          size="lg"
          columnIndex={columnIndex}
          handleAddElement={handleAddElement}
        />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-2">
      {/* Element Tabs */}
      <div className="p-3 flex sm:flex-row flex-col justify-between gap-2">
        {column.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-start gap-2">
            <Select
              value={`${activeElement}`}
              onValueChange={(value) => toggleElement(Number(value))}
            >
              <SelectTrigger className="bg-green-100">
                <SelectValue placeholder={t("add_element")}>
                  <CareIcon
                    icon={getElementIcon(column[activeElement].type)}
                    className="w-4 h-4 text-green-900"
                  />
                  <span className="text-sm text-green-900">
                    {activeElement}
                    {". "}
                    {t(`${column[activeElement].type}`)}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {column.map((element, elementIndex) => (
                  <SelectItem
                    key={elementIndex}
                    value={elementIndex.toString()}
                  >
                    {t(`${element.type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onRemoveElement(columnIndex, activeElement)}
            >
              <span className="text-sm">
                {t(`remove_${column[activeElement].type}`)}
              </span>
              <Trash2Icon className="size-3" />
            </Button>
          </div>
        )}
        <Button
          type="button"
          size={"sm"}
          variant="destructive"
          onClick={() => onRemoveRow(columnIndex)}
        >
          <Trash2Icon className="size-3" />
          <span className="text-sm">{t("remove_row")}</span>
        </Button>
      </div>

      {/* Element Content */}
      {activeElement !== null && column[activeElement] && (
        <div className="p-4">
          <HeaderElement
            columnIndex={columnIndex}
            elementIndex={activeElement}
            control={form.control}
            type={column[activeElement].type}
          />
        </div>
      )}

      <RowButtons
        size="default"
        columnIndex={columnIndex}
        handleAddElement={handleAddElement}
      />
    </div>
  );
}

export default function HeaderBuilder({
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

  const handleAddRow = () => {
    const rowLength = rows.length;
    append([
      {
        size_ratio: [1],
        columns: [
          {
            type: "text",
            text: t("new_text"),
            size: "medium",
            weight: 400,
            align: "left",
          },
        ],
      },
    ]);
    setActiveElements((prev) => ({ ...prev, [rowLength]: 0 }));
  };

  const handleRemoveRow = (rowIndex: number) => {
    const currentActiveElements = { ...activeElements };
    delete currentActiveElements[rowIndex];
    const newActiveElements: Record<number, number> = {};
    Object.entries(currentActiveElements).forEach(([oldIndex, value]) => {
      const newIndex =
        Number(oldIndex) > rowIndex
          ? Number(oldIndex) - 1 // Decrease index for rows after the removed one
          : Number(oldIndex); // Keep same index for rows before the removed one
      newActiveElements[newIndex] = value;
    });
    remove(rowIndex);
    setActiveElements(newActiveElements);
  };

  const handleAddElement = (
    rowIndex: number,
    type: HeaderElementType["type"],
  ) => {
    const currentColumn =
      form.getValues(`config.header.rows.${rowIndex}.columns`) || [];
    const currentSizeRatio =
      form.getValues(`config.header.rows.${rowIndex}.size_ratio`) || [];
    const updatedColumn = [...currentColumn];
    const newElementIndex = updatedColumn.length;
    const newSizeRatio = Array.from(
      { length: currentSizeRatio.length + 1 },
      () => 1,
    );

    let newElement: HeaderElementType;
    switch (type) {
      case "text":
        newElement = {
          type: "text",
          text: t("new_text"),
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
          length: 100,
          stroke: "#808080",
          align: "center",
        };
        break;
      case "datetime":
        newElement = {
          type: "datetime",
          label: t("created_on"),
          format: "DD/MM/YYYY",
          style: {
            fill: "#808080",
            weight: 400,
          },
          align: "right",
        };
        break;
      default:
        throw new Error(`Unsupported element type: ${type}`);
    }

    updatedColumn.push(newElement);
    const updatedRow = {
      size_ratio: newSizeRatio,
      columns: updatedColumn,
    };
    update(rowIndex, updatedRow);
    setActiveElements((prev) => ({ ...prev, [rowIndex]: newElementIndex }));
  };

  const handleRemoveElement = (rowIndex: number, elementIndex: number) => {
    const currentRow = form.getValues(`config.header.rows.${rowIndex}`);
    const currentColumn =
      form.getValues(`config.header.rows.${rowIndex}.columns`) || [];
    const updatedRow = {
      size_ratio: currentRow.size_ratio?.filter(
        (_, index) => index !== elementIndex,
      ),
      columns: currentColumn.filter((_, index) => index !== elementIndex),
    };
    update(rowIndex, updatedRow);
    if (updatedRow.columns.length !== 0) {
      setActiveElements((prev) => ({
        ...prev,
        [rowIndex]: elementIndex > 0 ? elementIndex - 1 : elementIndex,
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("header")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {Object.keys(activeElements).length > 0 &&
          fields.map((field, rowIndex) => (
            <HeaderRow
              key={field.id}
              columnIndex={rowIndex}
              column={rows[rowIndex]?.columns || []}
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
          {t("add_row")}
        </Button>
      </CardContent>
    </Card>
  );
}
