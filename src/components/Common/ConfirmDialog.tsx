import { ButtonVariant, Cancel, Submit } from "@/components/Common/ButtonV2";
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
};

const ConfirmDialog = ({
  disabled,
  variant,
  action,
  onConfirm,
  cancelLabel,
  children,
  ...props
}: ConfirmDialogProps) => {
  return (
    <DialogModal {...props}>
      {children}
      <div className="mt-6 flex w-full flex-col justify-end gap-2 md:flex-row">
        <Cancel onClick={props.onClose} label={cancelLabel} />
        <Submit onClick={onConfirm} variant={variant} disabled={disabled}>
          {action}
        </Submit>
      </div>
    </DialogModal>
  );
};

export default ConfirmDialog;
