import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

function PasswordInput({
  className,
  ref,
  disabled,
  ...props
}: React.ComponentProps<"input">) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <InputGroup>
      <InputGroupInput
        type={showPassword ? "text" : "password"}
        className={className}
        ref={ref}
        disabled={disabled}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          disabled={disabled}
          aria-label={t(showPassword ? "hide_password" : "show_password")}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

PasswordInput.displayName = "PasswordInput";
export { PasswordInput };
