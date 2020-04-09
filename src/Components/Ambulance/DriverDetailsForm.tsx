import { Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Grid, Switch, Typography } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { navigate } from "hookrouter";
import { isEmpty } from "lodash";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AGREE_CONSENT, AMBULANCE_FREE_SERVICE_CONSENT, AMBULANCE_SERVICE_FEE_TEXT } from "../../Common/constants";
import { postAmbulance } from "../../Redux/actions";
import * as Notification from '../../Utils/Notifications.js';
import { CheckboxField, TextInputField, PhoneNumberField } from "../Common/HelperInputFields";
import { vehicleForm } from "./VehicleDetailsForm";
import { parsePhoneNumberFromString } from 'libphonenumber-js';

interface DriverDetailsProps {
  classes: any;
  vehicleInfo: vehicleForm;
  driverInfo: driverForm;
  setDriverObj: (form: driverForm) => void;
}

export interface driverForm {
  driverName1: string;
  cellNumber1: string;
  isSmartPhone1: boolean;
  driverName2: string;
  cellNumber2: string;
  isSmartPhone2: boolean;
  hasFreeService: boolean;
  pricePerKm: string;
  agreeConsent: boolean;
}

export const initDriverData: driverForm = {
  driverName1: "",
  cellNumber1: "",
  isSmartPhone1: false,
  driverName2: "",
  cellNumber2: "",
  isSmartPhone2: false,
  hasFreeService: true,
  pricePerKm: "",
  agreeConsent: false
};

export const DriverDetailsForm = (props: DriverDetailsProps) => {
  const { vehicleInfo, classes, driverInfo, setDriverObj } = props;
  const dispatch: any = useDispatch();
  const initForm: driverForm = { ...driverInfo };
  const initErr: any = {};
  const [form, setForm] = useState<any>(initForm);
  const [errors, setErrors] = useState<any>(initErr);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const formData = { ...form };
    const errorField = { ...errors };

    if (errorField[name]) {
      errorField[name] = null;
      setErrors(errorField);
    }
    formData[name] = value;
    setForm(formData);
    setDriverObj(formData);
  };

  const validateData = () => {
    const err: any = {};
    Object.keys(form).forEach(key => {
      const value = form[key];
      switch (key) {
        case "driverName1":
          if (!value) {
            err[key] = "This field is required";
          }
          break;
        case "cellNumber1":
          const phoneNumber = parsePhoneNumberFromString(value);
          if (!value || !phoneNumber?.isPossible()) {
            err[key] = "Please enter valid phone number";
          }
          break;
        case "cellNumber2":
          if (form.driverName2 && !value) {
            err[key] = "This field is required";
          } else if (form.driverName2 && value) {
            const phoneNumber2 = parsePhoneNumberFromString(value);
            if (!value || !phoneNumber2?.isPossible()) {
              err[key] = "Please enter valid phone number";
            }
          }
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

  const handleCheckboxFieldChange = (e: any) => {
    const { checked, name } = e.target;
    const formData = { ...form, [name]: checked };
    setForm(formData);
    setDriverObj(formData);
  };

  const handleValueChange = (value: any, name: string) => {
      const formOld = { ...form };
      formOld[name] = value;
      setForm(formOld);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid && vehicleInfo) {
      const ambulanceData = {
        drivers: [
          {
            name: form.driverName1,
            phone_number: parsePhoneNumberFromString(form.cellNumber1)?.format('E.164'),
            is_smart_phone: form.isSmartPhone1
          }
        ],
        vehicle_number: vehicleInfo.registrationNumber
          ? String(vehicleInfo.registrationNumber).toUpperCase()
          : "",
        vehicle_type: vehicleInfo.vehicleType
          ? vehicleInfo.vehicleType
          : undefined,
        owner_name: vehicleInfo.nameOfOwner,
        owner_phone_number: parsePhoneNumberFromString(vehicleInfo.ownerPhoneNumber)?.format('E.164'),
        owner_is_smart_phone: vehicleInfo.isSmartPhone,
        primary_district: vehicleInfo.primaryDistrict
          ? Number(vehicleInfo.primaryDistrict)
          : undefined,
        secondary_district: vehicleInfo.secondaryDistrict
          ? Number(vehicleInfo.secondaryDistrict)
          : undefined,
        third_district: vehicleInfo.thirdDistrict
          ? Number(vehicleInfo.thirdDistrict)
          : undefined,
        has_oxygen: vehicleInfo.hasOxygenSupply,
        has_ventilator: vehicleInfo.hasVentilator,
        has_suction_machine: vehicleInfo.hasSuctionMachine,
        has_defibrillator: vehicleInfo.hasDefibrillator,
        insurance_valid_till_year: vehicleInfo.insuranceValidTill
          ? Number(vehicleInfo.insuranceValidTill)
          : undefined,
        has_free_service: Boolean(form.hasFreeService),
        price_per_km: !form.hasFreeService ? 20 : undefined
      };

      if (!!form.driverName2) {
        ambulanceData.drivers.push({
          name: form.driverName2,
          phone_number: parsePhoneNumberFromString(form.cellNumber2)?.format('E.164'),
          is_smart_phone: form.isSmartPhone2
        });
      }
      setIsLoading(true);
      const res = await dispatch(postAmbulance(ambulanceData));
      setIsLoading(false);
      if (res && res.data) {
        Notification.Success({
          msg: "Ambulance added successfully"
        });
        navigate("/");
      }
    }
  };

  const handleClear = (e: any) => {
    e.preventDefault();
    setErrors(initErr);
    setForm(initDriverData);
    setDriverObj(initDriverData);
  };

  return (
    <div>
      <Grid container alignContent="center" justify="center">
        <Grid item xs={12} className={`${classes.formBottomPadding}`}>
          <Card>
            <CardHeader title="Driver Details" />
            <form onSubmit={e => handleSubmit(e)}>
              <CardContent>
                <h4>Driver 1</h4>
                <TextInputField
                  name="driverName1"
                  label="Driver Name"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={form.driverName1}
                  onChange={handleChange}
                  errors={errors.driverName1}
                />
                <PhoneNumberField
                    label="Cellphone Number"
                    value={form.cellNumber1}
                    onChange={(value: any) => handleValueChange(value, 'cellNumber1')}
                    errors={errors.cellNumber1}
                />
                <CheckboxField
                  checked={form.isSmartPhone1}
                  onChange={handleCheckboxFieldChange}
                  name="isSmartPhone1"
                  label="Has smart phone"
                />
                <h4>Driver 2</h4>
                <TextInputField
                  name="driverName2"
                  label="Driver Name"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  value={form.driverName2}
                  onChange={handleChange}
                  errors={errors.driverName2}
                />
                <PhoneNumberField
                    label="Cellphone Number"
                    value={form.cellNumber2}
                    onChange={(value: any) => handleValueChange(value, 'cellNumber2')}
                    errors={errors.cellNumber2}
                />
                <Box>
                  <CheckboxField
                    checked={form.isSmartPhone2}
                    onChange={handleCheckboxFieldChange}
                    name="isSmartPhone2"
                    label="Has smart phone"
                  />
                </Box>
                <Box>
                  <Typography>
                    <Switch
                      checked={form.hasFreeService}
                      onChange={handleCheckboxFieldChange}
                      name="hasFreeService"
                      inputProps={{ "aria-label": "secondary checkbox" }}
                    />
                    {form.hasFreeService
                      ? AMBULANCE_FREE_SERVICE_CONSENT
                      : AMBULANCE_SERVICE_FEE_TEXT}
                  </Typography>
                </Box>
                <h4>Declaration</h4>
                <Box display="flex">
                  <Box>
                    <Checkbox
                      checked={form.agreeConsent}
                      onChange={handleCheckboxFieldChange}
                      name="agreeConsent"
                      style={{ padding: 0 }}
                    />{" "}
                  </Box>
                  <Box fontSize={12} textAlign="justify" ml={1}>
                    {AGREE_CONSENT}
                  </Box>
                </Box>
              </CardContent>

              <CardActions
                className="padding16"
                style={{ justifyContent: "space-between" }}
              >
                <Button
                  color="default"
                  type="button"
                  onClick={e => handleClear(e)}
                  disabled={isLoading}
                >
                  Clear
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  onClick={e => handleSubmit(e)}
                  startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                  disabled={!form.agreeConsent || isLoading}
                >
                  Add Ambulance
                </Button>
              </CardActions>
            </form>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};
