import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { navigate } from 'hookrouter';
import React, { useReducer, useState , useCallback} from "react";
import { useDispatch } from "react-redux";
import { PATIENT_CATEGORY, SYMPTOM_CHOICES, CURRENT_HEALTH_CHANGE } from "../../Common/constants";
import { createDailyReport, updateDailyReport } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { DateInputField, ErrorHelperText, MultilineInputField, MultiSelectField, SelectField, TextInputField, CheckboxField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {  getConsultationDailyRoundsDetails } from "../../Redux/actions";


const initForm: any = {
    otherSymptom: false,
    additional_symptoms: [],
    other_symptoms: "",
    temperature: "",
    temperature_measured_at: null,
    physical_examination_info: "",
    other_details: "",
    category: "",
    current_health: 0,
    recommend_discharge: false,
};

const initError = Object.assign({}, ...Object.keys(initForm).map(k => ({ [k]: "" })));

const categoryChoices = [
    {
        id: 0,
        text: "Select suspect category"
    },
    ...PATIENT_CATEGORY
];

const initialState = {
    form: { ...initForm },
    errors: { ...initError }
};

const symptomChoices = [
    ...SYMPTOM_CHOICES
];

const currentHealthChoices = [
    ...CURRENT_HEALTH_CHANGE
];


const DailyRoundsFormReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case "set_form": {
            return {
                ...state,
                form: action.form
            }
        }
        case "set_error": {
            return {
                ...state,
                errors: action.errors
            }
        }
        default:
            return state
    }
};

const goBack = () => {
    window.history.go(-1);
};

export const DailyRounds = (props: any) => {
    const dispatchAction: any = useDispatch();
    const { facilityId, patientId, id, consultationId, dailyRoundListId } = props;
    const [state, dispatch] = useReducer(DailyRoundsFormReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);

    const headerText = (!dailyRoundListId ) ? "Add Daily Rounds" : "Edit Daily Rounds";
    const buttonText = (!dailyRoundListId ) ? "Save Daily Round" : "Update Daily Round";
    
    function convertUpperCase(str:any) {
        let splitStr:any = str.toLowerCase().split(' ');
        for (let i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' '); 
    }

    const fetchpatient = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const dailyRoundListDetails = await dispatchAction(getConsultationDailyRoundsDetails({ dailyRoundListId,consultationId }));
            if (!status.aborted) {
                if (dailyRoundListDetails && dailyRoundListDetails.data) {
                    dailyRoundListDetails.data.current_health = convertUpperCase(dailyRoundListDetails.data.current_health)
                    let healthValue:any = CURRENT_HEALTH_CHANGE.find((value:any) => {
                        return (dailyRoundListDetails.data.current_health === value.text);
                    })
                    dailyRoundListDetails.data.current_health = healthValue.id;
                    dispatch({ type: "set_form", form: dailyRoundListDetails.data });
                }
                setIsLoading(false);
            }
        },
        [dispatchAction, id]
    );
    useAbortableEffect(
        (status: statusType) => {
            fetchpatient(status);
        },
        [dispatchAction, fetchpatient]
    );
    const validateForm = () => {
        let errors = { ...initError };
        let invalidForm = false;
        Object.keys(state.form).forEach((field, i) => {
            switch (field) {
                case "other_symptoms":
                    if (state.form.otherSymptom && !state.form[field]) {
                        errors[field] = "Please enter the other symptom details";
                        invalidForm = true;
                    }
                    return;
                default:
                    return;
            }
        });
        if (invalidForm) {
            dispatch({ type: "set_error", errors });
            return false
        }
        dispatch({ type: "set_error", errors });
        return true
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const validForm = validateForm();
        if (validForm) {
            setIsLoading(true);
            const data = {
                additional_symptoms: state.form.additional_symptoms,
                other_symptoms: state.form.otherSymptom ? state.form.other_symptoms : undefined,
                temperature: state.form.temperature ? state.form.temperature : undefined,
                temperature_measured_at: state.form.temperature_measured_at,
                physical_examination_info: state.form.physical_examination_info,
                other_details: state.form.other_details,
                consultation: Number(consultationId),
                patient_category: state.form.category,
                current_health: Number(state.form.current_health),
                recommend_discharge: JSON.parse(state.form.recommend_discharge),
            };

            console.log(data);

            let res;
            if(dailyRoundListId){
                res = await dispatchAction(updateDailyReport(data, { consultationId, dailyRoundListId }));
            }else{
                res = await dispatchAction(createDailyReport(data, { consultationId }));
            }

            setIsLoading(false);
            if (res && res.data) {
                dispatch({ type: "set_form", form: initForm });
                if (dailyRoundListId) {
                    Notification.Success({
                        msg: "Daily round details updated successfully"
                    });
                    navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds-list/${dailyRoundListId}`)
                } else {
                    Notification.Success({
                        msg: "Daily round details created successfully"
                    });
                    navigate(`/facility/${facilityId}/patient/${patientId}`);
                }
            }
        }
    };

    const handleChange = (e: any) => {
        const form = { ...state.form };
        const { name, value } = e.target;
        form[name] = value;
        dispatch({ type: "set_form", form });
    };

    const handleDateChange = (date: any, key: string) => {
        let form = { ...state.form };
        form[key] = date;
        dispatch({ type: "set_form", form });
    };

    const handleCheckboxFieldChange = (e: any) => {
        const form = { ...state.form };
        const { checked, name } = e.target;
        form[name] = checked;
        dispatch({ type: "set_form", form });
    };

    const handleSymptomChange = (e: any, child?: any) => {
        const form = { ...state.form };
        const { value } = e?.target;
        const otherSymptoms = value.filter((i: number) => i !== 1);
        // prevent user from selecting asymptomatic along with other options
        form.additional_symptoms = child?.props?.value === 1 ? otherSymptoms.length ? [1] : value : otherSymptoms;
        form.otherSymptom = !!form.additional_symptoms.filter((i: number) => i === 9).length;
        dispatch({ type: "set_form", form });
    };

    if (isLoading) {
        return <Loading />
    }

    return (<div>
        <PageTitle title={headerText} />
        <div className="mt-4">
            <Card>
                <form onSubmit={e => handleSubmit(e)}>
                    <CardContent>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            <div>
                                <InputLabel id="temperature-label">Temperature</InputLabel>
                                <TextInputField
                                    name="temperature"
                                    variant="outlined"
                                    margin="dense"
                                    type="text"
                                    InputLabelProps={{ shrink: !!state.form.temperature }}
                                    value={state.form.temperature}
                                    onChange={handleChange}
                                    errors={state.errors.temperature}
                                />
                            </div>
                            <div>
                                <DateInputField
                                    label="Temperature Measured At"
                                    margin="dense"
                                    value={state.form.temperature_measured_at}
                                    maxDate={new Date()}
                                    onChange={date => handleDateChange(date, "temperature_measured_at")}
                                    errors={state.errors.temperature_measured_at}
                                />
                            </div>
                            <div>
                                <InputLabel id="physical-examination-info-label">Physical Examination Info</InputLabel>
                                <MultilineInputField
                                    rows={5}
                                    name="physical_examination_info"
                                    variant="outlined"
                                    margin="dense"
                                    type="text"
                                    InputLabelProps={{ shrink: !!state.form.physical_examination_info }}
                                    value={state.form.physical_examination_info}
                                    onChange={handleChange}
                                    errors={state.errors.physical_examination_info}
                                />
                            </div>

                            <div>
                                <InputLabel id="other-details-label">Other Details</InputLabel>
                                <MultilineInputField
                                    rows={5}
                                    name="other_details"
                                    variant="outlined"
                                    margin="dense"
                                    type="text"
                                    InputLabelProps={{ shrink: !!state.form.other_details }}
                                    value={state.form.other_details}
                                    onChange={handleChange}
                                    errors={state.errors.other_details}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel id="symptoms-label">
                                    Symptoms
                                </InputLabel>
                                <MultiSelectField
                                    name="additional_symptoms"
                                    variant="outlined"
                                    value={state.form.additional_symptoms}
                                    options={symptomChoices}
                                    onChange={handleSymptomChange}
                                />
                                <ErrorHelperText error={state.errors.additional_symptoms} />
                            </div>

                            {state.form.otherSymptom && (<div className="md:col-span-2">
                                <InputLabel id="other-symptoms-label">Other Symptom Details</InputLabel>
                                <MultilineInputField
                                    rows={5}
                                    name="other_symptoms"
                                    variant="outlined"
                                    margin="dense"
                                    type="text"
                                    placeholder="Enter the other symptoms here"
                                    InputLabelProps={{ shrink: !!state.form.other_symptoms }}
                                    value={state.form.other_symptoms}
                                    onChange={handleChange}
                                    errors={state.errors.other_symptoms}
                                />
                            </div>)}

                            <div>
                                <InputLabel id="category-label">Category</InputLabel>
                                <SelectField
                                    name="category"
                                    variant="standard"
                                    value={state.form.category}
                                    options={categoryChoices}
                                    onChange={handleChange}
                                    errors={state.errors.category}
                                />
                            </div>

                            <div>
                                <InputLabel id="current-health-label">Current Health</InputLabel>
                                <SelectField
                                    name="current_health"
                                    variant="standard"
                                    value={state.form.current_health}
                                    options={currentHealthChoices}
                                    onChange={handleChange}
                                    errors={state.errors.current_health}
                                />
                            </div>

                            <div>
                                <CheckboxField
                                    checked={state.form.recommend_discharge}
                                    onChange={handleCheckboxFieldChange}
                                    name="recommend_discharge"
                                    label="Recommend Discharge"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between">
                            <Button
                                color="default"
                                variant="contained"
                                type="button"
                                onClick={(e) => goBack()}
                            >Cancel</Button>
                            <Button
                                color="primary"
                                variant="contained"
                                type="submit"
                                style={{ marginLeft: 'auto' }}
                                startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                                onClick={(e) => handleSubmit(e)}
                            >
                                {buttonText}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    </div>)
};
