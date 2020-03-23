import React, { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Grid,
    Checkbox, Typography
} from "@material-ui/core";
import {
    TextInputField,
    DateInputField,
    ErrorHelperText,
    NativeSelectField
} from "../Common/HelperInputFields";
import { DISTRICT_CHOICES } from "./constants";
import { isEmpty } from "lodash";


//add empty option to districts
const districtOptions = [{ id: "", text: "--select--" }, ...DISTRICT_CHOICES];

export const VehicleDetailsForm = (props: any) => {
    const { classes, setVehicleObj, vehicleDetails } = props;
    const initForm: any = {
        registrationNumber: "",
        insuranceValidTill: null,
        nameOfOwner: "",
        ownerPhoneNumber: "",
        isSmartPhone: false,
        primaryDistrict: "",
        secondaryDistrict: "",
        thirdDistrict: "",
        hasOxygenSupply: false,
        hasVentilator: false,
        hasSuctionMachine: false,
        hasDefibrillator: false
    };
    const initErr: any = {};
    const [form, setForm] = useState<any>(Object.assign(initForm,vehicleDetails));
    const [errors, setErrors] = useState(initErr);

    const handleChange = (e: any) => {
        const { value, name } = e.target;
        const fieldValue = Object.assign({}, form);
        const errorField = Object.assign({}, errors);
        if (errorField[name]) {
            errorField[name] = null;
            setErrors(errorField);
        }
        fieldValue[name] = value;
        setForm(fieldValue);
    };

    const handleCheckboxFieldChange = (e: any) => {
        const { checked, name } = e.target;
        const fieldValue = Object.assign({}, form);
        fieldValue[name] = checked;
        setForm(fieldValue);
    };

    const validateData = () => {
        const err = Object.assign({}, errors);
        Object.keys(form).forEach(key => {
            const value = form[key];
            switch (key) {
                case "registrationNumber":
                    if (!value) {
                        err[key] = "This field is required";
                    }
                    break;
                case "insuranceValidTill":
                    !value && (err[key] = "This field is required");
                    break;
                case "nameOfOwner":
                    !value && (err[key] = "This field is required");
                    break;
                case "ownerPhoneNumber":
                    if (!value) {
                        err[key] = "This field is required";
                    } else if (
                        !/^[0-9]{10}$/.test( value
                        )
                    ) {
                        err[key] = "Invalid phone number";
                    }
                    break;
                case "primaryDistrict":
                case "secondaryDistrict":
                case "thirdDistrict":
                    !value && (err[key] = "This field is required");
                    break;
                default:
                    break;
            }
        });
        if (!isEmpty(err)) {
            setErrors(err);
            return false;
        }
        return form;
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const valid = validateData();
        if (valid) {
            setVehicleObj(form);
        }
    };
    return (
        <div>
            <Grid container alignContent="center" justify="center">
                <Grid item xs={12}>
                    <Card style={{marginBottom:'20px'}}>
                        <CardHeader title="Vehicle Details"/>
                        <form onSubmit={e => { handleSubmit(e) }} className={`${classes.formBottomPadding}`}>
                            <CardContent className={classes.cardContent}>
                                <Box display="flex" flexDirection="column">
                                    <TextInputField
                                        name="registrationNumber"
                                        placeholder="Vehicle registration number"
                                        variant="outlined"
                                        margin="dense"
                                        InputLabelProps={{ shrink: !!form.registrationNumber }}
                                        value={form.registrationNumber}
                                        onChange={handleChange}
                                        errors={errors.registrationNumber}
                                    />
                                    <DateInputField
                                        type="insuranceValidTill"
                                        label="Insurance valid till"
                                        variant="outlined"
                                        margin="dense"
                                        value={form.insuranceValidTill}
                                        InputLabelProps={{ shrink: !!form.insuranceValidTill }}
                                        onChange={(date: any) =>
                                            handleChange({
                                                target: {
                                                    name: "insuranceValidTill",
                                                    value: date
                                                }
                                            })
                                        }
                                        errors={errors.insuranceValidTill}
                                        className={classes.dateField}
                                    />
                                    <TextInputField
                                        name="nameOfOwner"
                                        placeholder="Name of owner"
                                        variant="outlined"
                                        margin="dense"
                                        value={form.nameOfOwner}
                                        InputLabelProps={{ shrink: !!form.nameOfOwner }}
                                        onChange={handleChange}
                                        errors={errors.nameOfOwner}
                                    />
                                    <TextInputField
                                        name="ownerPhoneNumber"
                                        placeholder="Owner phone number"
                                        variant="outlined"
                                        margin="dense"
                                        value={form.ownerPhoneNumber}
                                        InputLabelProps={{ shrink: !!form.ownerPhoneNumber }}
                                        onChange={handleChange}
                                        errors={errors.ownerPhoneNumber}
                                    />
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start" alignItems="center">
                                        <Checkbox
                                            checked={form.isSmartPhone}
                                            onChange={handleCheckboxFieldChange}
                                            name="isSmartPhone"
                                        />
                                        <Typography className={classes.checkBoxLabel}>Is smart phone?</Typography>
                                    </Box>
                                    <Box>
                                        <Typography>
                                            Select Serviceable Districts
                                        </Typography>
                                    </Box>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "primaryDistrict"
                                            }}
                                            placeholder="Primary district served"
                                            variant="outlined"
                                            margin="dense"
                                            InputLabelProps={{ shrink: !!form.primaryDistrict }}
                                            options={districtOptions}
                                            value={form.primaryDistrict}
                                            onChange={handleChange}
                                            
                                        />
                                        <ErrorHelperText
                                            error={errors.primaryDistrict}
                                        />
                                    </div>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "secondaryDistrict"
                                            }}
                                            placeholder="Secondary district served"
                                            variant="outlined"
                                            margin="dense"
                                            options={districtOptions}
                                            value={form.secondaryDistrict}
                                            onChange={handleChange}
                                        />
                                        <ErrorHelperText
                                            error={errors.secondaryDistrict}
                                        />
                                    </div>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "thirdDistrict"
                                            }}
                                            placeholder="Third district served"
                                            variant="outlined"
                                            margin="dense"
                                            options={districtOptions}
                                            value={form.thirdDistrict}
                                            onChange={handleChange}
                                        />
                                        <ErrorHelperText error={errors.thirdDistrict} />
                                    </div>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start" alignItems="center">
                                        <Checkbox
                                            checked={form.hasOxygenSupply}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasOxygenSupply"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has Oxygen supply
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start" alignItems="center">
                                        <Checkbox
                                            checked={form.hasVentilator}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasVentilator"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has ventilator
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start" alignItems="center">
                                        <Checkbox
                                            checked={form.hasSuctionMachine}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasSuctionMachine"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has suction machine
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start" alignItems="center">
                                        <Checkbox
                                            checked={form.hasDefibrillator}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasDefibrillator"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has defibrilator
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>

                            <CardActions>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    style={{ marginLeft: "auto" }}
                                    onClick={e => handleSubmit(e)}
                                >
                                    Next
                                </Button>
                            </CardActions>
                        </form>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};
