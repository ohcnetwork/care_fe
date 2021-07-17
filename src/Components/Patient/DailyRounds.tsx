import {
  Button,
  CardContent,
  InputLabel,
  RadioGroup,
  Box,
  FormControlLabel,
  Radio,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import {
  CURRENT_HEALTH_CHANGE,
  PATIENT_CATEGORY,
  SYMPTOM_CHOICES,
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
  ADMITTED_TO,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  NativeSelectField,
  CheckboxField,
  MultilineInputField,
  SelectField,
  ErrorHelperText,
  DateTimeFiled,
  MultiSelectField,
} from "../Common/HelperInputFields";
import {
  createDailyReport,
  getConsultationDailyRoundsDetails,
  updateDailyReport,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const admittedToChoices = ["Select", ...ADMITTED_TO];

const initForm: any = {
  otherSymptom: false,
  additional_symptoms: [],
  other_symptoms: "",
  physical_examination_info: "",
  other_details: "",
  category: "",
  current_health: 0,
  recommend_discharge: false,
  actions: null,
  review_time: 0,
  admitted_to: "",
  taken_at: new Date(),
  rounds_type: "NORMAL",
  clone_last: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const categoryChoices = [
  {
    id: 0,
    text: "Select suspect category",
  },
  ...PATIENT_CATEGORY,
];

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const symptomChoices = [...SYMPTOM_CHOICES];

const currentHealthChoices = [...CURRENT_HEALTH_CHANGE];

const DailyRoundsFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
};

const goBack = () => {
  window.history.go(-1);
};

export const DailyRounds = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, consultationId, id } = props;
  const [state, dispatch] = useReducer(DailyRoundsFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);

  const headerText = !id ? "Add Consultation Update" : "Info";
  const buttonText = !id ? "Save" : "Continue";

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getConsultationDailyRoundsDetails({ consultationId, id })
      );

      if (!status.aborted) {
        if (res && res.data) {
          const data = {
            ...res.data,
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "Select",
          };
          dispatch({ type: "set_form", form: data });
        }
        setIsLoading(false);
      }
    },
    [consultationId, id, dispatchAction]
  );
  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchpatient(status);
      }
    },
    [dispatchAction, fetchpatient]
  );
  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "other_symptoms":
          if (state.form.otherSymptom && !state.form[field]) {
            errors[field] = "Please enter the other symptom details";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const data = {
        additional_symptoms: state.form.additional_symptoms,
        other_symptoms: state.form.otherSymptom
          ? state.form.other_symptoms
          : undefined,
        admitted_to:
          (state.form.admitted === "Select"
            ? undefined
            : state.form.admitted_to) || undefined,
        physical_examination_info: state.form.physical_examination_info,
        other_details: state.form.other_details,
        consultation: consultationId,
        patient_category: state.form.category,
        current_health: state.form.current_health,
        recommend_discharge: JSON.parse(state.form.recommend_discharge),
        action: state.form.action,
        review_time: state.form.review_time,
        taken_at: state.form.taken_at,
        rounds_type: state.form.rounds_type,
        clone_last: state.form.clone_last === "true" ? true : false,
      };

      let res;
      if (id) {
        res = await dispatchAction(
          updateDailyReport(data, { consultationId, id })
        );
      } else {
        res = await dispatchAction(createDailyReport(data, { consultationId }));
      }

      setIsLoading(false);
      if (res && res.data && (res.status === 201 || res.status === 200)) {
        dispatch({ type: "set_form", form: initForm });
        if (id) {
          Notification.Success({
            msg: "Consultation Updates details updated successfully",
          });
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${res.data.external_id}/update`
          );
        } else {
          Notification.Success({
            msg: "Consultation Updates details created successfully",
          });
          if (data.clone_last) {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${res.data.external_id}/update`
            );
          } else {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${res.data.external_id}/update`
            );
          }
        }
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, key: string) => {
    let form = { ...state.form };
    form[key] = date;
    dispatch({ type: "set_form", form });
  };

  const handleCheckboxFieldChange = (e: any) => {
    const form = { ...state.form };
    const { checked, name } = e.target;
    form[name] = checked;
    dispatch({ type: "set_form", form });
  };

  const handleSymptomChange = (e: any, child?: any) => {
    const form = { ...state.form };
    const { value } = e?.target;
    const otherSymptoms = value.filter((i: number) => i !== 1);
    // prevent user from selecting asymptomatic along with other options
    form.additional_symptoms =
      child?.props?.value === 1
        ? otherSymptoms.length
          ? [1]
          : value
        : otherSymptoms;
    form.otherSymptom = !!form.additional_symptoms.filter(
      (i: number) => i === 9
    ).length;
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2 max-w-3xl mx-auto">
      <PageTitle title={headerText} />
      <div className="mt-4">
        <div className="bg-white rounded shadow">
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div>
                <div>
                  <DateTimeFiled
                    label="Measured At"
                    margin="dense"
                    value={state.form.taken_at}
                    disableFuture={true}
                    showTodayButton={true}
                    onChange={(date) => handleDateChange(date, "taken_at")}
                    errors={state.errors.taken_at}
                  />
                </div>
              </div>
              {!id && (
                <div id="clone_last-div" className="mt-4">
                  <InputLabel id="is_decclone_lastlared_positive">
                    Do you want to copy Values from Previous Log?
                  </InputLabel>
                  <RadioGroup
                    aria-label="clone_last"
                    name="clone_last"
                    value={state.form.clone_last}
                    onChange={handleChange}
                    style={{ padding: "0px 5px" }}
                  >
                    <Box display="flex" flexDirection="row">
                      <FormControlLabel
                        value="true"
                        control={<Radio />}
                        label="Yes"
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio />}
                        label="No"
                      />
                    </Box>
                  </RadioGroup>
                </div>
              )}
              {(state.form.clone_last === "false" || id) && (
                <div>
                  <div className="md:grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
                    <div>
                      <InputLabel id="physical-examination-info-label">
                        Physical Examination Info
                      </InputLabel>
                      <MultilineInputField
                        rows={5}
                        name="physical_examination_info"
                        variant="outlined"
                        margin="dense"
                        type="text"
                        InputLabelProps={{
                          shrink: !!state.form.physical_examination_info,
                        }}
                        value={state.form.physical_examination_info}
                        onChange={handleChange}
                        errors={state.errors.physical_examination_info}
                      />
                    </div>

                    <div>
                      <InputLabel id="other-details-label">
                        Other Details
                      </InputLabel>
                      <MultilineInputField
                        rows={5}
                        name="other_details"
                        variant="outlined"
                        margin="dense"
                        type="text"
                        InputLabelProps={{ shrink: !!state.form.other_details }}
                        value={state.form.other_details}
                        onChange={handleChange}
                        errors={state.errors.other_details}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <InputLabel id="symptoms-label">Symptoms</InputLabel>
                      <MultiSelectField
                        name="additional_symptoms"
                        variant="outlined"
                        value={state.form.additional_symptoms}
                        options={symptomChoices}
                        onChange={handleSymptomChange}
                      />
                      <ErrorHelperText
                        error={state.errors.additional_symptoms}
                      />
                    </div>

                    {state.form.otherSymptom && (
                      <div className="md:col-span-2">
                        <InputLabel id="other-symptoms-label">
                          Other Symptom Details
                        </InputLabel>
                        <MultilineInputField
                          rows={5}
                          name="other_symptoms"
                          variant="outlined"
                          margin="dense"
                          type="text"
                          placeholder="Enter the other symptoms here"
                          InputLabelProps={{
                            shrink: !!state.form.other_symptoms,
                          }}
                          value={state.form.other_symptoms}
                          onChange={handleChange}
                          errors={state.errors.other_symptoms}
                        />
                      </div>
                    )}

                    <div>
                      <InputLabel id="category-label">Category</InputLabel>
                      <SelectField
                        name="category"
                        variant="standard"
                        value={state.form.patient_category}
                        options={categoryChoices}
                        onChange={handleChange}
                        errors={state.errors.patient_category}
                      />
                    </div>

                    <div>
                      <InputLabel id="current-health-label">
                        Current Health
                      </InputLabel>
                      <SelectField
                        name="current_health"
                        variant="standard"
                        value={state.form.current_health}
                        options={currentHealthChoices}
                        onChange={handleChange}
                        optionKey="text"
                        optionValue="desc"
                        errors={state.errors.current_health}
                      />
                    </div>

                    <div className="flex-1">
                      <InputLabel id="admitted-to-label">
                        Admitted To *{" "}
                      </InputLabel>
                      <SelectField
                        optionArray={true}
                        name="admitted_to"
                        variant="standard"
                        value={state.form.admitted_to}
                        options={admittedToChoices}
                        onChange={handleChange}
                        errors={state.errors.admitted_to}
                      />
                    </div>

                    <div className="flex-1">
                      <InputLabel id="action-label">Action </InputLabel>
                      <NativeSelectField
                        name="action"
                        variant="outlined"
                        value={state.form.action}
                        optionKey="text"
                        optionValue="desc"
                        options={TELEMEDICINE_ACTIONS}
                        onChange={handleChange}
                      />
                      <ErrorHelperText error={state.errors.action} />
                    </div>
                  </div>
                  <div className="md:grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="flex-1">
                      <InputLabel id="review_time-label">
                        Review After{" "}
                      </InputLabel>
                      <SelectField
                        name="review_time"
                        variant="standard"
                        value={state.form.review_time}
                        options={[
                          { id: "", text: "select" },
                          ...REVIEW_AT_CHOICES,
                        ]}
                        onChange={handleChange}
                        errors={state.errors.review_time}
                      />
                    </div>
                    <div>
                      <CheckboxField
                        checked={state.form.recommend_discharge}
                        onChange={handleCheckboxFieldChange}
                        name="recommend_discharge"
                        label="Recommend Discharge"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-between">
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={(e) => goBack()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={
                    <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                  }
                  onClick={(e) => handleSubmit(e)}
                >
                  {buttonText}
                </Button>
              </div>
            </CardContent>
          </form>
        </div>
      </div>
    </div>
  );
};
