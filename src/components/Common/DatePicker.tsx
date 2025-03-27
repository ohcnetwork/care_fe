import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeDatePicker } from "@/components/ui/relative-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  classes?: string;
  min?: Date;
  max?: Date;
}

export default function DatePicker({
  value,
  onChange,
  disabled,
  classes,
  min,
  max,
}: DatePickerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"absolute" | "relative">(
    "absolute",
  );

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : undefined;
    onChange(date);
  };

  return (
    <div className="flex sm:gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !value && "text-gray-500",
              classes,
            )}
            disabled={disabled}
          >
            <CareIcon icon="l-calender" className="mr-2 size-4" />
            {value ? format(value, "PPP") : t("pick_a_date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "absolute" | "relative")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="absolute">{t("absolute_date")}</TabsTrigger>
              <TabsTrigger value="relative">{t("relative_date")}</TabsTrigger>
            </TabsList>
            <TabsContent value="absolute" className="p-2">
              <Input
                type="date"
                value={value ? format(value, "yyyy-MM-dd") : ""}
                onChange={handleSelect}
                min={min ? format(min, "yyyy-MM-dd") : undefined}
                max={max ? format(max, "yyyy-MM-dd") : undefined}
                disabled={disabled}
              />
            </TabsContent>
            <TabsContent value="relative" className="p-0">
              <RelativeDatePicker value={value} onDateChange={onChange} />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
