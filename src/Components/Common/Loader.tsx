import React from 'react';
import { Modal, CircularProgress } from "@material-ui/core";
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    modal:{
        outline:0
    },
    modalContent: {
        position: 'absolute',
        backgroundColor: 'white',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'auto',
        padding: '15px',
        borderRadius: '5px',
        outline:0
    }
});

const Loader = (props: { open: boolean; }) => {
    const { open } = props;
    const classes = useStyles();
    return (
        <Modal
            open={open}
            disableBackdropClick={false}
            className={classes.modal}
        >
            <div className={classes.modalContent}>
                <CircularProgress />
            </div>
        </Modal>
    );
};

export default Loader;
