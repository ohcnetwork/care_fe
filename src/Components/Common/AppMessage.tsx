import React from 'react';
import { Snackbar, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
        root: {
            width: '100%',
            '& > * + *': {
                marginTop: theme.spacing(2),
                backgroundColor: 'ghostwhite'
            }
        }
    }
));

const AppMessage = (props: any) => {
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
