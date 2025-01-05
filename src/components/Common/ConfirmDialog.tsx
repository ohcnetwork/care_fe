import { Button, ButtonVariant } from "@/components/ui/button";

import DialogModal from "@/components/Common/Dialog";

type ConfirmDialogProps = {
  className?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  show: boolean;
  action: React.ReactNode;
  variant?: ButtonVariant;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
  cancelLabel?: string;
  name?: string;
};

const ConfirmDialog = ({
  disabled,
  variant,
  action,
  onConfirm,
  cancelLabel,
  children,
  name,
  ...props
}: ConfirmDialogProps) => {
  return (
    <DialogModal {...props}>
      {children}
      <div className="mt-6 flex w-full flex-col justify-end gap-2 md:flex-row">
        <Button variant="outline" type="button" onClick={props.onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant={variant}
          name={name ?? "submit"}
          onClick={onConfirm}
          disabled={disabled}
        >
          {action}
        </Button>
      </div>
    </DialogModal>
  );
};

export default ConfirmDialog;
