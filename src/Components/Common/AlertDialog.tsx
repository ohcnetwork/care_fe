import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

const AlertDialog = (props: any) => {
    const { title, message, handleClose } = props;
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
                <Button onClick={handleClose} color="primary">
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
