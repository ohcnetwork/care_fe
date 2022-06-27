import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface Props {
  title: string;
  message: string;
  handleClose: () => void;
  handleCancel?: () => void;
  primaryButton?: {
    text?: string;
    color?:
      | "inherit"
      | "primary"
      | "secondary"
      | "success"
      | "error"
      | "info"
      | "warning"
      | undefined;
  };
  secondaryButton?: {
    text?: string;
    color?:
      | "inherit"
      | "primary"
      | "secondary"
      | "success"
      | "error"
      | "info"
      | "warning"
      | undefined;
  };
}

const AlertDialog = (props: Props) => {
  const {
    title,
    message,
    handleClose,
    handleCancel,
    primaryButton,
    secondaryButton,
  } = props;

  const handleEscKeyPress = (event: any) => {
    if (event.key === "Escape") {
      handleCancel ? handleCancel() : null;
    }
  };
  return (
    <Dialog open={true} onKeyDown={(e) => handleEscKeyPress(e)}>
      <DialogTitle id="alert-dialog-title">{title || ""}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {handleCancel && (
          <Button onClick={handleCancel} color={secondaryButton?.color}>
            {secondaryButton?.text || "Cancel"}
          </Button>
        )}
        <Button onClick={handleClose} color={primaryButton?.color || "primary"}>
          {primaryButton?.text || "OK"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
