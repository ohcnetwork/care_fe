import { UseFormReturn } from "react-hook-form";

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
  FONT_OPTIONS,
  REPORT_SIZE_OPTIONS,
} from "@/types/reportTemplate/reportTemplate";

interface LayoutBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
}

export function LayoutBuilder({ form }: LayoutBuilderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Layout Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure page size, margins, numbering and text settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Size */}
        <FormField
          control={form.control}
          name="config.layout.page_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Size</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild className="w-full">
                    <Button variant="outline">
                      {REPORT_SIZE_OPTIONS.find(
                        (size) => size.id === field.value,
                      )?.value || "Select Page Size"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[calc(100vh-25rem)] overflow-y-auto">
                    <Command>
                      <CommandInput
                        placeholder="Search page size"
                        className="outline-hidden border-none ring-0 shadow-none"
                      />
                      <CommandEmpty>
                        <p>No results found.</p>
                      </CommandEmpty>
                      <CommandGroup>
                        {REPORT_SIZE_OPTIONS.map((size) => (
                          <CommandItem
                            key={size.id}
                            value={size.id}
                            onSelect={() => field.onChange(size.id)}
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
              <FormLabel>Page Margin</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="uniform" id="uniform" />
                    <FormLabel htmlFor="uniform">Uniform</FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <FormLabel htmlFor="custom">
                      Custom (top, right, bottom, left)
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {/* Page Numbering */}
        <FormField
          control={form.control}
          name="config.layout.page_numbering.enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between max-w-[300px]">
              <FormLabel>Page Numbering</FormLabel>
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
              <FormLabel>Format</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Page {page} of {pages}"
                  className="max-w-[300px]"
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                Use {"{page}"} and {"{pages}"} as placeholders
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
              <FormLabel>Alignment</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="max-w-[200px]">
                    <SelectValue placeholder="Select alignment" />
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
          <h3 className="text-lg font-semibold mb-4">Text Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="config.layout.text.font"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Family</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
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
                  <FormLabel>Font Size</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {[8, 10, 12, 14, 16, 18, 20, 24].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}pt
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
