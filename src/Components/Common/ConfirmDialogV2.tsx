import DialogModal from "./Dialog";
import ButtonV2, { ButtonVariant } from "./components/ButtonV2";

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
  cancelText?: React.ReactNode;
};

const ConfirmDialogV2 = (props: ConfirmDialogV2Props) => {
  const {
    title,
    description,
    show,
    disabled,
    variant,
    action,
    onClose,
    onConfirm,
    cancelText,
    children,
  } = props;

  return (
    <DialogModal
      onClose={onClose}
      title={title}
      description={description}
      show={show}
    >
      {children}
      <div className="mt-4 flex justify-between">
        <ButtonV2 onClick={onClose} variant="secondary">
          {cancelText || "Cancel"}
        </ButtonV2>
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
