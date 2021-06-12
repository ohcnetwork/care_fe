import React, { useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
} from "@material-ui/core";
import { TextInputField, ErrorHelperText } from "../Common/HelperInputFields";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import { postResetPassword } from "../../Redux/actions";
import { navigate } from "raviger";
import { withTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  formTop: {
    marginTop: "100px",
  },
}));

const panelStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  })
);

const ResetPasswordPage = (props: any) => {
  const classes = useStyles();
  const panel = panelStyles();

  const dispatch: any = useDispatch();
  const initForm: any = {
    password: "",
    confirm: "",
  };

  const initErr: any = {};
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState(initErr);
  const [passReg, setPassReg] = useState(0);
  const { t } = props;
  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const fieldValue = Object.assign({}, form);
    const errorField = Object.assign({}, errors);
    if (errorField[name]) {
      errorField[name] = null;
      setErrors(errorField);
    }
    fieldValue[name] = value;
    setPassReg(0);
    setForm(fieldValue);
  };

  const validateData = () => {
    let hasError = false;
    const err = Object.assign({}, errors);
    if (form.password !== form.confirm) {
      hasError = true;
      setPassReg(1);
      err.confirm = t("password_mismatch");
    }

    const regex = /^(?=.*[a-z]+)(?=.*[A-Z]+)(?=.*[0-9]+)(?=.*[!@#$%^&*]).{8,}$/;
    if (!regex.test(form.password)) {
      hasError = true;
      err.password = t("invalid_password");
    }

    Object.keys(form).forEach((key) => {
      if (!form[key]) {
        hasError = true;
        err[key] = t("field_required");
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
      valid.token = props.token;
      dispatch(postResetPassword(valid)).then((resp: any) => {
        const res = resp && resp.data;
        if (res && res.status === "OK") {
          localStorage.removeItem("care_access_token");
          Notification.Success({
            msg: t("password_reset_success"),
          });
          navigate("/login");
        } else if (res && res.data) {
          setErrors(res.data);
        } else {
          Notification.Error({
            msg: t("password_reset_failure"),
          });
        }
      });
    }
  };
  return (
    <div>
      <Grid container className={classes.formTop}>
        <Grid item xs={12} md={4} className="marginAuto marginTop50">
          <Card>
            <form
              onSubmit={(e) => {
                handleSubmit(e);
              }}
            >
              <CardHeader title={t("reset_password")} />
              <CardContent>
                <TextInputField
                  type="password"
                  name="password"
                  placeholder={t("new_password")}
                  variant="outlined"
                  margin="dense"
                  onChange={handleChange}
                  errors={errors.password}
                />
                {passReg === 0 && (
                  <div className={panel.root}>
                    <ExpansionPanel>
                      <ExpansionPanelDetails>
                        <Typography className="text-red-500">
                          <li>Minimum password length 8</li>
                          <li>Require at least one digit</li>
                          <li>Require at least one upper case</li>
                          <li>Require at least one lower case letter</li>
                          <li>Require at least one symbol</li>
                        </Typography>
                      </ExpansionPanelDetails>
                    </ExpansionPanel>
                  </div>
                )}
                <TextInputField
                  type="password"
                  name="confirm"
                  placeholder={t("confirm_password")}
                  variant="outlined"
                  margin="dense"
                  onChange={handleChange}
                  errors={errors.confirm}
                />
                <ErrorHelperText error={errors.token} />
              </CardContent>

              <CardActions className="padding16">
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  onClick={(e) => handleSubmit(e)}
                >
                  {t("reset")}
                </Button>
              </CardActions>
            </form>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};
export const ResetPassword = withTranslation()(ResetPasswordPage);
