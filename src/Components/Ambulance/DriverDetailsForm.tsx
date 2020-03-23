import React, { useState } from "react";
import { Button, Card, CardHeader, Grid, CardContent, CardActions, Checkbox } from "@material-ui/core";
import { TextInputField } from '../Common/HelperInputFields';
import { useDispatch } from "react-redux"; import { A } from "hookrouter";
import { postAmbulance } from "../../Redux/actions";
import { isEmpty, get } from "lodash";
export const DriverDetailsForm = () => {
  const dispatch: any = useDispatch();
  const initForm: any = {

    drivers: [
      {
        name: '',
        phone_number: '',
        is_smart_phone: ''
      }
    ],

    driverName1: '',
    cellNumber1: '',
    smartPhone1: '',
    driverName2: '',
    cellNumber2: '',
    smartPhone2: ''
  };
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);

  const handleChange = (e: any) => {

    const { value, name } = e.target;
    const fieldValue = Object.assign({}, form);
    const errorField = Object.assign({}, errors);

    if (errorField.name) {
      errorField.name = null;
      setErrors(errorField);
    }
    if (name === 'driverName1') {
      fieldValue.driverName1 = value;
    } else if (name === 'cellNumber1') {
      fieldValue.cellNumber1 = value;
    } else if (name === 'smartPhone1') {
      fieldValue.smartPhone1 = value.toLowerCase();
    } else if (name === 'driverName2') {
      fieldValue.driverName2 = value;
    } else if (name === 'cellNumber2') {
      fieldValue.cellNumber2 = value;
    } else {
      fieldValue.smartPhone2 = value.toLowerCase();
    }
    setForm(fieldValue);
  }

  const validateData = () => {
    const err = Object.assign({});
    Object.keys(form).forEach((key) => {
      const value = form[key];
      switch (key) {
        case 'driverName1':
          if (!value) {
            err.key = "This field is required"
          }
          break;
        case 'cellNumber1':
          !/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/g.test(
            form.cellNumber1
          ) && (err.cellNumber1 = "Invalid phone number");
          break;
        case 'driverName2':
          (form.driverName2.value === '' || form.driverName2.value === undefined) &&
            (err.driverName2 = "Field is required")
          break;
        case 'cellNumber2':
          !/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/g.test(
            form.cellNumber2
          ) && (err.cellNumber2 = "Invalid phone number");
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
    const fieldValue = Object.assign({}, form);
    fieldValue.name = checked;
    if (name === '')
      setForm(fieldValue);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const valid = validateData();
    if (valid) {
      console.log('Valid', form)
    } else {
      console.log('Not Valid', form)
    }
    // if (valid) {
    //   dispatch(postAmbulance(valid)).then((resp: any) => {
    //     const res = get(resp, 'data', null);
    //     const statusCode = get(resp, 'status', '');
    //     if (res && statusCode === 401) {
    //       const err = {
    //       alert('Error Adding Ambulance');
    //       }
    //     } else if (res && statusCode === 200) {
    //       alert('Ambulance Added Successfully');
    //     }
    //   })
    // }
  };

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item className="w3-hide-small" xs={12} sm={7} md={8} lg={9}>

        </Grid>
        <Grid item xs={12} sm={5} md={8} lg={8}>
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
                  pattern="^((\+91|91|0)[\- ]{0,1})?[456789]\d{9}$"
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
                  pattern="^((\+91|91|0)[\- ]{0,1})?[456789]\d{9}$"
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

