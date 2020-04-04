import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

interface Props {
    title: string;
    message: string;
    handleClose: () => void;
    handleCancel?: () => void;
}
const AlertDialog = (props: Props) => {
    const { title, message, handleClose, handleCancel } = props;
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
                    <Button onClick={handleCancel}>
                        Cancel
                    </Button>
                )}
                <Button onClick={handleClose} color="primary">
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
