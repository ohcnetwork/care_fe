import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/input-password";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  title: string;
  description: string;
  error?: string;
  isLoading?: boolean;
  buttonText: string;
  icon?: React.ReactNode;
  buttonVariant?: "default" | "destructive" | "outline";
  buttonClassName?: string;
}

export function PasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  error,
  isLoading,
  buttonText,
  icon,
  buttonVariant = "default",
  buttonClassName,
}: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  // Reset password when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-md ">
        <DialogHeader>
          {icon ? (
            <div className="flex items-center gap-2">
              {icon}
              <DialogTitle>{title}</DialogTitle>
            </div>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
          <DialogDescription className="text-start">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("password")}</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter className="flex items-end mt-4">
            <Button
              type="submit"
              variant={buttonVariant}
              disabled={isLoading || !password}
              className={buttonClassName}
            >
              {isLoading ? (
                <>
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 size-4 animate-spin"
                  />
                </>
              ) : (
                buttonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
