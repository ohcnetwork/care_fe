import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Control,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { ReportTemplateFormData } from "@/pages/Encounters/ReportBuilder/schema";
import {
  DateFormats,
  FONT_SIZES,
  FONT_WEIGHT_OPTIONS,
  HEADER_ALIGNMENT_OPTIONS,
  HeaderElementType,
} from "@/types/reportTemplate/reportTemplate";

const RATIO_PER_COLUMN = 6;

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
              {HEADER_ALIGNMENT_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {t(option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

function RatioBuilder({
  form,
  rowIndex,
  column,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
  rowIndex: number;
  column: HeaderElementType[];
}) {
  const { t } = useTranslation();
  const [totalRatio, setTotalRatio] = useState(RATIO_PER_COLUMN);
  const [lockRatio, setLockRatio] = useState(false);

  const columnLength = column?.length ?? 0;

  useEffect(() => {
    const initialTotalRatio =
      columnLength * RATIO_PER_COLUMN || RATIO_PER_COLUMN;
    setTotalRatio(initialTotalRatio);
    if (lockRatio && columnLength > 0) {
      setRatios(initialTotalRatio / columnLength);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnLength, lockRatio]);

  const setRatios = (newRatio: number, skipIndex?: number) => {
    column.forEach((_, index) => {
      if (skipIndex === undefined || index !== skipIndex) {
        form.setValue(
          `config.header.rows.${rowIndex}.size_ratio.${index}`,
          newRatio,
        );
      }
    });
  };

  const sizeRatio =
    useWatch({
      control: form.control,
      name: `config.header.rows.${rowIndex}.size_ratio`,
    }) || Array(columnLength).fill(1);

  const handleTotalRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalRatio = parseInt(e.target.value, 10);
    setTotalRatio(newTotalRatio);
    if (lockRatio) {
      setRatios(newTotalRatio / columnLength);
    }
  };

  const handleRatioChange = (curIndex: number, value: number) => {
    const totalRatioMinusCurrent = totalRatio - value;
    if (lockRatio) {
      const dividedRatio = totalRatioMinusCurrent / (columnLength - 1);
      setRatios(dividedRatio, curIndex);
    }
  };

  const isZeroValue = sizeRatio.some((value) => value === 0);
  const ratioSum = sizeRatio.reduce((acc, value) => acc + value, 0);

  if (columnLength === 0 || columnLength === 1) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex flex-col gap-2">
          <Label htmlFor="total-ratio">{t("total_ratio")}</Label>
          <Input
            id="total-ratio"
            type="number"
            value={totalRatio}
            onChange={handleTotalRatioChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lock-ratio">{t("lock_ratios")}</Label>
          <Switch
            id="lock-ratio"
            checked={lockRatio}
            onCheckedChange={setLockRatio}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 my-2"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {column?.map((column, index) => (
          <SizeRatioInput
            key={`${index}-${column.type}`}
            control={form.control}
            rowIndex={rowIndex}
            elementIndex={index}
            maxValue={totalRatio}
            elementType={column.type}
            onChange={handleRatioChange}
          />
        ))}
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">
          {t("preview_of_proportions")}
        </h4>
        {ratioSum !== totalRatio ? (
          <p className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded-md">
            {t("preview_proportions_error")}
          </p>
        ) : isZeroValue ? (
          <p className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded-md">
            {t("preview_proportions_zero_error")}
          </p>
        ) : (
          <>
            <div className="flex w-full">
              {column?.map((col, index) => {
                const ratio = sizeRatio[index] || 1;
                const width = `${(ratio / totalRatio) * 100}%`;
                return (
                  <div
                    key={`preview-${index}`}
                    className="h-12 flex items-center justify-center text-xs"
                    style={{
                      width,
                      backgroundColor: index % 2 ? "#e8f5e9" : "#e3f2fd",
                    }}
                  >
                    {col.type === "text" && <span className="text-lg">T</span>}
                    {col.type === "image" && <span>📷</span>}
                    {col.type === "rule" && <span>━</span>}
                    {col.type === "datetime" && <span>📅</span>}
                    <span className="ml-1">{ratio}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t("total_ratio")}: {totalRatio}
              {column?.map((col, index) => {
                const ratio = sizeRatio[index];
                return ` (${col.type}: ${((ratio / totalRatio) * 100).toFixed(2)}%)`;
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const SizeRatioInput = ({
  control,
  rowIndex,
  elementIndex,
  maxValue,
  elementType,
  onChange,
}: {
  control: Control<ReportTemplateFormData>;
  rowIndex: number;
  elementIndex: number;
  maxValue: number;
  elementType: string;
  onChange: (curIndex: number, value: number) => void;
}) => {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={`config.header.rows.${rowIndex}.size_ratio.${elementIndex}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t("size_ratio")}: {elementType}
          </FormLabel>
          <div className="flex flex-col sm:flex-row items-center gap-2">
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
                onChange(elementIndex, value);
                field.onChange(value);
              }}
              className="w-full sm:w-1/6"
            />
            <Slider
              value={[field.value]}
              min={1}
              max={maxValue}
              step={1}
              onValueChange={(value) => {
                onChange(elementIndex, value[0]);
                field.onChange(value[0]);
              }}
              className="w-full sm:w-5/6"
            />
          </div>
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
                  value={field.value ?? 100}
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
    </div>
  );
}

function HeaderElement({
  rowIndex,
  elementIndex,
  control,
  type,
}: {
  rowIndex: number;
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
  rowIndex: number;
  column: HeaderElementType[];
  form: UseFormReturn<ReportTemplateFormData>;
  onRemoveRow: (rowIndex: number) => void;
}

const RowButtons = ({
  rowIndex,
  size = "sm",
  handleAddElement,
}: {
  rowIndex: number;
  size?: "sm" | "xs" | "default" | "lg" | "icon";
  handleAddElement: (rowIndex: number, type: HeaderElementType["type"]) => void;
}) => {
  const { t } = useTranslation();
  const buttonClasses =
    "w-full flex flex-col items-center gap-1 px-5 py-8 rounded-none bg-green-50 text-green-900 hover:bg-green-200/80 hover:text-green-900";
  return (
    <>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "text")}
        className={cn(buttonClasses, "border-r border-gray-200")}
      >
        <CareIcon icon="l-text" className="w-4 h-4" />
        {t("add_text")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "image")}
        className={cn(
          buttonClasses,
          "border-t sm:border-t-0 border-r border-gray-200",
        )}
      >
        <CareIcon icon="l-image-v" className="w-4 h-4" />
        {t("add_image")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "rule")}
        className={cn(
          buttonClasses,
          "border-t sm:border-t-0 border-r border-gray-200",
        )}
      >
        <CareIcon icon="l-minus" className="w-4 h-4" />
        {t("add_rule")}
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        onClick={() => handleAddElement(rowIndex, "datetime")}
        className={cn(buttonClasses, "border-t sm:border-t-0 border-gray-200")}
      >
        <CareIcon icon="l-calender" className="w-4 h-4" />
        {t("add_datetime")}
      </Button>
    </>
  );
};

function HeaderRow({
  rowIndex,
  column: column,
  form,
  onRemoveRow,
}: HeaderRowProps) {
  const { t } = useTranslation();
  const [activeElement, setActiveElement] = useState<number | null>(null);
  const [removeRowDialog, setRemoveRowDialog] = useState<{
    display: boolean;
    rowIndex: number | null;
  }>({
    display: false,
    rowIndex: null,
  });

  useEffect(() => {
    if (column.length > 0 && activeElement === null) {
      setActiveElement(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column]);

  const toggleElement = (index: number) => {
    setActiveElement(index);
  };

  const handleAddElement = (
    rowIndex: number,
    type: HeaderElementType["type"],
  ) => {
    const currentColumn =
      form.getValues(`config.header.rows.${rowIndex}.columns`) || [];
    const currentSizeRatio =
      form.getValues(`config.header.rows.${rowIndex}.size_ratio`) || [];

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
          size: "12pt",
          weight: 400,
          align: "left",
        };
        break;
      case "image":
        newElement = {
          type: "image",
          file_name: "",
          url: "",
          width: "100",
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
          format: "[day]/[month]/[year]",
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

    let updatedColumn = [...currentColumn];
    if (activeElement === null) {
      updatedColumn.push(newElement);
    } else {
      updatedColumn = [
        ...currentColumn.slice(0, activeElement + 1),
        newElement,
        ...currentColumn.slice(activeElement + 1),
      ];
    }
    const updatedRow = {
      size_ratio: newSizeRatio,
      columns: updatedColumn,
    };
    form.setValue(`config.header.rows.${rowIndex}`, updatedRow);
    setActiveElement(
      activeElement === null ? updatedColumn.length - 1 : activeElement + 1,
    );
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
    form.setValue(`config.header.rows.${rowIndex}`, updatedRow);
    const newColumnLength = updatedRow.columns.length;
    if (newColumnLength === 0) {
      setActiveElement(null);
    } else {
      if (elementIndex === 0) {
        setActiveElement(0);
      } else if (elementIndex === currentColumn.length - 1) {
        setActiveElement(newColumnLength - 1);
      } else {
        setActiveElement(elementIndex - 1);
      }
    }
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

  const rowColumnError =
    form.formState.errors?.config?.header?.rows?.[rowIndex]?.columns?.message;

  return (
    <>
      <Card className="overflow-clip">
        {/* Element Tabs */}
        <CardHeader
          className={cn(
            "sm:flex-row flex-wrap flex-col justify-between gap-2",
            column.length === 0 && "justify-end",
          )}
        >
          {column.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-start gap-2">
              <Select
                value={`${activeElement}`}
                onValueChange={(value) => toggleElement(Number(value))}
              >
                <SelectTrigger className="bg-green-100">
                  {activeElement !== null && (
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
                  )}
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
              {activeElement !== null && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveElement(rowIndex, activeElement)}
                >
                  <span className="text-sm">
                    {t(`remove_${column[activeElement].type}`)}
                  </span>
                  <Trash2Icon className="size-3" />
                </Button>
              )}
            </div>
          )}
          <Button
            type="button"
            size={"sm"}
            variant="destructive"
            onClick={() =>
              setRemoveRowDialog({
                display: true,
                rowIndex: rowIndex,
              })
            }
            className="self-end"
          >
            <Trash2Icon className="size-3" />
            <span className="text-sm">{t("remove_row")}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Element Content */}
          {column.length > 0 &&
            activeElement !== null &&
            column[activeElement] && (
              <div className="p-4">
                <HeaderElement
                  rowIndex={rowIndex}
                  elementIndex={activeElement}
                  control={form.control}
                  type={column[activeElement].type}
                />
              </div>
            )}
          {column.length === 0 && rowColumnError && (
            <p className="text-sm text-red-800 bg-red-50 p-2 rounded-md">
              {rowColumnError}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center p-0">
          <RowButtons
            size="default"
            rowIndex={rowIndex}
            handleAddElement={handleAddElement}
          />
        </CardFooter>
      </Card>
      <Dialog
        open={removeRowDialog.display}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveRowDialog({
              display: false,
              rowIndex: null,
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remove_row")}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{t("remove_row_confirmation")}</DialogDescription>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() =>
                setRemoveRowDialog({
                  display: false,
                  rowIndex: null,
                })
              }
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onRemoveRow(removeRowDialog.rowIndex!);
                setRemoveRowDialog({
                  display: false,
                  rowIndex: null,
                });
              }}
            >
              {t("remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function HeaderBuilder({
  form,
}: {
  form: UseFormReturn<ReportTemplateFormData>;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "config.header.rows",
  });
  const [activeRow, setActiveRow] = useState<number | null>(null);

  const rows = form.watch("config.header.rows");

  const handleAddRow = () => {
    const rowLength = rows.length;
    append([
      {
        size_ratio: [1],
        columns: [
          {
            type: "text",
            text: t("new_text"),
            size: "12pt",
            weight: 400,
            align: "left",
          },
        ],
      },
    ]);
    setActiveRow(rowLength);
  };

  const handleRemoveRow = (rowIndex: number) => {
    remove(rowIndex);
    let newActiveRowIndex: number | null = null;
    // If there will be no fields after removal
    if (fields.length <= 1) {
      newActiveRowIndex = null;
    }
    // removing the first row and there are more rows
    else if (rowIndex === 0) {
      newActiveRowIndex = 0; // Next row will become first
    }
    // removing a row in the middle
    else if (rowIndex < fields.length - 1) {
      newActiveRowIndex = rowIndex; // Keep same index as next row will shift up
    }
    // removing last row
    else {
      newActiveRowIndex = rowIndex - 1; // Set to previous row
    }
    setActiveRow(newActiveRowIndex);
  };

  const rowErrors = form.formState.errors?.config?.header?.rows;
  const rowHasErrors = (index: number) => {
    return rowErrors?.[index];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          {t("header")}
          <Button
            type="button"
            onClick={handleAddRow}
            className="w-full sm:w-auto"
          >
            {t("add_row")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col flex-wrap sm:flex-row gap-2">
          {fields.map((field, rowIndex) => (
            <Button
              key={field.id}
              type="button"
              variant="white"
              onClick={() => setActiveRow(rowIndex)}
              className={cn(
                activeRow === rowIndex && "bg-green-100",
                rowHasErrors(rowIndex) && "border-red-500 border-1 bg-red-50",
              )}
            >
              {t("row")} {rowIndex + 1}
            </Button>
          ))}
        </div>
        {activeRow !== null && (
          <>
            <HeaderRow
              rowIndex={activeRow}
              column={rows[activeRow]?.columns || []}
              form={form}
              onRemoveRow={handleRemoveRow}
            />
            <RatioBuilder
              form={form}
              rowIndex={activeRow}
              column={rows[activeRow]?.columns || []}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
