import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@material-ui/core';

interface ConfirmDialogProps {
    title: string;
    message: string;
    handleCancel: () => void;
    handleOk: () => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
    const { title, message, handleCancel, handleOk  } = props;
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
                <Button onClick={handleCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleOk} color="primary">
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;
