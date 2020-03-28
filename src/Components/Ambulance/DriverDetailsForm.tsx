import React, { useState } from "react";
import { Box, Button, Card, CardHeader, Grid, CardContent, CardActions, Checkbox } from "@material-ui/core";
import { TextInputField } from '../Common/HelperInputFields';
import { useDispatch } from "react-redux";
import { postAmbulance } from "../../Redux/actions";
import { isEmpty, get } from "lodash";
import { navigate } from 'hookrouter';
import SaveIcon from '@material-ui/icons/Save';
import { AGREE_CONSENT } from "./constants";
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

interface formFields {
  driverName1: string;
  cellNumber1: string;
  isSmartPhone1: boolean;
  driverName2: string;
  cellNumber2: string;
  isSmartPhone2: boolean;
  agreeConsent: boolean;
}

const initFormData: formFields = {
  driverName1: '',
  cellNumber1: '',
  isSmartPhone1: false,
  driverName2: '',
  cellNumber2: '',
  isSmartPhone2: false,
  agreeConsent: false,
};

export const DriverDetailsForm = (props:any) => {
  const { vehicleInfo } = props;
  const dispatch: any = useDispatch();
  const initForm: formFields = { ...initFormData };
  const initErr: any = {};
  const [form, setForm] = useState<any>(initForm);
  const [errors, setErrors] = useState<any>(initErr);

  const handleChange = (e: any) => {

    const { value, name } = e.target;
    const fieldValue = Object.assign({}, form);
    const errorField = Object.assign({}, errors);

    if (errorField[name]) {
      errorField[name] = null;
      setErrors(errorField);
    }
    if (name === 'driverName1') {
      fieldValue.driverName1 = value;
    } else if (name === 'cellNumber1') {
      fieldValue.cellNumber1 = value;
    } else if (name === 'driverName2') {
      fieldValue.driverName2 = value;
    } else if (name === 'cellNumber2') {
      fieldValue.cellNumber2 = value;
    }
    setForm(fieldValue);
  };

  const validateData = () => {
    const err:any = {};
    Object.keys(form).forEach(key => {
      const value = form[key];
      switch (key) {
        case 'driverName1':
          if (!value) {
            err[key] = "This field is required"
          }
          break;
        case 'cellNumber1':
          if (!value) {
            err[key] = "This field is required"
          }else if(value && !(/^[0-9]{10}$/.test(form.cellNumber1))){
            err[key] = "Invalid phone number";
          }
          break;
        // case 'driverName2':
        //   if (!value) {
        //     err[key] = "This field is required"
        //   }
        //   break;
        case 'cellNumber2':
          if (form.driverName2 && !value) {
            err[key] = "This field is required"
          }else if(form.driverName2 && value && !(/^[0-9]{10}$/.test(form.cellNumber2))){
            err[key] = "Invalid phone number";
          }
          break;
        default: break;
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
    setForm({...form,[name]:checked});
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid && vehicleInfo) {
      const ambulanceData = {
        "drivers": [
          {
            "name": form.driverName1,
            "phone_number": form.cellNumber1,
            "is_smart_phone": form.isSmartPhone1
          },
          {
            "name": form.driverName2,
            "phone_number": form.cellNumber2,
            "is_smart_phone": form.isSmartPhone2
          }
        ],
        "vehicle_number": vehicleInfo.registrationNumber ? String(vehicleInfo.registrationNumber).toUpperCase() : "",
        "vehicle_type": vehicleInfo.vehicleType ? vehicleInfo.vehicleType : null,
        "owner_name": vehicleInfo.nameOfOwner,
        "owner_phone_number": vehicleInfo.ownerPhoneNumber,
        "owner_is_smart_phone": vehicleInfo.isSmartPhone,
        "primary_district": vehicleInfo.primaryDistrict ? vehicleInfo.primaryDistrict : null,
        "secondary_district": vehicleInfo.secondaryDistrict ? vehicleInfo.secondaryDistrict : null,
        "third_district": vehicleInfo.thirdDistrict ? vehicleInfo.thirdDistrict : null,
        "has_oxygen": vehicleInfo.hasOxygenSupply,
        "has_ventilator": vehicleInfo.hasVentilator,
        "has_suction_machine": vehicleInfo.hasSuctionMachine,
        "has_defibrillator": vehicleInfo.hasDefibrillator,
        "insurance_valid_till_year": vehicleInfo.insuranceValidTill ? vehicleInfo.insuranceValidTill : null,
        "hasFreeService": vehicleInfo.hasFreeService,
        "pricePerKm": vehicleInfo.pricePerKm ? vehicleInfo.pricePerKm : null,
      };

      dispatch(postAmbulance(ambulanceData)).then((resp: any) => {
        console.log('resp: ', resp);
        const res = get(resp, 'data', null);
        const statusCode = get(resp, 'status', '');
        if (res && statusCode === 401) {
          alert('Something went wrong..!');
        } else if (res && statusCode === 201) {
          alert('Ambulance Added Successfully');
          navigate("/")
        }
      })
    }
  };

  const handleClear = (e: any) => {
    e.preventDefault();
    setErrors(initErr);
    setForm(initFormData);
  }

  return (
    <div>
      <Grid container alignContent="center" justify="center">
        <Grid item xs={12} >
          <Card>
            <CardHeader title="Driver Details" />
            <form onSubmit={(e) => handleSubmit(e)}>
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
                  <FormGroup>
                    <FormControlLabel
                       control={<Checkbox
                        checked={form.isSmartPhone1}
                         onChange={handleCheckboxFieldChange}
                          name="isSmartPhone1"
                          />} label="Is this a Smart Phone?">
                          </FormControlLabel>
                    </FormGroup>
                

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
                <FormGroup>
                    <FormControlLabel
                       control={<Checkbox
                        checked={form.isSmartPhone2}
                        onChange={handleCheckboxFieldChange}
                        name="isSmartPhone2"
                      />} label="Is this a Smart Phone?">
                          </FormControlLabel>
                    </FormGroup>
                </Box>

                <h4>Declaration</h4>
                <Box display="flex">
                  <FormGroup>
                                            <FormControlLabel
                                                control={<Checkbox
                                                  checked={form.agreeConsent}
                                                  onChange={handleCheckboxFieldChange}
                                                  name="agreeConsent"
                                                />} label={<Box fontSize={12} textAlign="justify" ml={1}>{AGREE_CONSENT}</Box>}>
                                            </FormControlLabel>
                                            </FormGroup>
                  </Box>
                  
              </CardContent>

              <CardActions className="padding16" style={{justifyContent: "space-between"}}>
                <Button
                    color="default"
                    type="button"
                    onClick={e => handleClear(e)}
                >
                    Clear
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  onClick={(e) => handleSubmit(e)}
                  startIcon={<SaveIcon>save</SaveIcon>}
                  disabled={!form.agreeConsent}
                >
                  Save Details
                </Button>
              </CardActions>
            </form>
          </Card>
        </Grid>
      </Grid>
    </div>
  )

};

