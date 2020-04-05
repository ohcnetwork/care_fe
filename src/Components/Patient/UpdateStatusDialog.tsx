import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { WithStyles, withStyles } from '@material-ui/styles';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { SAMPLE_TEST_STATUS } from '../../Common/constants';
import { CheckboxField, SelectField } from '../Common/HelperInputFields';
import { SampleListModel } from './models';

interface Props {
    sample: SampleListModel;
    open: boolean;
    handleOk: (status: number, sample: SampleListModel) => void;
    handleCancel: () => void;
};

const styles = {
    paper: {
        "max-width": "600px",
        "min-width": "400px",
    }
};

const statusChoices = [
    {
        id: 0,
        desc: "Select",
    },
    ...SAMPLE_TEST_STATUS
];

const UpdateStatusDialog = (props: Props & WithStyles<typeof styles>) => {
    const { open, sample, handleOk, handleCancel, classes } = props;
    const [newStatus, setNewStatus] = useState(0);
    const [confirm, setConfirmation] = useState(false);

    const state: any = useSelector((state) => state);
    const { currentUser } = state;

    console.log(currentUser);

    const currentStatus = SAMPLE_TEST_STATUS.find(i => i.text === sample.status)?.desc;

    const okClicked = () => {
        handleOk(newStatus, sample)
        setNewStatus(0);
        setConfirmation(false);
    };

    const cancelClicked = () => {
        handleCancel();
        setNewStatus(0);
        setConfirmation(false);
    };

    return (
        <Dialog
            open={open}
            classes={{
                paper: classes.paper,
            }}
        >
            <DialogTitle id="test-sample-title">Update Test Sample Status</DialogTitle>
            <DialogContent>
                <div className="grid gap-4 grid-cols-3">
                    <div className="font-semibold leading-relaxed text-right">
                        Current Status :
                    </div>
                    <div className="md:col-span-2">{currentStatus}</div>
                    <div className="font-semibold leading-relaxed text-right">
                        New Status :
                    </div>
                    <div className="md:col-span-2">
                        <SelectField
                            name="new_status"
                            variant="standard"
                            optionValue="desc"
                            value={newStatus}
                            options={statusChoices}
                            onChange={(e: any) => setNewStatus(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <CheckboxField
                            checked={confirm}
                            onChange={(e: any) => setConfirmation(e.target.checked)}
                            name="confirm"
                            label="Select this checkbox to confirm the status update"
                        />
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelClicked}>Cancel</Button>
                <Button onClick={okClicked} color="primary" variant="contained" disabled={!confirm || !newStatus}>OK</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(UpdateStatusDialog);
