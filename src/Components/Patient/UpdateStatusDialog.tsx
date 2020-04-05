import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { WithStyles, withStyles } from '@material-ui/styles';
import React, { useState, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { SAMPLE_TEST_STATUS, SAMPLE_TEST_RESULT } from '../../Common/constants';
import { CheckboxField, SelectField } from '../Common/HelperInputFields';
import { SampleListModel } from './models';

interface Props {
    sample: SampleListModel;
    open: boolean;
    handleOk: (sample: SampleListModel, status: number, result: number) => void;
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

const resultTypes = [
    {
        id: 0,
        text: "Select",
    },
    ...SAMPLE_TEST_RESULT,
];

const initForm: any = {
    confirm: false,
    status: 0,
    result: 0,
    disabled: true,
};

const initialState = {
    form: { ...initForm },
};

const updateStatusReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case "set_form": {
            return {
                ...state,
                form: action.form
            };
        }
        default:
            return state;
    }
};

const UpdateStatusDialog = (props: Props & WithStyles<typeof styles>) => {
    const { open, sample, handleOk, handleCancel, classes } = props;
    const [state, dispatch] = useReducer(updateStatusReducer, initialState);

    // console.log(currentUser.data.user_type)

    const currentStatus = SAMPLE_TEST_STATUS.find(i => i.text === sample.status)?.desc;

    const okClicked = () => {
        handleOk(sample, state.form.status, state.form.result);
        dispatch({ type: "set_form", form: initForm });
    };

    const cancelClicked = () => {
        handleCancel();
        dispatch({ type: "set_form", form: initForm });
    };

    const handleChange = (name: string, value: any) => {
        const form = { ...state.form };
        form[name] = (name === 'status' || name === 'result') ? Number(value) : value;
        form.disabled = !form.status || !form.confirm || (form.status === 7 && !form.result);
        dispatch({ type: "set_form", form });
    };

    console.log(state.form.status)

    return (
        <Dialog
            open={open}
            classes={{
                paper: classes.paper,
            }}
        >
            <DialogTitle id="test-sample-title">Update Sample Test Status</DialogTitle>
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
                            name="status"
                            variant="standard"
                            optionValue="desc"
                            value={state.form.status}
                            options={statusChoices}
                            onChange={(e: any) => handleChange(e.target.name, e.target.value)}
                        />
                    </div>
                    {Number(state.form.status) === 7 && (<>
                        <div className="font-semibold leading-relaxed text-right">
                            Result :
                        </div>
                        <div className="md:col-span-2">
                            <SelectField
                                name="result"
                                variant="standard"
                                value={state.form.result}
                                options={resultTypes}
                                onChange={(e: any) => handleChange(e.target.name, e.target.value)}
                            />
                        </div>
                    </>)}
                    <div className="md:col-span-3">
                        <CheckboxField
                            checked={state.form.confirm}
                            onChange={(e: any) => handleChange(e.target.name, e.target.checked)}
                            name="confirm"
                            label="Select this checkbox to confirm the status update"
                        />
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelClicked}>Cancel</Button>
                <Button onClick={okClicked} color="primary" variant="contained" disabled={state.form.disabled}>OK</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(UpdateStatusDialog);
