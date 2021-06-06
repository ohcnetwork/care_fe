import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

interface Props {
    title: string;
    message: string;
    handleClose: () => void;
    handleCancel?: () => void;
    primaryButton?: { text?: string, color?: "inherit" | "primary" | "secondary" | "default" | undefined };
    secondaryButton?: { text?: string, color?: "inherit" | "primary" | "secondary" | "default" | undefined };
}

const AlertDialog = (props: Props) => {
    const { title, message, handleClose, handleCancel, primaryButton, secondaryButton } = props;
    return (
        <Dialog
            open={true}
        >
            <DialogTitle id="alert-dialog-title">{title || ''}</DialogTitle>
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
