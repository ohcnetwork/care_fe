import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { WithStyles, withStyles } from '@material-ui/styles';
import React, { useReducer } from 'react';
import { ROLE_STATUS_MAP, SAMPLE_TEST_STATUS, SAMPLE_TEST_RESULT } from '../../Common/constants';
import { CheckboxField, SelectField } from '../Common/HelperInputFields';
import { SampleListModel } from './models';

interface Props {
    sample: SampleListModel;
    handleOk: (sample: SampleListModel, status: number, result: number) => void;
    handleCancel: () => void;
    userType: "Staff" | "DistrictAdmin" | "StateLabAdmin";
};

const styles = {
    paper: {
        "max-width": "600px",
        "min-width": "400px",
    }
};

const statusChoices = [ ...SAMPLE_TEST_STATUS ];

const resultTypes = [
    {
        id: 0,
        text: "Select",
    },
    ...SAMPLE_TEST_RESULT,
];

const roleStatusMap = { ...ROLE_STATUS_MAP };

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
    const { sample, handleOk, handleCancel, classes, userType } = props;
    const [state, dispatch] = useReducer(updateStatusReducer, initialState);

    const currentStatus = SAMPLE_TEST_STATUS.find(i => i.text === sample.status)?.desc;

    const validStatusChoices = statusChoices
    .filter(i => roleStatusMap[userType].includes(i.text))
    .filter(i => i.id > Number(SAMPLE_TEST_STATUS.find(i => i.text === sample.status)?.id));

    const newStatusChoices = [
        {
            id: 0,
            text: "Select",
        },
        ...validStatusChoices
    ];

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

    return (
        <Dialog
            open={true}
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
                            options={newStatusChoices}
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
