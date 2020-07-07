import React, { useState, useCallback, useReducer } from 'react';
import PageTitle from '../Common/PageTitle'
import { InputLabel, Button } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails, updateUserDetails } from "../../Redux/actions";
import { PhoneNumberField, SelectField, TextInputField } from "../Common/HelperInputFields";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { validateEmailAddress } from "../../Common/validation";
import * as Notification from "../../Utils/Notifications.js";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            flexBasis: '33.33%',
            flexShrink: 0,
        },
        secondaryHeading: {
            fontSize: theme.typography.pxToRem(15),
            color: theme.palette.text.secondary,
        },
    }),
);
const initForm: any = {
    first_name: "",
    last_name: "",
    age: "",
    gender: "",
    email: "",
    phone_number: "",
};

const initError = Object.assign({}, ...Object.keys(initForm).map(k => ({ [k]: "" })));

const initialState = {
    form: { ...initForm },
    errors: { ...initError },
};

const editFormReducer = (states = initialState, action: any) => {
    switch (action.type) {
        case "set_form": {
            return {
                ...states,
                form: action.form
            };
        }
        case "set_error": {
            return {
                ...states,
                errors: action.errors
            };
        }
        default:
            return states;
    }
};
const goBack = () => {
    window.history.go(-1);
};

export default function UserProfile() {
    const [states, dispatch] = useReducer(editFormReducer, initialState);
    const classes = useStyles();
    const state: any = useSelector(state => state);
    const { currentUser } = state;
    const username = currentUser.data.username;


    const [expanded, setExpanded] = React.useState<string | false>(false);

    const [isLoading, setIsLoading] = useState(false);
    const dispatchAction: any = useDispatch();

    const initialDetails: any = [{}];
    const [details, setDetails] = useState(initialDetails);

    const genderTypes = [
        {
            id: 0,
            text: "Select"
        },
        ...GENDER_TYPES
    ];


    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res = await dispatchAction(getUserDetails(username));
            if (!status.aborted) {
                if (res && res.data) {
                    setDetails(res.data);
                    const formData: any = {
                        first_name: res.data.first_name,
                        last_name: res.data.last_name,
                        age: res.data.age,
                        gender: res.data.gender,
                        email: res.data.email,
                        phone_number: res.data.phone_number,
                    };
                    dispatch({
                        type: "set_form",
                        form: formData,
                    });
                }
                setIsLoading(false);
            }
        },
        [dispatchAction, username]
    );
    useAbortableEffect(
        (status: statusType) => {
            fetchData(status);
        },
        [fetchData]
    );


    const handleChange = (panel: string) =>
        (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };

    const handleChangeInput = (e: any) => {
        let form = { ...states.form };
        form[e.target.name] = e.target.value;
        dispatch({ type: "set_form", form });
    };


    const validateForm = () => {
        let errors = { ...initError };
        let invalidForm = false;
        Object.keys(states.form).forEach((field, i) => {
            switch (field) {
                case "first_name":
                case "last_name":
                case "gender":
                    if (!states.form[field]) {
                        errors[field] = "Field is required";
                        invalidForm = true;
                    }
                    return;
                case "age":
                    if (!states.form[field]) {
                        errors[field] = "This field is required";
                        invalidForm = true;
                    }
                    return;
                case "phone_number":
                    const phoneNumber = parsePhoneNumberFromString(state.form[field]);
                    if (!states.form[field] || !phoneNumber?.isPossible()) {
                        errors[field] = "Please enter valid phone number";
                        invalidForm = true;
                    }
                    return;
                case "email":
                    if (!states.form[field] || validateEmailAddress(states.form[field])) {
                        errors[field] = "Enter a valid email address";
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


    const handleValueChange = (phoneNo: any, name: string) => {
        if (phoneNo && parsePhoneNumberFromString(phoneNo)?.isPossible()) {
            const query = {
                phone_number: parsePhoneNumberFromString(phoneNo)?.format('E.164')
            };
            const form = { ...states.form };
            form[name] = phoneNo;
            dispatch({ type: "set_form", form });
        }
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        const data = {
            username: username,
            first_name: states.form.first_name,
            last_name: states.form.last_name,
            email: states.form.email,
            phone_number: parsePhoneNumberFromString(state.form.phone_number)?.format('E.164'),
            gender: Number(states.form.gender),
            age: states.form.age,


        };
        const res = await dispatchAction(
            updateUserDetails(username, data)
        );
        setIsLoading(false);
        if (res && res.data) {
            Notification.Success({
                msg: "Details updated successfully"
            });
            goBack();
        }
    };

    return (

        <div className={classes.root}>
            <PageTitle
                title="Profile Management"
                hideBack={true}
                className="mx-3 md:mx-8" />
            <ExpansionPanel expanded={expanded === 'gSetting'} onChange={handleChange('gSetting')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="gSetting-content"
                    id="gSetting-header"
                >
                    <Typography className={classes.heading}>User Profile</Typography>
                    <Typography className={classes.secondaryHeading}>Personal Details</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>

                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-1">
                            <div>
                                <span className="font-semibold leading-relaxed">Username:  </span>
                                {details.username || '-'}
                            </div>
                            <div></div>
                            <div>
                                <span className="font-semibold leading-relaxed">Email ID:  </span>
                                {details.email || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">Contact No.:  </span>
                                {details.phone_number || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">First Name:  </span>
                                {details.first_name || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">Last Name:  </span>
                                {details.last_name || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">Age:  </span>
                                {details.age || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">Gender:  </span>
                                {details.gender || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">Local Body:  </span>
                                {details.local_body?.name || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">District:  </span>
                                {details.district_object?.name || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">State:  </span>
                                {details.state_object?.name || '-'}
                            </div>
                        </div>
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel expanded={expanded === 'aSetting'} onChange={handleChange('aSetting')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="aSetting-content"
                    id="aSetting-header"
                >
                    <Typography className={classes.heading}>Advanced settings</Typography>
                    <Typography className={classes.secondaryHeading}>
                        Password , Contact Number etc..
                    </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>

                        <form onSubmit={e => handleSubmit(e)}>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                <div>
                                    <InputLabel id="name-label">First Name*</InputLabel>
                                    <TextInputField
                                        name="first_name"
                                        variant="outlined"
                                        margin="dense"
                                        type="text"
                                        value={states.form.first_name}
                                        onChange={handleChangeInput}
                                        errors={states.errors.first_name}
                                    />
                                </div>
                                <div>
                                    <InputLabel id="name-label">Last Name*</InputLabel>
                                    <TextInputField
                                        name="last_name"
                                        variant="outlined"
                                        margin="dense"
                                        type="text"
                                        value={states.form.last_name}
                                        onChange={handleChangeInput}
                                        errors={states.errors.last_name}
                                    />
                                </div>
                                <div>
                                    <InputLabel id="age-label">Age*</InputLabel>
                                    <TextInputField
                                        name="age"
                                        variant="outlined"
                                        margin="dense"
                                        value={states.form.age}
                                        onChange={handleChangeInput}
                                        errors={states.errors.age}
                                    />
                                </div>
                                <div>
                                    <InputLabel id="gender-label">Gender*</InputLabel>
                                    <SelectField
                                        name="gender"
                                        variant="outlined"
                                        margin="dense"
                                        value={states.form.gender}
                                        options={genderTypes}
                                        onChange={handleChangeInput}
                                        errors={states.errors.gender}
                                    />
                                </div>
                                <div>
                                    <PhoneNumberField
                                        label="Phone Number*"
                                        value={states.form.phone_number}
                                        // onChange={(value: any) => [handleValueChange(value, 'phone_number')]}
                                        onChange={(value: any) => [
                                            handleValueChange(value, 'phone_number')
                                        ]}
                                        errors={states.errors.phone_number}
                                    />
                                </div>
                                <div>
                                    <InputLabel id="email-label">Email*</InputLabel>
                                    <TextInputField
                                        name="email"
                                        variant="outlined"
                                        margin="dense"
                                        type="text"
                                        value={states.form.email}
                                        onChange={handleChangeInput}
                                        errors={states.errors.email}
                                    />
                                </div>

                            </div>
                            <div className="flex justify-between mt-4">
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    style={{ marginLeft: "auto" }}
                                    startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                                    onClick={e => handleSubmit(e)}
                                > UPDATE </Button>
                            </div>
                        </form>
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel expanded={expanded === 'sSetting'} onChange={handleChange('sSetting')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="sSetting-content"
                    id="sSetting-header"
                >
                    <Typography className={classes.heading}>Personal data</Typography>
                    <Typography className={classes.secondaryHeading}>Non Changeable</Typography>

                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>
                        Non Editable Settings. (Contact Admin to Change these)
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-1">

                            <div>
                                <span className="font-semibold leading-relaxed">Local Body:  </span>
                                {details.local_body?.name || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">District:  </span>
                                {details.district_object?.name || '-'}
                            </div>
                            <div>
                                <span className="font-semibold leading-relaxed">State:  </span>
                                {details.state_object?.name || '-'}
                            </div>
                        </div>
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </div>
    );
}