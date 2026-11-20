import { AlertTriangleIcon, SkullIcon } from "lucide-react";
import { useId, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type ButtonVariant } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConfirmationDialogProps {
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmationText: string;
  actionButtonText: string;
  onConfirm: () => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

const CriticalActionConfirmationDialog = ({
  trigger,
  title,
  description,
  confirmationText,
  actionButtonText,
  onConfirm,
  isLoading = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  variant = "destructive",
  icon,
}: ConfirmationDialogProps) => {
  const { t } = useTranslation();
  const confirmationInputId = useId();
  const [internalOpen, setInternalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  const isConfirmed = confirmText === confirmationText;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    onConfirm();
    setConfirmText("");
  };

  // Color mapping for different variants
  const getVariantColors = (variant: ButtonVariant) => {
    switch (variant) {
      case "destructive":
        return {
          bgColor: "bg-red-500/10",
          iconColor: "text-red-500",
          defaultIcon: <SkullIcon className="size-4 text-red-500" />,
        };
      case "warning":
        return {
          bgColor: "bg-warning-500/10",
          iconColor: "text-warning-500",
          defaultIcon: (
            <AlertTriangleIcon className="size-4 text-warning-500" />
          ),
        };
      case "alert":
        return {
          bgColor: "bg-alert-500/10",
          iconColor: "text-alert-500",
          defaultIcon: <AlertTriangleIcon className="size-4 text-alert-500" />,
        };
      case "primary":
      case "primary_gradient":
      case "outline_primary":
        return {
          bgColor: "bg-primary-500/10",
          iconColor: "text-primary-500",
          defaultIcon: (
            <AlertTriangleIcon className="size-4 text-primary-500" />
          ),
        };
      case "secondary":
        return {
          bgColor: "bg-gray-500/10",
          iconColor: "text-gray-500",
          defaultIcon: <AlertTriangleIcon className="size-4 text-gray-500" />,
        };
      case "outline":
      case "ghost":
      case "link":
      case "white":
      default:
        return {
          bgColor: "bg-gray-500/10",
          iconColor: "text-gray-600",
          defaultIcon: <AlertTriangleIcon className="size-4 text-gray-600" />,
        };
    }
  };

  const variantColors = getVariantColors(variant);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] gap-0 overflow-y-auto">
        <AlertDialogHeader className="block text-left">
          <div className="flex items-center gap-2">
            <div className={cn("shrink-0 rounded p-2", variantColors.bgColor)}>
              {icon ?? variantColors.defaultIcon}
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <div className="min-w-0 space-y-4 px-4 pb-4 text-sm text-foreground wrap-anywhere md:px-6 md:pb-6">
          <AlertDialogDescription asChild>
            <div className="space-y-2">{description}</div>
          </AlertDialogDescription>
          <div>
            <label htmlFor={confirmationInputId}>
              <Trans
                i18nKey="confirmation_dialog_input_label"
                components={{
                  code: (
                    <code className="rounded bg-muted px-1 py-0.5 font-mono wrap-anywhere" />
                  ),
                }}
                values={{ confirmationText }}
              />
            </label>
            <Input
              id={confirmationInputId}
              className="mt-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmationText}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => handleOpenChange(false)}
            className="w-full sm:flex-1"
            disabled={isLoading}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className="w-full sm:flex-1"
          >
            {actionButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CriticalActionConfirmationDialog;
