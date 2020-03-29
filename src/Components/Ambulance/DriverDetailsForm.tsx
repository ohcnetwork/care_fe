import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardHeader,
  Grid,
  CardContent,
  CardActions,
  Checkbox,
  Typography,
  Switch
} from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { useDispatch } from "react-redux";
import { postAmbulance } from "../../Redux/actions";
import { isEmpty } from "lodash";
import { navigate } from "hookrouter";
import AppMessage from "../Common/AppMessage";
import SaveIcon from "@material-ui/icons/Save";
import {
  AGREE_CONSENT,
  AMBULANCE_FREE_SERVICE_CONSENT,
  AMBULANCE_SERVICE_FEE_TEXT
} from "../../Constants/constants";
import { vehicleForm } from "./VehicleDetailsForm";

interface DriverDetailsProps {
  classes: any;
  vehicleInfo: vehicleForm;
}

interface formFields {
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

const initFormData: formFields = {
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
  const { vehicleInfo, classes } = props;
  const dispatch: any = useDispatch();
  const initForm: formFields = { ...initFormData };
  const initErr: any = {};
  const [form, setForm] = useState<any>(initForm);
  const [errors, setErrors] = useState<any>(initErr);
  const [isLoading, setIsLoading] = useState(false);
  const [showAppMessage, setAppMessage] = useState({
    show: false,
    message: "",
    type: ""
  });

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
          if (!value) {
            err[key] = "This field is required";
          } else if (value && !/^[0-9]{10}$/.test(form.cellNumber1)) {
            err[key] = "Invalid phone number";
          }
          break;
        case "cellNumber2":
          if (form.driverName2 && !value) {
            err[key] = "This field is required";
          } else if (
            form.driverName2 &&
            value &&
            !/^[0-9]{10}$/.test(form.cellNumber2)
          ) {
            err[key] = "Invalid phone number";
          }
          break;
        case "pricePerKm":
          if (!form.hasFreeService && !value) {
            err[key] = "This field is required";
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
    setForm({ ...form, [name]: checked });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid && vehicleInfo) {
      const ambulanceData = {
        drivers: [
          {
            name: form.driverName1,
            phone_number: form.cellNumber1,
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
        owner_phone_number: vehicleInfo.ownerPhoneNumber,
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
          phone_number: form.cellNumber2,
          is_smart_phone: form.isSmartPhone2
        });
      }
      setIsLoading(true);
      const res = await dispatch(postAmbulance(ambulanceData));
      if (res.status !== 201 || !res.data) {
        console.log(res);
        setAppMessage({
          show: true,
          message: "Something went wrong..!",
          type: "error"
        });
        setIsLoading(false);
      } else {
        setAppMessage({
          show: true,
          message: "Ambulance added successfully",
          type: "success"
        });
        setTimeout(() => navigate("/"), 3000);
      }
    }
  };

  const handleClear = (e: any) => {
    e.preventDefault();
    setErrors(initErr);
    setForm(initFormData);
  };

  return (
    <div>
      <AppMessage
        open={showAppMessage.show}
        type={showAppMessage.type}
        message={showAppMessage.message}
        handleClose={() =>
          setAppMessage({ show: false, message: "", type: "" })
        }
        handleDialogClose={() =>
          setAppMessage({ show: false, message: "", type: "" })
        }
      />
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
                <TextInputField
                  name="cellNumber1"
                  label="Cellphone Number"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={form.cellNumber1}
                  onChange={handleChange}
                  errors={errors.cellNumber1}
                  inputProps={{ maxLength: 10 }}
                />
                <Checkbox
                  checked={form.isSmartPhone1}
                  onChange={handleCheckboxFieldChange}
                  name="isSmartPhone1"
                />{" "}
                Has smart phone
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
                <TextInputField
                  name="cellNumber2"
                  label="Cellphone Number"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={form.cellNumber2}
                  onChange={handleChange}
                  errors={errors.cellNumber2}
                  inputProps={{ maxLength: 10 }}
                />
                <Box>
                  <Checkbox
                    checked={form.isSmartPhone2}
                    onChange={handleCheckboxFieldChange}
                    name="isSmartPhone2"
                  />{" "}
                  Has smart phone
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
                  startIcon={<SaveIcon>save</SaveIcon>}
                  disabled={!form.agreeConsent || isLoading}
                >
                  Save Details
                </Button>
              </CardActions>
            </form>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};
