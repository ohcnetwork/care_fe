import React, { useReducer, useState, useCallback } from "react";
import PageTitle from "../Common/PageTitle";
import { FacilitySelect } from "../Common/FacilitySelect";
import { TextInputField, MultilineInputField, ErrorHelperText } from "../Common/HelperInputFields";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { Loading } from "../Common/Loading";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import {navigate} from "hookrouter";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftDetails, updateShift } from "../../Redux/actions";
import { SelectField } from "../Common/HelperInputFields";
import { SHIFTING_CHOICES } from "../../Common/constants";

import { 
    Card, 
    CardContent,
    InputLabel,
    Radio,
    RadioGroup,
    Box,
    FormControlLabel,
    Button } from "@material-ui/core";

interface patientShiftProps {
    id: string
}

const shiftStatusOptions = SHIFTING_CHOICES.map(obj => obj.text);


const initForm: any = {
    shifting_approving_facility_object: null,
    assigned_facility_object: null,
    emergency: 'false',
    is_up_shift: 'true',
    reason: "",
    vehicle_preference: "",
    comments: "",
  };

const requiredFields: any = {
    shifting_approving_facility_object: {
        errorText: 'Shifting approving facility can not be empty.'
    }
}

  const initError = Object.assign({}, ...Object.keys(initForm).map((k) => ({ [k]: "" })));

   const initialState = {
     form: { ...initForm },
     errors: { ...initError },
  };

  const goBack = () => {
    window.history.go(-1);
  };

export const ShiftDetailsUpdate = (props: patientShiftProps) => {

    const dispatchAction: any = useDispatch();
    const [isLoading, setIsLoading] = useState(true);

    const shiftFormReducer = (state = initialState, action: any) => {
        switch (action.type) {
            case "set_form": {
                return {
                    ...state,
                    form: action.form,
                };
            }
            case "set_error": {
                return {
                    ...state,
                    errors: action.errors,
                };
            }
            default:
            return state;
        }
    };

    const [state, dispatch] = useReducer(shiftFormReducer, initialState);

    const validateForm = () => {
        let errors = { ...initError };
        let isInvalidForm = false;
        Object.keys(requiredFields).forEach((field) => {
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          }
        });

        dispatch({ type: "set_error", errors });
        return isInvalidForm;
      };

    const handleChange = (e: any) => {
        const form = { ...state.form };
        const { name, value } = e.target;
        form[name] = value;
        dispatch({ type: "set_form", form });
    };

    const setFacility = (selected: any, name: string) => {
        const form = { ...state.form };
        form[name] = selected;
        dispatch({ type: "set_form", form });
    };


    const handleSubmit = async (e: any) => {
        const validForm = validateForm();

        if (validForm) {
            setIsLoading(true);

            const data = {
                status: state.form.status,
                orgin_facility: state.form.orgin_facility_object?.id,
                shifting_approving_facility: state.form?.shifting_approving_facility_object?.id,
                assigned_facility: state.form?.assigned_facility_object?.id,
                patient: state.form.patient_object?.id,
                emergency: [true, 'true'].includes(state.form.emergency),
                is_up_shift: [true, 'true'].includes(state.form.is_up_shift),
                reason: state.form.reason,
                vehicle_preference: state.form.vehicle_preference,
                comments: state.form.comments,
            }

            const res = await dispatchAction(updateShift(props.id, data));
            setIsLoading(false);

            if (res && res.data) {
                dispatch({ type: "set_form", form: res.data });
                Notification.Success({
                    msg: "Shift request updated successfully",
                });

                navigate(`/shifting/${props.id}`)
            }

        }
    }

    const fetchData = useCallback(
        async (status: statusType) => {
          setIsLoading(true);
          const res = await dispatchAction(
            getShiftDetails(props.id)
          );
          if (!status.aborted) {
            if (res && res.data) {
              dispatch({ type: "set_form", form: res.data });
            }
            setIsLoading(false);
          }
        },
        [props.id, dispatchAction]
      );
    
      useAbortableEffect(
        (status: statusType) => {
          fetchData(status);
        },
        [fetchData]
      );

    if (isLoading) {
        return <Loading />;
    }

    return (
    <div className="px-2 pb-2">
        <PageTitle title={"Create Shift Request"} />
        <div className="mt-4">
            <Card>
                <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="md:col-span-2">

                        <InputLabel>Status</InputLabel>
                        <SelectField
                                name="status"
                                variant="outlined"
                                margin="dense"
                                optionArray={true}
                                value={state.form.status}
                                options={shiftStatusOptions}
                                onChange={handleChange}
                                className="bg-white h-14 w-1/3 mt-2 shadow-sm md:text-sm md:leading-5"/>
                    </div>
                    <div>
                        <InputLabel>Name of shifting approving facility</InputLabel>
                        <FacilitySelect
                            multiple={false}
                            name="shifting_approving_facility"
                            selected={state.form.shifting_approving_facility_object}
                            setSelected={(obj) => setFacility(obj, 'shifting_approving_facility_object')}
                            errors={state.errors.shifting_approving_facility}
                        />
                    </div>

                    <div>
                        <InputLabel>What facility would you like to assign the patient to</InputLabel>
                        <FacilitySelect
                            multiple={false}
                            name="assigned_facility"
                            selected={state.form.assigned_facility_object}
                            setSelected={(obj) => setFacility(obj, 'assigned_facility_object')}
                            errors={state.errors.assigned_facility}
                        />
                    </div>

                    <div>
                        <InputLabel>Is this an emergency?</InputLabel>
                        <RadioGroup
                                aria-label="emergency"
                                name="emergency"
                                value={[true, 'true'].includes(state.form.emergency)}
                                onChange={handleChange}
                                style={{ padding: "0px 5px" }}>
                            <Box>
                                <FormControlLabel
                                    value={true}
                                    control={<Radio />}
                                    label="Yes"
                                />
                                <FormControlLabel
                                    value={false}
                                    control={<Radio />}
                                    label="No"
                                />
                            </Box>
                        </RadioGroup>
                        <ErrorHelperText error={state.errors.emergency} />
                    </div>

                    <div>
                        <InputLabel>Is this an upshift?</InputLabel>
                        <RadioGroup
                                aria-label="is it upshift"
                                name="is_up_shift"
                                value={[true, 'true'].includes(state.form.is_up_shift)}
                                onChange={handleChange}
                                style={{ padding: "0px 5px" }}>
                            <Box>
                                <FormControlLabel
                                    value={true}
                                    control={<Radio />}
                                    label="Yes"
                                />
                                <FormControlLabel
                                    value={false}
                                    control={<Radio />}
                                    label="No"
                                />
                            </Box>
                        </RadioGroup>
                        <ErrorHelperText error={state.errors.is_up_shift} />
                    </div>

                    <div>
                        <InputLabel>Vehicle preference</InputLabel>
                        <TextInputField
                            fullWidth
                            name="vehicle_preference"
                            variant="outlined"
                            margin="dense"
                            value={state.form.vehicle_preference}
                            onChange={handleChange}
                            errors={state.errors.vehicle_preference}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel>
                            Reason for shift
                        </InputLabel>
                        <MultilineInputField
                            rows={5}
                            name="reason"
                            variant="outlined"
                            margin="dense"
                            type="text"
                            placeholder="Type your reason here"
                            value={state.form.reason}
                            onChange={handleChange}
                            errors={state.errors.reason}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <InputLabel>
                            Any other comments
                        </InputLabel>
                        <MultilineInputField
                            rows={5}
                            name="comments"
                            variant="outlined"
                            margin="dense"
                            type="text"
                            placeholder="type any extra comments here"
                            value={state.form.comments}
                            onChange={handleChange}
                            errors={state.errors.comments}
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-between mt-4">
                        <Button
                                color="default"
                                variant="contained"
                                onClick={goBack}>
                            Cancel
                        </Button>
                        <Button
                                color="primary"
                                variant="contained"
                                type="submit"
                                style={{ marginLeft: "auto" }}
                                onClick={(e) => handleSubmit(e)}
                                startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}>
                            Submit
                        </Button>
                    </div>
                </div>
                </CardContent>
            </Card>
        </div>
    </div>
    )
}
