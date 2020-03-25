import React from 'react';
import { Modal } from "@material-ui/core";
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    modalContent: {
        position: 'absolute',
        maxWidth: '80%',
        // minWidth: '600px',
        backgroundColor: 'white',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        marginBottom: '50px'
    }
});
interface ModalProps {
    children: JSX.Element[] | JSX.Element;
    open: boolean;
    handleClose: () => void;
    style: Object;
};
const ModalComponent = (props: ModalProps) => {
    const { children, open, handleClose, style } = props;
    const classes = useStyles();
    return (
        <Modal
            open={open}
            onClose={handleClose}
            disableBackdropClick
        >
            <div className={classes.modalContent} style={style}>
                {children}
            </div>
        </Modal>
    );
};

export default ModalComponent;
