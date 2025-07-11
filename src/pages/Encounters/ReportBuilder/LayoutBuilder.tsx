import { useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import RadioInput from "@/components/ui/RadioInput";
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
  PageMargin,
  REPORT_SIZE_OPTIONS,
} from "@/types/reportTemplate/reportTemplate";

interface LayoutBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
}

export default function LayoutBuilder({ form }: LayoutBuilderProps) {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const { t } = useTranslation();

  const handlePageNumberingAlignChange = (value: AlignmentOptions) => {
    form.setValue("config.layout.page_numbering.align", value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const marginMode = useWatch({
    control: form.control,
    name: "config.layout.page_margin.mode",
  });

  const pageNumberingEnabled = useWatch({
    control: form.control,
    name: "config.layout.page_numbering.enabled",
  });

  const handlePageSizeChange = (margins: PageMargin) => {
    if (margins) {
      const mode = margins.mode;
      form.setValue("config.layout.page_margin.mode", mode, {
        shouldValidate: true,
        shouldDirty: true,
      });
      if (mode === "uniform" && margins.value) {
        form.setValue("config.layout.page_margin.value", margins.value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else if (mode === "custom" && margins.values) {
        form.setValue("config.layout.page_margin.values", margins.values, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("layout")}</CardTitle>
        <p className="text-sm">{t("layout_description")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Size */}
        <FormField
          control={form.control}
          name="config.layout.page_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("page_size")}</FormLabel>
              <FormControl>
                <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
                  <PopoverTrigger asChild className="w-full">
                    <Button variant="outline" type="button">
                      {REPORT_SIZE_OPTIONS.find(
                        (size) => size.id === field.value,
                      )?.value || t("select_page_size")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[calc(100vh-25rem)] overflow-y-auto">
                    <Command>
                      <CommandInput
                        placeholder={t("search_page_size")}
                        className="outline-hidden border-none ring-0 shadow-none"
                      />
                      <CommandEmpty>
                        <p>{t("no_results")}</p>
                      </CommandEmpty>
                      <CommandGroup>
                        {REPORT_SIZE_OPTIONS.map((size) => (
                          <CommandItem
                            key={size.id}
                            value={size.id}
                            onSelect={() => {
                              field.onChange(size.id);
                              handlePageSizeChange(size.margins);
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
              <FormLabel>{t("page_margin")}</FormLabel>
              <FormControl>
                <RadioInput
                  {...field}
                  onValueChange={field.onChange}
                  options={[
                    { value: "uniform", label: t("uniform") },
                    { value: "custom", label: t("custom") },
                  ]}
                />
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
                  <div className="flex items-center gap-2">
                    <Input
                      {...field}
                      type="text"
                      placeholder="40"
                      className="max-w-[200px]"
                    />
                    <span className="text-sm">pt</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <FormField
              control={form.control}
              name="config.layout.page_margin.values.top"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("top")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} type="text" placeholder="40" />
                      <span className="text-sm">pt</span>
                    </div>
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
                  <FormLabel>{t("bottom")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} type="text" placeholder="40" />
                      <span className="text-sm">pt</span>
                    </div>
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
                  <FormLabel>{t("left")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} type="text" placeholder="40" />
                      <span className="text-sm">pt</span>
                    </div>
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
                  <FormLabel>{t("right")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} type="text" placeholder="40" />
                      <span className="text-sm">pt</span>
                    </div>
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
              <FormLabel>{t("page_numbering")}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <FormField
            control={form.control}
            name="config.layout.page_numbering.format"
            disabled={!pageNumberingEnabled}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>{t("format")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={t("page_number_format")}
                    className="w-full sm:w-auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.layout.page_numbering.align"
            disabled={!pageNumberingEnabled}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>{t("alignment")}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={handlePageNumberingAlignChange}
                    disabled={!pageNumberingEnabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("select_alignment")} />
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
        </div>

        <p className="text-sm text-gray-600">{t("page_number_format_help")}</p>

        {/* Text Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t("text_settings")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="config.layout.text.font"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("font_family")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_font")} />
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
                  <FormLabel>{t("font_size")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_size")} />
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
}
