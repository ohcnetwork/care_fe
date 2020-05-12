import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { postLogin } from "../../Redux/actions";
import { A, navigate } from "hookrouter";
import { makeStyles } from "@material-ui/styles";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid, TextField
} from "@material-ui/core";
import { TextInputField } from "../Common/HelperInputFields";
import { get } from "lodash";
import { PublicDashboard } from "../Dashboard/PublicDashboard";
import ReCaptcha from "react-google-recaptcha";

const useStyles = makeStyles(theme => ({
  formTop: {
    marginTop: "100px"
  },
  pdLogo: {
    height: "345px",
    border: "solid 3px white"
  },
  logoImg: {
    objectFit: "contain",
    height: "8rem"
  },
  imgSection: {
    paddingBottom: "45px"
  }
}));

export const Login = () => {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initForm: any = {
    username: "",
    password: ""
  };
  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [isCaptchaEnabled, setCaptcha] = useState(false);

  const captchaKey = process.env.GOOGLE_KEY ? process.env.GOOGLE_KEY : "";

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
      if (
        typeof form[key] === "string" &&
        key !== "password" &&
        key !== "confirm"
      ) {
        if (!form[key].match(/\w/)) {
          hasError = true;
          err[key] = "This field is required";
        }
      }
      if (!form[key]) {
        hasError = true;
        err[key] = "This field is required";
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
      dispatch(postLogin(valid)).then((resp: any) => {
        const res = get(resp, "data", null);
        const statusCode = get(resp, "status", "");
        if (res && statusCode === 429) {
          setCaptcha(true);
        } else if (res && statusCode === 200) {
          localStorage.setItem("care_access_token", res.access);
          localStorage.setItem("care_refresh_token", res.refresh);
          navigate("/facility");
          window.location.reload();
        }
      });
    }
  };

  const onCaptchaChange = (value: any) => {
    if (value && isCaptchaEnabled) {
      const formCaptcha = { ...form };
      formCaptcha["g-recaptcha-response"] = value;
      setForm(formCaptcha);
    }
  };

  return (
    <div className="flex flex-col md:flex-row my-20 md:my-40 items-center justify-between ">
      <PublicDashboard />
      <div className="w-full md:w-auto mt-10 md:mt-0">
        <div className="bg-white mt-4 md:mt-20 rounded-lg shadow-lg px-4 py-4">
          <div className="text-2xl font-bold text-center pt-4 text-green-600">
            Authorized Login
          </div>
          <form onSubmit={e => handleSubmit(e)}>
            <CardContent>
              <TextInputField
                name="username"
                label="User Name"
                variant="outlined"
                margin="dense"
                InputLabelProps={{ shrink: !!form.username }}
                value={form.username}
                onChange={handleChange}
                errors={errors.username}
              />
              <TextInputField
                type="password"
                name="password"
                label="Password"
                variant="outlined"
                margin="dense"
                autoComplete='off'
                InputLabelProps={{ shrink: !!form.password }}
                value={form.password}
                onChange={handleChange}
                errors={errors.password}
              />
            </CardContent>
            <CardActions className="padding16">
              {/*<A href="/forgot-password">Forgot password ?</A>*/}
              <Grid container justify="center">
                {isCaptchaEnabled && (
                  <Grid item className="w3-padding">
                    <ReCaptcha
                      sitekey={captchaKey}
                      onChange={onCaptchaChange}
                    />
                    <span className="w3-text-red">{errors.captcha}</span>
                  </Grid>
                )}
                <Grid item style={{ display: "flex" }}>
                  <Grid container alignItems="center" justify="center">
                    <Grid item>
                      <Button
                        color="primary"
                        variant="contained"
                        type="submit"
                        onClick={e => handleSubmit(e)}
                      >
                        Login
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardActions>
          </form>
        </div>
      </div>
    </div>
  );
};
