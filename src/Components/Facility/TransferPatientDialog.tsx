import { Button, Dialog, DialogActions, DialogContent, DialogTitle, InputLabel } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { WithStyles, withStyles } from '@material-ui/styles';
import { navigate } from "raviger";
import moment from "moment";
import React, { useReducer, useState } from 'react';
import { useDispatch } from 'react-redux';
import { transferPatient } from '../../Redux/actions';
import * as Notification from "../../Utils/Notifications.js";
import { DateInputField, SelectField } from '../Common/HelperInputFields';
import { DupPatientModel } from './models';
import { OptionsType } from '../../Common/constants';

interface Props {
    patientList: Array<DupPatientModel>;
    handleOk: () => void;
    handleCancel: () => void;
    facilityId: number;
};

const styles = {
    paper: {
        "max-width": "650px",
        "min-width": "400px",
    }
};

const initForm: any = {
    patient: "",
    date_of_birth: null,
};

const initError = Object.assign({}, ...Object.keys(initForm).map(k => ({ [k]: "" })));

const initialState = {
    form: { ...initForm },
    errors: { ...initError },
};


const patientFormReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case "set_form": {
            return {
                ...state,
                form: action.form
            };
        }
        case "set_error": {
            return {
                ...state,
                errors: action.errors
            };
        }
        default:
            return state;
    }
};


const TransferPatientDialog = (props: Props & WithStyles<typeof styles>) => {
    const { patientList, handleOk, handleCancel, facilityId, classes } = props;
    const dispatchAction: any = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [state, dispatch] = useReducer(patientFormReducer, initialState);
    const patientOptions: Array<OptionsType> = patientList.map(patient => {
        return {
            id: patient.patient_id,
            text: `#${patient.patient_id} - ${patient.name} (${patient.gender})`
        }
    });

    const handleChange = (e: any) => {
        const form = { ...state.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form });
    };

    const handleDateChange = (date: any, field: string) => {
        if (moment(date).isValid()) {
            const form = { ...state.form };
            form[field] = date;
            dispatch({ type: "set_form", form });
        }
    };

    const validateForm = () => {
        let errors = { ...initError };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            switch (field) {
                case "patient":
                    if (!state.form[field]) {
                        errors[field] = "Please select the suspect/patient";
                        invalidForm = true;
                    }
                    return;
                case "date_of_birth":
                    if (!state.form[field]) {
                        errors[field] = "Please enter date in DD/MM/YYYY format";
                        invalidForm = true;
                    }
                    return;
                default:
                    return;
            }
        });
        dispatch({ type: "set_error", errors });
        return !invalidForm;
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm) {
            setIsLoading(true);
            const data = {
                date_of_birth: moment(state.form.date_of_birth).format('YYYY-MM-DD'),
                facility: facilityId,
            };
            const res = await dispatchAction(transferPatient(data, { id: state.form.patient }));
            setIsLoading(false);
            if (res && res.data) {
                dispatch({ type: "set_form", form: initForm });
                handleOk();
                Notification.Success({
                    msg: `Patient ${res.data.patient} transferred successfully`
                });
                const newFacilityId = res.data && res.data.facility_object && res.data.facility_object.id;
                if (newFacilityId) {
                    navigate(`/facility/${newFacilityId}/patient/${res.data.patient}`);
                } else {
                    navigate("/facility");
                }
                
            }
        }
    };

    return (
        <Dialog
            open={true}
            classes={{
                paper: classes.paper,
            }}
        >
            <DialogTitle id="test-sample-title">Patient Transfer Form</DialogTitle>
            <DialogContent>
                <div className="grid gap-4 grid-cols-1">
                    <div>
                        <p className="leading-relaxed">Note: Date of birth must match the patient to process the transfer request.</p>
                    </div>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div>
                            <InputLabel>Patient*</InputLabel>
                            <SelectField
                                name="patient"
                                variant="outlined"
                                margin="dense"
                                showEmpty={true}
                                value={state.form.patient}
                                options={patientOptions}
                                onChange={handleChange}
                                errors={state.errors.patient}
                            />
                        </div>
                        <div>
                            <InputLabel>Date of birth*</InputLabel>
                            <DateInputField
                                fullWidth={true}
                                value={state.form.date_of_birth}
                                onChange={date => handleDateChange(date, "date_of_birth")}
                                errors={state.errors.date_of_birth}
                                inputVariant="outlined"
                                margin="dense"
                                openTo="year"
                                disableFuture={true}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions style={{ justifyContent: "space-between" }}>
                <Button
                    disabled={isLoading}
                    color="secondary"
                    onClick={() => handleCancel()}
                >Cancel</Button>
                <Button
                    disabled={isLoading}
                    onClick={handleSubmit}
                    color="primary"
                    variant="contained"
                    startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                >Transfer Suspect / Patient</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(TransferPatientDialog);
