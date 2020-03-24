import React, { useState } from "react";
import { Button, Card, CardHeader, Grid, CardContent, CardActions, Checkbox } from "@material-ui/core";
import { TextInputField } from '../Common/HelperInputFields';
import { useDispatch } from "react-redux"; import { A } from "hookrouter";
import { postAmbulance } from "../../Redux/actions";
import { isEmpty, get } from "lodash";
export const DriverDetailsForm = (props:any) => {
  const { vehicleInfo } = props;
  const dispatch: any = useDispatch();
  const initForm: any = {
    driverName1: '',
    cellNumber1: '',
    isSmartPhone1: false,
    driverName2: '',
    cellNumber2: '',
    isSmartPhone2: false
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
    const err = Object.assign({});
    Object.keys(form).forEach((key) => {
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
        case 'driverName2':
          if (!value) {
            err[key] = "This field is required"
          }
          break;
        case 'cellNumber2':
          if (!value) {
            err[key] = "This field is required"
          }else if(value && !(/^[0-9]{10}$/.test(form.cellNumber2))){
            err[key] = "Invalid phone number";
          }
          break;
        default: break;
      }
    });
    if (!isEmpty(err)) {
      setErrors(err);
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
        "vehicle_number": vehicleInfo.registrationNumber,
        "owner_name": vehicleInfo.nameOfOwner,
        "owner_phone_number": vehicleInfo.ownerPhoneNumber,
        "owner_is_smart_phone": vehicleInfo.isSmartPhone,
        "primary_district": vehicleInfo.primaryDistrict,
        "secondary_district": vehicleInfo.secondaryDistrict,
        "third_district": vehicleInfo.thirdDistrict,
        "has_oxygen": vehicleInfo.hasOxygenSupply,
        "has_ventilator": vehicleInfo.hasVentilator,
        "has_suction_machine": vehicleInfo.hasSuctionMachine,
        "has_defibrillator": vehicleInfo.hasDefibrillator,
        "insurance_valid_till_year": vehicleInfo.insuranceValidTill
      };

      dispatch(postAmbulance(ambulanceData)).then((resp: any) => {
        console.log('resp: ', resp);
        const res = get(resp, 'data', null);
        const statusCode = get(resp, 'status', '');
        if (res && statusCode === 401) {
          alert('Something went wrong..!');
        } else if (res && statusCode === 200) {
          alert('Ambulance Added Successfully');
        }
      })
    }
  };

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
                  placeholder="Driver Name"
                  variant="outlined"
                  margin="dense"
                  value={form.driverName1}
                  onChange={handleChange}
                  errors={errors.driverName1}
                />
                <TextInputField
                  type="number"
                  name="cellNumber1"
                  placeholder="Cellphone Number"
                  variant="outlined"
                  margin="dense"
                  value={form.cellNumber1}
                  onChange={handleChange}
                  errors={errors.cellNumber1}
                />

                <Checkbox
                  checked={form.isSmartPhone1}
                  onChange={handleCheckboxFieldChange}
                  name="isSmartPhone1"
                />{" "}
                Is smart phone

                <h4>Driver 2</h4>
                <TextInputField
                  name="driverName2"
                  placeholder="Driver Name"
                  variant="outlined"
                  margin="dense"
                  value={form.driverName2}
                  onChange={handleChange}
                  errors={errors.driverName2}
                />
                <TextInputField
                  type="number"
                  name="cellNumber2"
                  placeholder="Cellphone Number"
                  variant="outlined"
                  margin="dense"
                  value={form.cellNumber2}
                  onChange={handleChange}
                  errors={errors.cellNumber2}
                />

                <Checkbox
                  checked={form.isSmartPhone2}
                  onChange={handleCheckboxFieldChange}
                  name="isSmartPhone2"
                />{" "}
                Is smart phone
              </CardContent>

              <CardActions className="padding16">
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: 'auto' }}
                  onClick={(e) => handleSubmit(e)}
                >Save Details</Button>
              </CardActions>
            </form>
          </Card>
        </Grid>
      </Grid>
    </div>
  )

};

