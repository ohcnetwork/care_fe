import DialogModal from "./Dialog";
import { ButtonVariant, Cancel, Submit } from "./components/ButtonV2";

type ConfirmDialogV2Props = {
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

const ConfirmDialogV2 = ({
  disabled,
  variant,
  action,
  onConfirm,
  cancelLabel,
  children,
  ...props
}: ConfirmDialogV2Props) => {
  return (
    <DialogModal {...props}>
      {children}
      <div className="mt-6 flex justify-end gap-2 w-full flex-col md:flex-row">
        <Cancel onClick={props.onClose} label={cancelLabel} />
        <Submit onClick={onConfirm} variant={variant} disabled={disabled}>
          {action}
        </Submit>
      </div>
    </DialogModal>
  );
};

export default ConfirmDialogV2;
