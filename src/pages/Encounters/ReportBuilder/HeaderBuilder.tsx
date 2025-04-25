import { UseFormReturn } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReportTemplateFormData } from "@/pages/Encounters/ReportBuilder/schema";
import { FONT_WEIGHT_OPTIONS } from "@/types/reportTemplate/reportTemplate";

interface HeaderBuilderProps {
  form: UseFormReturn<ReportTemplateFormData>;
}

export function HeaderBuilder({ form }: HeaderBuilderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Header Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure facility name, logo, title and other header elements
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4 w-full flex justify-between">
            <TabsTrigger value="basic" className="w-full">
              Basic
            </TabsTrigger>
            <TabsTrigger value="styling" className="w-full">
              Styling
            </TabsTrigger>
            <TabsTrigger value="logo" className="w-full">
              Logo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Facility Name */}
            <FormField
              control={form.control}
              name="config.header.facility_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Care Health System" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Report Title */}
            <FormField
              control={form.control}
              name="config.header.title.text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Patient Discharge Summary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Created On Label */}
            <FormField
              control={form.control}
              name="config.header.created_on.label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Created On Label</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Created on" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Format */}
            <FormField
              control={form.control}
              name="config.header.created_on.date_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Format</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="[day]/[month]/[year]" />
                  </FormControl>
                  <FormDescription>
                    Use [day], [month], [year] as placeholders
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="styling" className="space-y-8">
            {/* Facility Heading */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Facility Heading</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="config.header.facility_heading.align"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alignment</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>
                        </FormControl>
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

                <FormField
                  control={form.control}
                  name="config.header.facility_heading.size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="24pt" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.header.facility_heading.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FONT_WEIGHT_OPTIONS.map((weight) => (
                            <SelectItem key={weight.id} value={weight.id}>
                              {weight.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Divider</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="config.header.divider.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="100%" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.header.divider.stroke"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stroke Color</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="mygray" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Title</h3>
              <FormField
                control={form.control}
                name="config.header.title.size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="15pt" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="logo">
            <div className="text-sm text-muted-foreground">
              Logo options will go here
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
