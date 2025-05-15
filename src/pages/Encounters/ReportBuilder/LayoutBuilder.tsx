import React, { useCallback, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { ReportTemplateFormData } from "@/pages/Encounters/ReportBuilder/schema";
import {
  ALIGNMENT_OPTIONS,
  AlignmentOptions,
  FONT_OPTIONS,
  FONT_SIZES,
  REPORT_SIZE_OPTIONS,
} from "@/types/reportTemplate/reportTemplate";

interface LayoutBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
}

// Memoized component to prevent unnecessary re-renders
export const LayoutBuilder = React.memo(function LayoutBuilder({
  form,
}: LayoutBuilderProps) {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const { t } = useTranslation();

  const handlePageNumberingAlignChange = useCallback(
    (value: AlignmentOptions) => {
      form.setValue("config.layout.page_numbering.align", value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form],
  );

  const marginMode = useWatch({
    control: form.control,
    name: "config.layout.page_margin.mode",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("REPORT_BUILDER_LAYOUT")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("REPORT_BUILDER_LAYOUT_DESCRIPTION")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Size */}
        <FormField
          control={form.control}
          name="config.layout.page_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("REPORT_BUILDER_PAGE_SIZE")}</FormLabel>
              <FormControl>
                <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                  <PopoverTrigger asChild className="w-full">
                    <Button variant="outline" type="button">
                      {REPORT_SIZE_OPTIONS.find(
                        (size) => size.id === field.value,
                      )?.value || t("REPORT_BUILDER_SELECT_PAGE_SIZE")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[calc(100vh-25rem)] overflow-y-auto">
                    <Command>
                      <CommandInput
                        placeholder={t("REPORT_BUILDER_SEARCH_PAGE_SIZE")}
                        className="outline-hidden border-none ring-0 shadow-none"
                      />
                      <CommandEmpty>
                        <p>{t("REPORT_BUILDER_NO_RESULTS")}</p>
                      </CommandEmpty>
                      <CommandGroup>
                        {REPORT_SIZE_OPTIONS.map((size) => (
                          <CommandItem
                            key={size.id}
                            value={size.id}
                            onSelect={() => {
                              field.onChange(size.id);
                              setPageSizeOpen(false);
                            }}
                          >
                            {size.value}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Page Margin */}
        <FormField
          control={form.control}
          name="config.layout.page_margin.mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("REPORT_BUILDER_PAGE_MARGIN")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value: "uniform" | "custom") => {
                    if (value === "uniform") {
                      form.setValue(
                        "config.layout.page_margin",
                        {
                          mode: "uniform",
                          value: "0pt",
                        },
                        { shouldValidate: true },
                      );
                    } else {
                      form.setValue(
                        "config.layout.page_margin",
                        {
                          mode: "custom",
                          values: {
                            top: "0pt",
                            right: "0pt",
                            bottom: "0pt",
                            left: "0pt",
                          },
                        },
                        { shouldValidate: true },
                      );
                    }
                  }}
                  defaultValue={field.value}
                  className="flex flex-row gap-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="uniform" id="uniform" />
                    <FormLabel htmlFor="uniform">
                      {t("REPORT_BUILDER_UNIFORM")}
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <FormLabel htmlFor="custom">
                      {t("REPORT_BUILDER_CUSTOM")}
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {marginMode === "uniform" ? (
          <FormField
            control={form.control}
            name="config.layout.page_margin.value"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="40pt"
                    className="max-w-[200px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="flex flex-row justify-start gap-2">
            <FormField
              control={form.control}
              name="config.layout.page_margin.values.top"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("REPORT_BUILDER_TOP")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="40pt"
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.layout.page_margin.values.bottom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("REPORT_BUILDER_BOTTOM")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="40pt"
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.layout.page_margin.values.left"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("REPORT_BUILDER_LEFT")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="40pt"
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.layout.page_margin.values.right"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("REPORT_BUILDER_RIGHT")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="40pt"
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Page Numbering */}
        <FormField
          control={form.control}
          name="config.layout.page_numbering.enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between max-w-[300px]">
              <FormLabel>{t("REPORT_BUILDER_PAGE_NUMBERING")}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.layout.page_numbering.format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("REPORT_BUILDER_FORMAT")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder={t("REPORT_BUILDER_PAGE_NUMBER_FORMAT")}
                  className="max-w-[300px]"
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                {t("REPORT_BUILDER_PAGE_NUMBER_FORMAT_HELP")}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.layout.page_numbering.align"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("REPORT_BUILDER_ALIGNMENT")}</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={handlePageNumberingAlignChange}
                >
                  <SelectTrigger className="max-w-[200px]">
                    <SelectValue
                      placeholder={t("REPORT_BUILDER_SELECT_ALIGNMENT")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGNMENT_OPTIONS.map((alignment) => (
                      <SelectItem key={alignment.id} value={alignment.id}>
                        {alignment.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Text Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t("REPORT_BUILDER_TEXT_SETTINGS")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="config.layout.text.font"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("REPORT_BUILDER_FONT_FAMILY")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("REPORT_BUILDER_SELECT_FONT")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.id} value={font.value}>
                            {font.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="config.layout.text.size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("REPORT_BUILDER_FONT_SIZE")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("REPORT_BUILDER_SELECT_SIZE")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((size) => (
                          <SelectItem key={size.id} value={size.value}>
                            {size.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
