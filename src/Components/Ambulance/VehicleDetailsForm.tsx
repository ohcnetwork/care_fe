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
import { A } from "hookrouter";
import { DISTRICT_CHOICES } from './constants'

//add empty option to districts
const districtOptions = [{ id: "", text: "--select--" }, ...DISTRICT_CHOICES]

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
    const validateData = () => {
        let hasError = false;
        const err = Object.assign({}, errors);
        Object.keys(form).forEach(key => {
            switch (key) {
                case "registrationNumber":
                    !/^[a-z0-9]+$/i.test(form.registrationNumber) &&
                        (err.registrationNumber =
                            "Invalid registration number");
                    break;
                case "insuranceValidTill":
                    break;
                case "nameOfOwner":
                    !form.nameOfOwner &&
                        (err.nameOfOwner = "Name of owner is required.");
                    break;
                case "ownerPhoneNumber":
                    !/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/g.test(
                        form.ownerPhoneNumber
					) && (err.ownerPhoneNumber = "Invalid phone number");
				default:
					break;
            }
        });
        if (hasError) {
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
                                    value={form.username}
                                    onChange={handleChange}
                                    errors={errors.username}
                                />
                                <DateInputField
                                    type="insuranceValidTill"
                                    label="Insurance valid till"
                                    variant="outlined"
                                    margin="dense"
                                    value={form.insuranceValidTill}
                                    onChange={handleChange}
                                    errors={errors.password}
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
                                    errors={errors.password}
                                />
                                <Checkbox
                                    checked={form.isSmartPhone}
                                    onChange={handleChange}
                                    name="isSmartPhone"
                                    value
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
								<ErrorHelperText error={errors.primaryDistrict}/>
								<NativeSelectField
									name="secondaryDistrict"
									placeholder="Secondary district served"
									variant="outlined"
									margin="dense"
									options={districtOptions}
									value={form.secondaryDistrict}
									onChange={handleChange}
								/>
								<ErrorHelperText error={errors.secondaryDistrict}/>
                                <NativeSelectField
                                    name="thirdDistrict"
                                    placeholder="Third district served"
                                    variant="outlined"
									margin="dense"
									options={districtOptions}
                                    value={form.thirdDistrict}
                                    onChange={handleChange}
                                />
								<ErrorHelperText error={errors.thirdDistrict}/>
                                <Grid>
                                    <Checkbox
                                        checked={form.isSmartPhone}
                                        onChange={handleChange}
                                        name="isSmartPhone"
                                        value
                                    />{" "}
                                    Has Oxygen supply
                                </Grid>
                                <Grid>
                                    <Checkbox
                                        checked={form.isSmartPhone}
                                        onChange={handleChange}
                                        name="isSmartPhone"
                                        value
                                    />{" "}
                                    Has ventilator
                                </Grid>
                                <Grid>
                                    <Checkbox
                                        checked={form.isSmartPhone}
                                        onChange={handleChange}
                                        name="isSmartPhone"
                                        value
                                    />{" "}
                                    Has suction machine
                                </Grid>
                                <Grid>
                                    <Checkbox
                                        checked={form.isSmartPhone}
                                        onChange={handleChange}
                                        name="isSmartPhone"
                                        value
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
