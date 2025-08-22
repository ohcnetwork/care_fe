import React from "react";

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
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  cancelText?: string;
  confirmText: string;
  variant?: "primary" | "destructive" | "default" | "outline_primary";
  disabled?: boolean;
  hideCancel?: boolean;
}

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  cancelText,
  confirmText,
  variant = "primary",
  disabled,
  hideCancel,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="capitalize">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!hideCancel && <AlertDialogCancel>{cancelText}</AlertDialogCancel>}
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant }))}
            disabled={disabled}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
