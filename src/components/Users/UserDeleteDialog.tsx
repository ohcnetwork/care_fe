import ConfirmDialog from "@/components/Common/ConfirmDialog";

interface ConfirmDialogProps {
  name: string;
  handleCancel: () => void;
  handleOk: () => void;
}

const UserDeleteDialog = (props: ConfirmDialogProps) => {
  return (
    <ConfirmDialog
      title="Delete User"
      description={
        <span>
          Are you sure you want to delete user <strong>{props.name}</strong> ?
        </span>
      }
      action="Delete"
      variant="destructive"
      show
      onConfirm={props.handleOk}
      onClose={props.handleCancel}
    />
  );
};

export default UserDeleteDialog;
