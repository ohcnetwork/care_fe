import {
  CardContent,
  InputLabel,
  RadioGroup,
  Box,
  FormControlLabel,
  Radio,
} from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import loadable from "@loadable/component";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  SYMPTOM_CHOICES,
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  PATIENT_CATEGORIES,
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
  AutoCompleteAsyncField,
} from "../Common/HelperInputFields";
import {
  createDailyReport,
  getConsultationDailyRoundsDetails,
  getDailyReport,
  updateDailyReport,
  getPatient,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { make as Link } from "../Common/components/Link.gen";
import { formatDate } from "../../Utils/utils";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const initForm: any = {
  otherSymptom: false,
  additional_symptoms: [],
  other_symptoms: "",
  physical_examination_info: "",
  other_details: "",
  patient_category: "Comfort",
  current_health: 0,
  recommend_discharge: false,
  actions: null,
  review_interval: 0,
  admitted_to: "",
  taken_at: null,
  rounds_type: "NORMAL",
  clone_last: null,
  systolic: null,
  diastolic: null,
  pulse: null,
  resp: null,
  tempInCelcius: false,
  temperature: null,
  rhythm: "0",
  rhythm_detail: "",
  ventilator_spo2: null,
  // bed: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const symptomChoices = [...SYMPTOM_CHOICES];

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

export const DailyRounds = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, consultationId, id } = props;
  const [state, dispatch] = useReducer(DailyRoundsFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [prevReviewInterval, setPreviousReviewInterval] = useState(-1);
  const [hasPreviousLog, setHasPreviousLog] = useState(false);
  const headerText = !id ? "Add Consultation Update" : "Info";
  const buttonText = !id ? "Save" : "Continue";

  const fetchRoundDetails = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getConsultationDailyRoundsDetails({ consultationId, id })
      );

      if (!status.aborted) {
        if (res && res.data) {
          const data = {
            ...res.data,
            patient_category: res.data.patient_category
              ? PATIENT_CATEGORIES.find(
                  (i) => i.text === res.data.patient_category
                )?.id || "Comfort"
              : "Comfort",
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
        fetchRoundDetails(status);
      }
    },
    [dispatchAction, fetchRoundDetails]
  );

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
          setPreviousReviewInterval(
            Number(res.data.last_consultation.review_interval)
          );
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  useEffect(() => {
    async function fetchHasPreviousLog() {
      if (consultationId && !id) {
        const res = await dispatchAction(
          getDailyReport({ limit: 1, offset: 0 }, { consultationId })
        );
        setHasPreviousLog(res.data.count > 0);
        dispatch({
          type: "set_form",
          form: {
            ...state.form,
            patient_category: res.data.patient_category
              ? PATIENT_CATEGORIES.find(
                  (i) => i.text === res.data.patient_category
                )?.id || "Comfort"
              : "Comfort",
            clone_last: res.data.count > 0 ? "true" : "false",
          },
        });
      }
    }
    fetchHasPreviousLog();
  }, [dispatchAction, consultationId, id]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
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
        case "resp":
          if (
            state.form.resp === null &&
            state.form.rounds_type === "NORMAL" &&
            state.form.clone_last !== "true"
          ) {
            errors[field] = "Please enter a respiratory rate";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const fahrenheitToCelcius = (x: any) => {
    const t = (Number(x) - 32.0) * (5.0 / 9.0);
    return String(t.toFixed(1));
  };

  const celciusToFahrenheit = (x: any) => {
    const t = (Number(x) * 9.0) / 5.0 + 32.0;
    return String(t.toFixed(1));
  };

  const calculateMAP = (systolic: any, diastolic: any) => {
    let map = 0;
    if (systolic && diastolic) {
      map = (Number(systolic) + 2 * Number(diastolic)) / 3.0;
    }
    return map.toFixed(2);
  };

  console.log(state.form.review_interval);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const baseData = {
        clone_last: state.form.clone_last === "true" ? true : false,
        rounds_type: state.form.rounds_type,
        patient_category: state.form.patient_category,
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
          recommend_discharge: JSON.parse(state.form.recommend_discharge),
          action: state.form.action,
          review_interval: Number(
            state.form.review_interval || prevReviewInterval
          ),
        };
        if (state.form.rounds_type === "NORMAL") {
          data = {
            ...data,
            bp:
              state.form.bp && state.form.bp.systolic && state.form.bp.diastolic
                ? {
                    systolic: Number(state.form.bp.systolic),
                    diastolic: Number(state.form.bp.diastolic),
                    mean: Number(
                      calculateMAP(
                        state.form.bp.systolic,
                        state.form.bp.diastolic
                      )
                    ),
                  }
                : undefined,
            pulse: state.form.pulse,
            resp: Number(state.form.resp),
            temperature: state.form.tempInCelcius
              ? celciusToFahrenheit(state.form.temperature)
              : state.form.temperature,
            rhythm: Number(state.form.rhythm) || 0,
            rhythm_detail: state.form.rhythm_detail,
            ventilator_spo2: state.form.ventilator_spo2,
          };
        }
      } else {
        data = baseData;
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
          if (state.form.rounds_type === "NORMAL") {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
            );
          } else {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${res.data.external_id}/update`
            );
          }
        } else {
          Notification.Success({
            msg: "Consultation Updates details created successfully",
          });
          if (state.form.rounds_type === "NORMAL") {
            if (data.clone_last) {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${res.data.external_id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
              );
            }
          } else {
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

  const handleAutoComplete = (name: string, value: any) => {
    const form = { ...state.form };
    if (name.includes(".")) {
      const splitName = name.split(".");
      splitName.reduce((prev, curr, index) => {
        if (index === splitName.length - 1) {
          prev[curr] = value;
        } else {
          prev[curr] = prev[curr] || {};
        }
        return prev[curr];
      }, form);
    } else {
      form[name] = value;
    }
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, key: string) => {
    const form = { ...state.form };
    form[key] = date;
    dispatch({ type: "set_form", form });
  };

  const handleCheckboxFieldChange = (e: any) => {
    const form = { ...state.form };
    const { checked, name } = e.target;
    form[name] = checked;
    dispatch({ type: "set_form", form });
  };

  const generateOptions = (start: any, end: any, step: any, decimals: any) => {
    const len = Math.floor((end - start) / step) + 1;
    return Array(len)
      .fill(0)
      .map((_, idx) => (start + idx * step).toFixed(decimals).toString());
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

  const getStatus = (
    min: any,
    minText: string,
    max: any,
    maxText: string,
    name: any
  ) => {
    if (state.form[name]) {
      const val = Number(state.form[name]);
      if (val >= min && val <= max) {
        return (
          <p className="text-xs" style={{ color: "#059669" }}>
            Normal
          </p>
        );
      } else if (val < min) {
        return (
          <p className="text-xs" style={{ color: "#DC2626" }}>
            {minText}
          </p>
        );
      } else {
        return (
          <p className="text-xs" style={{ color: "#DC2626" }}>
            {maxText}
          </p>
        );
      }
    }
  };

  const getExpectedReviewTime = () => {
    const nextReviewTime = Number(
      state.form.review_interval || prevReviewInterval
    );
    if (nextReviewTime > 0)
      return `Review before ${formatDate(
        moment().add(nextReviewTime, "minutes").toDate()
      )}`;
    return "No Reviews Planned!";
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
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
      <div className="mt-4">
        <div className="bg-white rounded shadow">
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <DateTimeFiled
                    label="Measured At"
                    margin="dense"
                    value={state.form.taken_at}
                    fullWidth
                    disableFuture={true}
                    showTodayButton={true}
                    onChange={(date) => handleDateChange(date, "taken_at")}
                    errors={state.errors.taken_at}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <InputLabel id="rounds_type">Round Type</InputLabel>
                  <SelectField
                    className=""
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
                <div className="w-full md:w-1/3">
                  <InputLabel id="category-label" required>
                    Category
                  </InputLabel>
                  <SelectField
                    name="patient_category"
                    variant="standard"
                    margin="dense"
                    value={state.form.patient_category}
                    options={PATIENT_CATEGORIES}
                    onChange={handleChange}
                    errors={state.errors.patient_category}
                  />
                </div>
              </div>
              {!id && hasPreviousLog && (
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
                  <div className="md:grid gap-4 grid-cols-1 md:grid-cols-2 my-4">
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

                    <div className="flex-1">
                      <InputLabel id="review_interval-label">
                        Review After{" "}
                      </InputLabel>
                      <SelectField
                        name="review_interval"
                        variant="standard"
                        value={state.form.review_interval || prevReviewInterval}
                        options={[
                          { id: -1, text: "select" },
                          ...REVIEW_AT_CHOICES,
                        ]}
                        onChange={handleChange}
                        errors={state.errors.review_interval}
                        className="mt-1"
                      />
                      <div className="text-gray-500 text-sm">
                        {getExpectedReviewTime()}
                      </div>
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

                      <div className="md:grid gap-x-4 grid-cols-1 md:grid-cols-2 gap-y-2 items-end">
                        <div>
                          <div className="flex flex-row justify-between">
                            <h4>BP</h4>
                            <p className="text-sm font-semibold">{`MAP: ${calculateMAP(
                              state.form.systolic,
                              state.form.diastolic
                            )}`}</p>
                          </div>
                          <div className="md:grid gap-2 grid-cols-1 md:grid-cols-2">
                            <div>
                              <InputLabel className="flex flex-row justify-between">
                                Systolic
                                {getStatus(100, "Low", 140, "High", "systolic")}
                              </InputLabel>
                              <AutoCompleteAsyncField
                                name="systolic"
                                multiple={false}
                                variant="standard"
                                value={state.form.bp?.systolic}
                                options={generateOptions(0, 250, 1, 0)}
                                onChange={(e: any, value: any) =>
                                  handleAutoComplete("bp.systolic", value)
                                }
                                placeholder="Enter value"
                                noOptionsText={"Invalid value"}
                                renderOption={(option: any) => (
                                  <div>{option} </div>
                                )}
                                freeSolo={false}
                                getOptionSelected={(option: any, value: any) =>
                                  option == value
                                }
                                getOptionLabel={(option: any) =>
                                  option.toString()
                                }
                                className="-mt-3"
                              />
                            </div>
                            <div>
                              <InputLabel className="flex flex-row justify-between">
                                Diastolic{" "}
                                {getStatus(50, "Low", 90, "High", "diastolic")}
                              </InputLabel>
                              <AutoCompleteAsyncField
                                name="diastolic"
                                multiple={false}
                                variant="standard"
                                value={state.form.bp?.diastolic}
                                options={generateOptions(30, 180, 1, 0)}
                                onChange={(e: any, value: any) =>
                                  handleAutoComplete("bp.diastolic", value)
                                }
                                placeholder="Enter value"
                                noOptionsText={"Invalid value"}
                                renderOption={(option: any) => (
                                  <div>{option}</div>
                                )}
                                freeSolo={false}
                                getOptionSelected={(option: any, value: any) =>
                                  option == value
                                }
                                getOptionLabel={(option: any) =>
                                  option.toString()
                                }
                                className="-mt-3"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <InputLabel className="flex flex-row justify-between">
                            {"Pulse (bpm)"}
                            {getStatus(
                              40,
                              "Bradycardia",
                              100,
                              "Tachycardia",
                              "pulse"
                            )}
                          </InputLabel>
                          <AutoCompleteAsyncField
                            name="pulse"
                            multiple={false}
                            variant="standard"
                            value={state.form.pulse}
                            options={generateOptions(0, 200, 1, 0)}
                            onChange={(e: any, value: any) =>
                              handleAutoComplete("pulse", value)
                            }
                            placeholder="Enter value"
                            noOptionsText={"Invalid value"}
                            renderOption={(option: any) => <div>{option}</div>}
                            freeSolo={false}
                            getOptionSelected={(option: any, value: any) =>
                              option == value
                            }
                            getOptionLabel={(option: any) => option.toString()}
                            className="-mt-3"
                          />
                        </div>
                        <div>
                          <InputLabel className="flex flex-row justify-between">
                            Temperature{" "}
                            {state.form.tempInCelcius
                              ? getStatus(
                                  36.4,
                                  "Low",
                                  37.5,
                                  "High",
                                  "temperature"
                                )
                              : getStatus(
                                  97.6,
                                  "Low",
                                  99.6,
                                  "High",
                                  "temperature"
                                )}
                          </InputLabel>
                          <div className="flex flex-row">
                            <div className="grow mr-2">
                              <AutoCompleteAsyncField
                                name="temperature"
                                multiple={false}
                                variant="standard"
                                value={state.form.temperature}
                                options={
                                  state.form.tempInCelcius
                                    ? generateOptions(35, 41, 0.1, 1)
                                    : generateOptions(95, 106, 0.1, 1)
                                }
                                onChange={(e: any, value: any) =>
                                  handleAutoComplete("temperature", value)
                                }
                                placeholder="Enter value"
                                noOptionsText={"Invalid value"}
                                renderOption={(option: any) => (
                                  <div>{option}</div>
                                )}
                                freeSolo={false}
                                getOptionSelected={(option: any, value: any) =>
                                  option == value
                                }
                                getOptionLabel={(option: any) =>
                                  option.toString()
                                }
                                className="-mt-3"
                              />
                            </div>
                            <div
                              className="flex items-center ml-1 border border-gray-400 rounded px-4 h-10 cursor-pointer hover:bg-gray-200 max-w-min-content"
                              onClick={toggleTemperature}
                            >
                              <span className="text-blue-700">
                                {" "}
                                {state.form.tempInCelcius ? "C" : "F"}{" "}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <InputLabel className="flex flex-row justify-between">
                            {"Respiratory Rate (bpm) *"}
                            {getStatus(12, "Low", 16, "High", "resp")}
                          </InputLabel>
                          <AutoCompleteAsyncField
                            name="resp"
                            multiple={false}
                            variant="standard"
                            value={state.form.resp}
                            options={generateOptions(10, 50, 1, 0)}
                            onChange={(e: any, value: any) =>
                              handleAutoComplete("resp", value)
                            }
                            placeholder="Enter value"
                            noOptionsText={"Invalid value"}
                            renderOption={(option: any) => <div>{option}</div>}
                            freeSolo={false}
                            getOptionSelected={(option: any, value: any) =>
                              option == value
                            }
                            getOptionLabel={(option: any) => option.toString()}
                            className="-mt-3"
                            errors={state.errors.resp}
                          />
                        </div>
                        <div>
                          <InputLabel className="flex flex-row justify-between">
                            {"SPO2 (%)"}
                            {getStatus(
                              90,
                              "Low",
                              100,
                              "High",
                              "ventilator_spo2"
                            )}
                          </InputLabel>
                          <AutoCompleteAsyncField
                            name="ventilator_spo2"
                            multiple={false}
                            variant="standard"
                            value={state.form.ventilator_spo2}
                            options={generateOptions(0, 100, 1, 0)}
                            onChange={(e: any, value: any) =>
                              handleAutoComplete("ventilator_spo2", value)
                            }
                            placeholder="Enter value"
                            noOptionsText={"Invalid value"}
                            renderOption={(option: any) => <div>{option}</div>}
                            freeSolo={false}
                            getOptionSelected={(option: any, value: any) =>
                              option == value
                            }
                            getOptionLabel={(option: any) => option.toString()}
                            className="-mt-3"
                          />
                        </div>
                        <div className="">
                          <InputLabel className="flex flex-row justify-between">
                            Rhythm
                          </InputLabel>
                          <SelectField
                            name="rhythm"
                            variant="standard"
                            value={state.form.rhythm}
                            options={RHYTHM_CHOICES}
                            onChange={handleChange}
                            errors={state.errors.rhythm}
                            className="mb-8"
                          />
                        </div>
                        <div className="md:col-span-2 mt-2">
                          <InputLabel>Rhythm Description</InputLabel>
                          <MultilineInputField
                            rows={5}
                            name="rhythm_detail"
                            variant="outlined"
                            margin="dense"
                            type="text"
                            InputLabelProps={{
                              shrink: !!state.form.rhythm_detail,
                            }}
                            value={state.form.rhythm_detail}
                            onChange={handleChange}
                            errors={state.errors.rhythm_detail}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col md:flex-row gap-2 justify-between">
                <Link
                  className="btn btn-default bg-white mt-2"
                  href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
                >
                  Back
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary ml-auto text-base w-full md:w-auto"
                  onClick={(e) => handleSubmit(e)}
                >
                  <i className="fa-regular fa-circle-check mr-2"></i>{" "}
                  {buttonText}
                </button>
              </div>
            </CardContent>
          </form>
        </div>
      </div>
    </div>
  );
};
