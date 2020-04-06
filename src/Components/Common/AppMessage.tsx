import React from 'react';
import { Snackbar, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => ({
        root: {
            'width': '100%',
            'z-index': '1203',
            '& > * + *': {
                marginTop: theme.spacing(2),
                backgroundColor: 'ghostwhite'
            }
        }
    }
));

interface AppMessageProps {
    open: boolean;
    type: string;
    message: string;
    handleClose: () => void;
    handleDialogClose: () => void;
}

const AppMessage = (props: AppMessageProps) => {
    const { open, type, message, handleClose, handleDialogClose } = props;
    const classes = useStyles();

    if(type === 'success'){
        return (
            <div>
                <Snackbar
                    open={open}
                    autoHideDuration={2000}
                    onClose={handleClose}
                    className= {classes.root}
                    message={message}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                />
            </div>
        )
    } else{
        return (
            <div>
                <Snackbar
                    open={open}
                    onClose={handleDialogClose}
                    className= {classes.root}
                    message={message}
                    action={
                        <React.Fragment>
                            <IconButton size="small" aria-label="close" color="inherit" onClick={handleDialogClose}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </React.Fragment>
                    }
                />
            </div>
        )
    }
};

export default AppMessage;