import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

const PhoneInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    onValueChange?: (value: string) => void;
  }
>(({ className, ...props }, ref) => {
  const { t } = useTranslation();
  return (
    <Input
      type="tel"
      className={cn("pr-10", className)}
      ref={ref}
      {...props}
      maxLength={16}
      value={props.value || "+91"}
      placeholder={props.placeholder ?? t("phone_number_placeholder")}
      onChange={(e) => {
        let value = e.target.value.replace(/[^\d+]/g, "");
        if (value && !value.startsWith("+")) {
          value = "+" + value;
        }
        props.onValueChange?.(value);
        props.onChange?.(e);
      }}
    />
  );
});

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
