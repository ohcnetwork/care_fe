import React from 'react';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Typography, Button } from '@material-ui/core';

const DialogModal = (props:any) => {
    const {
        isOpen,
        dialogTitle,
        dialogContent,
        buttonPrimaryName,
        buttonSecondaryName,
        buttonSize,
        showClose,
        hideBtns,
        hideTitle,
        secondaryButtonDisabled,
        onClose,
        styleName,
        hideSecondaryBtn,
        onSecondaryClick,
        onPrimaryClick,
        contentStyle,
    } = props;

    return (
        <div>
            <Dialog
                open={isOpen}
                keepMounted
                className={styleName}
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description"
            >
                {showClose
                && (
                    <div className="w3-display-topright w3-margin-bottom">
                        <IconButton aria-label="Close" onClick={onClose}>
                            <CloseIcon style={{ color: '#dadada' }} />
                        </IconButton>
                    </div>
                )
                }
                {(!hideTitle && dialogTitle) && (
                    <DialogTitle
                        disableTypography
                        className="w3-no-padding w3-margin-top"
                    >
                        {(typeof dialogTitle === 'string')
                            ? dialogTitle.split('\n').map(eachLine => (
                                <Typography key={eachLine} variant="h5">{eachLine}</Typography>
                            ))
                            : dialogTitle
                        }
                    </DialogTitle>
                )}
                <DialogContent className={contentStyle}>
                    {dialogContent}
                </DialogContent>
                {!hideBtns && (
                    <DialogActions className="w3-padding">
                        <>
                            {!hideSecondaryBtn
                            && (
                                <Button
                                    onClick={onSecondaryClick}
                                    color="primary"
                                    variant="contained"
                                    size={buttonSize}
                                    disabled={secondaryButtonDisabled}
                                >
                                    {buttonSecondaryName}
                                </Button>
                            )
                            }
                            <Button
                                onClick={onPrimaryClick}
                                color="primary"
                                variant="contained"
                                size={buttonSize}
                                className="w3-margin-left"
                            >
                                {buttonPrimaryName}
                            </Button>

                        </>
                    </DialogActions>
                )}
            </Dialog>
        </div>
    );
};



export default DialogModal;
