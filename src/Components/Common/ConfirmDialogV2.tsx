import DialogModal from "./Dialog";
import ButtonV2, { ButtonVariant, Cancel } from "./components/ButtonV2";

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
        <ButtonV2 onClick={onConfirm} variant={variant} disabled={disabled}>
          {action}
        </ButtonV2>
      </div>
    </DialogModal>
  );
};

export default ConfirmDialogV2;
