import DialogModal from "./Dialog";
import ButtonV2, { ButtonVariant, Cancel } from "./components/ButtonV2";

type ConfirmDialogV2Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  show: boolean;
  action: string;
  variant?: ButtonVariant;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
  cancelLabel?: string;
};

const ConfirmDialogV2 = ({
  title,
  description,
  show,
  disabled,
  variant,
  action,
  onClose,
  onConfirm,
  cancelLabel,
  children,
}: ConfirmDialogV2Props) => {
  return (
    <DialogModal
      onClose={onClose}
      title={title}
      description={description}
      show={show}
    >
      {children}
      <div className="mt-4 flex justify-between gap-2 w-full flex-col md:flex-row">
        <Cancel onClick={onClose} label={cancelLabel} />
        <ButtonV2
          onClick={onConfirm}
          variant={variant || "primary"}
          disabled={disabled}
        >
          {action}
        </ButtonV2>
      </div>
    </DialogModal>
  );
};

export default ConfirmDialogV2;
