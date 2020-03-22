import React, { useState } from "react";
import { Button, Card, CardHeader, Grid, CardContent, CardActions } from "@material-ui/core";
import { TextInputField, RadioButtonField } from '../Common/HelperInputFields';
import { useDispatch } from "react-redux"; import { A } from "hookrouter";
import { postDriver } from "../../Redux/actions";
import { isEmpty } from "lodash";
export const DriverDetailsForm = () => {
  const dispatch: any = useDispatch();
  const initForm: any = {
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
    const err = Object.assign({}, errors);
    Object.keys(form).forEach((key) => {

      console.log('||||', form.driverName1.value);


      switch (key) {
        case 'driverName1':
          form.driverName1.value === '' || form.driverName1.value === undefined
          break;
        case 'cellNumber1':
          !/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/g.test(
            form.cellNumber1
          ) && (err.cellNumber1 = "Invalid phone number");
          break;
        case 'driverName2':
          form.driverName2.value === '' || form.driverName2.value === undefined
          break;
        case 'cellNumber2':
          !/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/g.test(
            form.cellNumber2
          ) && (err.cellNumber2 = "Invalid phone number");
        default: break;
      }
    });
    console.log('>>>', err)
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
      console.log('Valid', form)
    } else {
      console.log('Not Valid', form)
    }
    // if (valid) {
    //   dispatch(postAmb(valid)).then((resp: any) => {
    //     const res = POST(resp, 'data', null);
    //     const statusCode = get(resp, 'status', '');
    //     if (res && statusCode === 401) {
    //       const err = {

    //       }
    //     } else {

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

