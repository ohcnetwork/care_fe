import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { WithStyles, withStyles } from '@material-ui/styles';
import React, { useReducer } from 'react';
import { ROLE_STATUS_MAP, SAMPLE_TEST_STATUS, SAMPLE_TEST_RESULT, SAMPLE_FLOW_RULES } from '../../Common/constants';
import { CheckboxField, SelectField } from '../Common/HelperInputFields';
import { SampleTestModel } from './models';

interface Props {
    sample: SampleTestModel;
    handleOk: (sample: SampleTestModel, status: number, result: number) => void;
    handleCancel: () => void;
    userType: "Staff" | "DistrictAdmin" | "StateLabAdmin";
};

const styles = {
    paper: {
        "max-width": "600px",
        "min-width": "400px",
    }
};

const statusChoices = [...SAMPLE_TEST_STATUS];

const statusFlow = { ...SAMPLE_FLOW_RULES };

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

    const status = String(sample.status) as keyof typeof SAMPLE_FLOW_RULES;
    const validStatusChoices = statusChoices
        .filter(i => status && statusFlow[status] && statusFlow[status].includes(i.text))
    // .filter(i => roleStatusMap[userType] && roleStatusMap[userType].includes(i.text))

    const newStatusChoices = [
        {
            id: 0,
            desc: "Select",
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
                            label="I agree to update the sample test status."
                        />
                    </div>
                </div>
            </DialogContent>
            <DialogActions style={{ justifyContent: "space-between" }}>
                <Button onClick={cancelClicked}>Cancel</Button>
                <Button
                    onClick={okClicked}
                    color="primary"
                    variant="contained"
                    disabled={state.form.disabled}
                    startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                >Update Status</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(UpdateStatusDialog);
