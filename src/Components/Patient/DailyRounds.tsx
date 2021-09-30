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
import { make as Slider } from "../CriticalCareRecording/components/Slider.gen";
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
import { make as Link } from "../Common/components/Link.gen";
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
  taken_at: null,
  rounds_type: "NORMAL",
  clone_last: null,
  systolic: undefined,
  diastolic: undefined,
  pulse: undefined,
  resp: undefined,
  tempInCelcius: false,
  temperature: undefined,
  rhythm: "0",
  rhythm_detail: "",
  ventilator_spo2: undefined,
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
    let error_div = "";
    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "other_symptoms":
          if (state.form.otherSymptom && !state.form[field]) {
            errors[field] = "Please enter the other symptom details";
            invalidForm = true;
          }
          return;
        case "clone_last":
          if (state.form.clone_last === null) {
            errors[field] = "Please choose a value";
            invalidForm = true;
          }
          return;
        case "admitted_to":
          if (!state.form.admitted_to && state.form.clone_last === "false") {
            errors[field] = "Please select admitted to details";
            if (!error_div) error_div = field;
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return [!invalidForm, error_div];
  };

  const scrollTo = (id: any) => {
    const element = document.querySelector(`#${id}-div`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const fahrenheitToCelcius = (x: any) => {
    const t = (Number(x) - 32.0) * (5.0 / 9.0);
    return String(t.toFixed(2));
  };

  const celciusToFahrenheit = (x: any) => {
    const t = (Number(x) * 9.0) / 5.0 + 32.0;
    return String(t.toFixed(2));
  };

  const calculateMAP = (systolic: any, diastolic: any) => {
    let map = 0;
    if (systolic && diastolic) {
      map = (Number(systolic) + 2 * Number(diastolic)) / 3.0;
    }
    return map.toFixed(2);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const [validForm, error_div] = validateForm();
    if (!validForm) {
      scrollTo(error_div);
    } else {
      setIsLoading(true);
      let baseData = {
        clone_last: state.form.clone_last === "true" ? true : false,
        rounds_type: state.form.rounds_type,
        taken_at: state.form.taken_at
          ? state.form.taken_at
          : new Date().toISOString(),
      };

      let data: any;

      if (state.form.clone_last !== "true") {
        data = {
          ...baseData,
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
        };
      } else {
        data = baseData;
      }

      if (state.form.rounds_type === "NORMAL") {
        data = {
          ...data,
          bp:
            state.form.systolic && state.form.diastolic
              ? {
                  systolic: Number(state.form.systolic),
                  diastolic: Number(state.form.diastolic),
                  mean: Number(
                    calculateMAP(state.form.systolic, state.form.diastolic)
                  ),
                }
              : undefined,
          pulse: Number(state.form.pulse),
          resp: Number(state.form.resp),
          temperature: state.form.tempInCelcius
            ? celciusToFahrenheit(state.form.temperature)
            : state.form.temperature,
          rhythm: Number(state.form.rhythm),
          rhythm_detail: state.form.rhythm_detail,
          ventilator_spo2: Number(state.form.ventilator_spo2),
        };
      }

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

  const handleSliderChange = (value: any, key: string) => {
    console.log(value);
    const form = { ...state.form };
    form[key] = value;
    dispatch({ type: "set_form", form });
  };

  const getStatus = (
    min: any,
    minText: string,
    max: any,
    maxText: string,
    val: any
  ): [string, string] => {
    if (val >= min && val <= max) {
      return ["Normal", "#059669"];
    } else if (val < min) {
      return [minText, "#DC2626"];
    } else {
      return [maxText, "#DC2626"];
    }
  };

  const toggleTemperature = () => {
    const isCelcius = state.form.tempInCelcius;
    const temp = state.form.temperature;

    const form = { ...state.form };
    form.temperature = isCelcius
      ? celciusToFahrenheit(temp)
      : fahrenheitToCelcius(temp);
    form.tempInCelcius = !isCelcius;
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
                <div className="mt-4">
                  <InputLabel id="rounds_type">Round Type</InputLabel>
                  <SelectField
                    className="md:w-1/2"
                    name="rounds_type"
                    variant="standard"
                    margin="dense"
                    options={[
                      {
                        id: "NORMAL",
                        name: "Normal",
                      },
                      {
                        id: "VENTILATOR",
                        name: "Critical Care",
                      },
                    ]}
                    optionValue="name"
                    value={state.form.rounds_type}
                    onChange={handleChange}
                    errors={state.errors.rounds_type}
                  />
                </div>
              </div>
              {!id && (
                <div id="clone_last-div" className="mt-4">
                  <InputLabel id="clone_last">
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
                  <ErrorHelperText error={state.errors.clone_last} />
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

                    <div className="flex-1" id="admitted_to-div">
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
                  {state.form.rounds_type === "NORMAL" && (
                    <div className="mt-4">
                      <h3>Vitals</h3>
                      <div className="mx-2 md:flex justify-between">
                        <h4>{"BP (mm hg)"}</h4>
                        <p>{`Mean Arterial Pressure: ${calculateMAP(
                          state.form.systolic,
                          state.form.diastolic
                        )}`}</p>
                      </div>

                      <Slider
                        title={"Systolic"}
                        start={"0"}
                        end={"250"}
                        interval={"10"}
                        step={1.0}
                        value={state.form.systolic}
                        setValue={(val: any) =>
                          handleSliderChange(val, "systolic")
                        }
                        getLabel={(val: any) =>
                          getStatus(100.0, "Low", 140.0, "High", val)
                        }
                      />
                      <Slider
                        title={"Diastolic"}
                        start={"30"}
                        end={"180"}
                        interval={"10"}
                        step={1.0}
                        value={state.form.diastolic}
                        setValue={(val: any) =>
                          handleSliderChange(val, "diastolic")
                        }
                        getLabel={(val: any) =>
                          getStatus(50.0, "Low", 90.0, "High", val)
                        }
                      />
                      <Slider
                        title={"Pulse (bpm)"}
                        start={"0"}
                        end={"200"}
                        interval={"10"}
                        step={1.0}
                        value={state.form.pulse}
                        setValue={(val: any) =>
                          handleSliderChange(val, "pulse")
                        }
                        getLabel={(val: any) =>
                          getStatus(
                            40.0,
                            "Bradycardia",
                            100.0,
                            "Tachycardia",
                            val
                          )
                        }
                      />
                      <Slider
                        title={"Temperature"}
                        titleNeighbour={
                          <div
                            className="flex items-center ml-1 border border-gray-400 rounded px-4 h-10 cursor-pointer hover:bg-gray-200"
                            onClick={toggleTemperature}
                          >
                            <span className="text-blue-700">
                              {" "}
                              {state.form.tempInCelcius ? "C" : "F"}{" "}
                            </span>
                          </div>
                        }
                        start={state.form.tempInCelcius ? "35" : "95"}
                        end={state.form.tempInCelcius ? "41" : "106"}
                        interval={"10"}
                        step={0.1}
                        value={state.form.temperature}
                        setValue={(val: any) =>
                          handleSliderChange(val, "temperature")
                        }
                        getLabel={(val: any) =>
                          state.form.tempInCelcius
                            ? getStatus(36.4, "Low", 37.5, "High", val)
                            : getStatus(97.6, "Low", 99.6, "High", val)
                        }
                      />
                      <Slider
                        title={"Respiratory Rate (bpm)"}
                        start={"10"}
                        end={"50"}
                        interval={"5"}
                        step={1.0}
                        value={state.form.resp}
                        setValue={(val: any) => handleSliderChange(val, "resp")}
                        getLabel={(val: any) =>
                          getStatus(12.0, "Low", 16.0, "High", val)
                        }
                      />
                      <div className="mx-2">
                        <p className="mb-2 font-bold">Rhythm</p>
                        <RadioGroup
                          aria-label="rhythm"
                          name="rhythm"
                          value={state.form.rhythm}
                          onChange={handleChange}
                          style={{ padding: "0px 5px" }}
                        >
                          <Box display="flex" flexDirection="row">
                            <FormControlLabel
                              value="5"
                              control={<Radio />}
                              label="Regular"
                            />
                            <FormControlLabel
                              value="10"
                              control={<Radio />}
                              label="Irregular"
                            />
                            <FormControlLabel
                              value="0"
                              control={<Radio />}
                              label="Unknown"
                            />
                          </Box>
                        </RadioGroup>
                      </div>
                      <div className="mx-2 w-full">
                        <p className="mb-2 font-bold">Description</p>
                        <textarea
                          name="rhythm_detail"
                          className="block w-full border-gray-500 border-2 rounded px-2 py-1"
                          rows={3}
                          value={state.form.rhythm_detail}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="mt-4">
                        <Slider
                          title={"SPO2 (%)"}
                          start={"0"}
                          end={"100"}
                          interval={"10"}
                          step={1.0}
                          value={state.form.ventilator_spo2}
                          setValue={(val: any) =>
                            handleSliderChange(val, "ventilator_spo2")
                          }
                          getLabel={(val: any) =>
                            getStatus(90.0, "Low", 100.0, "High", val)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-between">
                {id && (
                  <Link
                    className="btn btn-default bg-white mt-2"
                    href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${id}/update`}
                  >
                    Back
                  </Link>
                )}
                {!id && (
                  <Link
                    className="btn btn-default bg-white mt-2"
                    href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/updates`}
                  >
                    Back
                  </Link>
                )}

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
