import React, { useState } from "react";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Grid,
    Checkbox
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
    const initForm: any = {
        registrationNumber: "",
        insuranceValidTill: null,
        nameOfOwner: "",
        ownerPhoneNumber: "",
        isSmartPhone: false,
        primaryDistrict: "",
        secondaryDistrict: "",
        thirdDistrict: "",
        hasOxygenSupply: true,
        hasVentilator: true,
        hasSuctionMachine: true,
        hasDefibrillator: true
    };
    const initErr: any = {};
    const [form, setForm] = useState(initForm);
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
        if (name === "username") {
            fieldValue[name] = value.toLowerCase();
        }
        setForm(fieldValue);
    };

    const handleCheckboxFieldChange = (e: any) => {
        const { checked, name } = e.target;
        const fieldValue = Object.assign({}, form);
        fieldValue[name] = checked;
        setForm(fieldValue);
    };

    const validateData = () => {
        let hasError = false;
        const err = Object.assign({}, errors);
        Object.keys(form).forEach(key => {
            const value = form[key];
            switch (key) {
                case "registrationNumber":
                    if (!value) {
                        err[key] = "This field is required";
                    } else if (!/^[a-z0-9]+$/i.test(value)) {
                        err[key] = "Invalid registration number";
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
                        !/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/g.test(
                            value
                        )
                    ) {
                        err[key] = "Invalid phone number";
                    }
                case "primaryDistrict":
                case "secondaryDistrict":
                case "thirdDistrict":
                    !value && (err[key] = "This field is required");
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
            props.onSubmit(form);
        }
    };
    return (
        <div>
            <Grid container spacing={2} alignContent="center" justify="center">
                <Grid item xs={12} sm={5} md={4} lg={3}>
                    <Card>
                        <CardHeader title="Vehicle Details" />
                        <form onSubmit={e => {}}>
                            <CardContent>
                                <TextInputField
                                    name="registrationNumber"
                                    placeholder="Vehicle registration number"
                                    variant="outlined"
                                    margin="dense"
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
                                    onChange={(date: any) =>
                                        handleChange({
                                            target: {
                                                name: "insuranceValidTill",
                                                value: date
                                            }
                                        })
                                    }
                                    errors={errors.insuranceValidTill}
                                />
                                <TextInputField
                                    name="nameOfOwner"
                                    placeholder="Name of owner"
                                    variant="outlined"
                                    margin="dense"
                                    value={form.nameOfOwner}
                                    onChange={handleChange}
                                    errors={errors.nameOfOwner}
                                />
                                <TextInputField
                                    name="ownerPhoneNumber"
                                    placeholder="Owner phone number"
                                    variant="outlined"
                                    margin="dense"
                                    value={form.ownerPhoneNumber}
                                    onChange={handleChange}
                                    errors={errors.ownerPhoneNumber}
                                />
                                <Checkbox
                                    checked={form.isSmartPhone}
                                    onChange={handleCheckboxFieldChange}
                                    name="isSmartPhone"
                                />{" "}
                                Is smart phone
                                <NativeSelectField
                                    name="primaryDistrict"
                                    placeholder="Primary district served"
                                    variant="outlined"
                                    margin="dense"
                                    options={districtOptions}
                                    value={form.primaryDistrict}
                                    onChange={handleChange}
                                />
                                <ErrorHelperText
                                    error={errors.primaryDistrict}
                                />
                                <NativeSelectField
                                    name="secondaryDistrict"
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
                                <NativeSelectField
                                    name="thirdDistrict"
                                    placeholder="Third district served"
                                    variant="outlined"
                                    margin="dense"
                                    options={districtOptions}
                                    value={form.thirdDistrict}
                                    onChange={handleChange}
                                />
                                <ErrorHelperText error={errors.thirdDistrict} />
                                <Grid>
                                    <Checkbox
                                        checked={form.hasOxygenSupply}
                                        onChange={handleCheckboxFieldChange}
                                        name="hasOxygenSupply"
                                    />{" "}
                                    Has Oxygen supply
                                </Grid>
                                <Grid>
                                    <Checkbox
                                        checked={form.hasVentilator}
                                        onChange={handleCheckboxFieldChange}
                                        name="hasVentilator"
                                    />{" "}
                                    Has ventilator
                                </Grid>
                                <Grid>
                                    <Checkbox
                                        checked={form.hasSuctionMachine}
                                        onChange={handleCheckboxFieldChange}
                                        name="hasSuctionMachine"
                                    />{" "}
                                    Has suction machine
                                </Grid>
                                <Grid>
                                    <Checkbox
                                        checked={form.hasDefibrillator}
                                        onChange={handleCheckboxFieldChange}
                                        name="hasDefibrillator"
                                    />{" "}
                                    Has defibrilator
                                </Grid>
                            </CardContent>

                            <CardActions className="padding16">
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
