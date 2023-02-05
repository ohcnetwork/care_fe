import { Card, CardContent } from "@material-ui/core";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import { useReducer, useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { SAMPLE_TYPE_CHOICES, ICMR_CATEGORY } from "../../Common/constants";
import {
  createSampleTest,
  getAllFacilities,
  getPatient,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  CheckboxField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { SampleTestModel, FacilityNameModel } from "./models";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { goBack } from "../../Utils/utils";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const icmrCategories = [...ICMR_CATEGORY];
const sampleTestTypes = [...SAMPLE_TYPE_CHOICES];

const initForm: SampleTestModel = {
  isFastTrack: false,
  fast_track: "",
  icmr_label: "",
  atypical_presentation: "",
  diagnosis: "",
  diff_diagnosis: "",
  doctor_name: "",
  testing_facility: "",
  etiology_identified: "",
  has_ari: false,
  has_sari: false,
  is_atypical_presentation: false,
  is_unusual_course: false,
  sample_type: "0",
  icmr_category: "Cat 0",
  sample_type_other: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const sampleTestFormReducer = (state = initialState, action: any) => {
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

export const SampleTest = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId } = props;
  const [state, dispatch] = useReducer(sampleTestFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [facilityNames, setFacilityNames] = useState<Array<FacilityNameModel>>(
    []
  );
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const headerText = "Request Sample";
  const buttonText = "Confirm your request to send sample for testing";

  const fetchFacilityNames = useCallback(
    async (status: statusType) => {
      const coronaLabType = 950;
      const labType = 9;
      setIsLoading(true);
      const LabList = await dispatchAction(
        getAllFacilities({ facility_type: labType })
      );

      const CoronaLabList = await dispatchAction(
        getAllFacilities({ facility_type: coronaLabType })
      );

      if (
        !status.aborted &&
        LabList.data.results &&
        CoronaLabList.data.results
      ) {
        setFacilityNames([
          ...LabList.data.results,
          ...CoronaLabList.data.results,
        ]);
        dispatch({
          type: "set_form",
          form: {
            ...state.form,
            testing_facility: LabList.data.results[0]?.id,
          },
        });
      }
      setIsLoading(false);
    },
    [dispatchAction]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchFacilityNames(status);
    },
    [dispatch, fetchFacilityNames]
  );

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "fast_track":
          if (state.form.isFastTrack && !state.form[field]) {
            errors[field] = "Please provide reasons for fast-track testing";
            invalidForm = true;
          }
          break;
        case "icmr_label":
          if (!state.form[field]) {
            errors[field] = "Please specify the label";
            invalidForm = true;
          }
          break;
        case "sample_type_other":
          if (state.form.sample_type === "9" && !state.form[field]) {
            errors[field] = "Please provide details of the sample type";
            invalidForm = true;
          }
          break;
        case "atypical_presentation":
          if (state.form.is_atypical_presentation && !state.form[field]) {
            errors[field] = "Please provide details of atypical presentation";
            invalidForm = true;
          }
          break;
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
      const data: SampleTestModel = {
        date_of_sample: new Date().toISOString(),
        fast_track: state.form.isFastTrack ? state.form.fast_track : undefined,
        icmr_label: state.form.icmr_label ? state.form.icmr_label : undefined,
        facility: facilityId,
        patient: patientId,
        has_ari: state.form.has_ari,
        has_sari: state.form.has_sari,
        is_unusual_course: state.form.is_unusual_course,
        is_atypical_presentation: state.form.is_atypical_presentation,
        atypical_presentation: state.form.is_atypical_presentation
          ? state.form.atypical_presentation
          : undefined,
        diagnosis: state.form.diagnosis ? state.form.diagnosis : undefined,
        diff_diagnosis: state.form.diff_diagnosis
          ? state.form.diff_diagnosis
          : undefined,
        testing_facility: state.form.testing_facility,
        doctor_name: state.form.doctor_name
          ? state.form.doctor_name
          : undefined,
        etiology_identified: state.form.etiology_identified
          ? state.form.etiology_identified
          : undefined,
        sample_type: state.form.sample_type,
        icmr_category: state.form.icmr_category,
        sample_type_other:
          state.form.sample_type === "9"
            ? state.form.sample_type_other
            : undefined,
      };
      const res = await dispatchAction(createSampleTest(data, { patientId }));
      setIsLoading(false);
      if (res && res.data) {
        dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Sample test created successfully",
        });
        navigate(`/facility/${facilityId}/patient/${patientId}`);
      }
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleTextAreaChange = (e: any) => {
    const form = { ...state.form };
    form[e.name] = e.value;
    dispatch({ type: "set_form", form });
  };

  const handleCheckboxFieldChange = (e: any) => {
    const form = { ...state.form };
    const { checked, name } = e.target;
    form[name] = checked;
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e)}>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Sample Test Type*</FieldLabel>
                    <SelectField
                      name="sample_type"
                      variant="outlined"
                      margin="dense"
                      optionArray={false}
                      value={state.form.sample_type}
                      options={sampleTestTypes}
                      onChange={handleChange}
                      errors={state.errors.sample_type}
                    />
                  </div>
                  {state.form.sample_type === "OTHER TYPE" && (
                    <div>
                      <TextAreaFormField
                        label="Sample Test Type Details"
                        required
                        rows={4}
                        name="sample_type_other"
                        value={state.form.sample_type_other}
                        onChange={handleTextAreaChange}
                        error={state.errors.sample_type_other}
                      />
                    </div>
                  )}
                </div>
                <div className="row-span-3 space-y-4">
                  <div>
                    <FieldLabel>ICMR Category (for COVID Test)</FieldLabel>
                    <SelectField
                      name="icmr_category"
                      variant="outlined"
                      margin="dense"
                      optionArray={true}
                      value={state.form.icmr_category}
                      options={icmrCategories}
                      onChange={handleChange}
                      errors={state.errors.icmr_category}
                    />
                  </div>
                  <Container>
                    <FieldLabel>
                      Reference below to know more about ICMR Categories
                    </FieldLabel>
                    <Typography>
                      <li>
                        Cat 0 - Repeat Sample of Positive Case / Follow Up case
                      </li>
                      <li>
                        Cat 1 - Symptomatic International Traveller in last 14
                        days
                      </li>
                      <li>Cat 2 - Symptomatic contact of lab confirmed Case</li>
                      <li>Cat 3 - Symptomatic Healthcare Worker</li>
                      <li>
                        Cat 4 - Hospitalized SARI (Severe Acute Respiratory
                        illness Patient)
                      </li>
                      <li>
                        Cat 5a - Asymptomatic Direct and High Risk contact of
                        confirmed case - family Member
                      </li>
                      <li>
                        Cat 5b - Asymptomatic Healthcare worker in contact with
                        confirmed case without adequate protection
                      </li>
                    </Typography>
                  </Container>
                </div>
                <div className="space-y-4">
                  <div>
                    <FieldLabel required>Label</FieldLabel>
                    <TextInputField
                      name="icmr_label"
                      variant="outlined"
                      margin="dense"
                      value={state.form.icmr_label}
                      onChange={handleChange}
                      errors={state.errors.icmr_label}
                    />
                  </div>
                  <div className="mt-4 w-full">
                    <FieldLabel>Testing Facility Name</FieldLabel>
                    <SelectField
                      name="testing_facility"
                      variant="outlined"
                      margin="dense"
                      value={state.form.testing_facility || ""}
                      options={facilityNames.map((e) => {
                        return { id: e.id, name: e.name };
                      })}
                      optionValue="name"
                      optionKey="id"
                      onChange={handleChange}
                      errors={state.errors.testing_facility}
                    />
                  </div>
                  <div className="flex items-center">
                    <CheckboxField
                      checked={state.form.isFastTrack}
                      onChange={handleCheckboxFieldChange}
                      name="isFastTrack"
                      label="Is fast-track testing required?"
                    />
                  </div>
                  {state.form.isFastTrack && (
                    <div>
                      <FieldLabel required>
                        Provide reasons for fast-track testing
                      </FieldLabel>
                      <TextAreaFormField
                        rows={4}
                        name="fast_track"
                        value={state.form.fast_track}
                        onChange={handleTextAreaChange}
                        error={state.errors.fast_track}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <FieldLabel>Doctor's Name</FieldLabel>
                  <TextInputField
                    name="doctor_name"
                    variant="outlined"
                    margin="dense"
                    value={state.form.doctor_name}
                    onChange={handleChange}
                    errors={state.errors.doctor_name}
                  />
                </div>
                <div className="flex items-center">
                  <CheckboxField
                    checked={state.form.is_atypical_presentation}
                    onChange={handleCheckboxFieldChange}
                    name="is_atypical_presentation"
                    label="Is atypical presentation?"
                  />
                </div>
                {state.form.is_atypical_presentation && (
                  <div>
                    <TextAreaFormField
                      required
                      label="Atypical presentation details"
                      rows={4}
                      name="atypical_presentation"
                      value={state.form.atypical_presentation}
                      onChange={handleTextAreaChange}
                      error={state.errors.atypical_presentation}
                    />
                  </div>
                )}
                <div>
                  <TextAreaFormField
                    label="Diagnosis"
                    rows={4}
                    name="diagnosis"
                    value={state.form.diagnosis}
                    onChange={handleTextAreaChange}
                    error={state.errors.diagnosis}
                  />
                </div>
                <div>
                  <TextAreaFormField
                    label="Etiology identified"
                    rows={4}
                    name="etiology_identified"
                    value={state.form.etiology_identified}
                    onChange={handleTextAreaChange}
                    error={state.errors.etiology_identified}
                  />
                </div>
                <div>
                  <TextAreaFormField
                    label="Differential diagnosis"
                    rows={4}
                    name="diff_diagnosis"
                    value={state.form.diff_diagnosis}
                    onChange={handleTextAreaChange}
                    error={state.errors.diff_diagnosis}
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="flex items-center">
                  <CheckboxField
                    checked={state.form.has_sari}
                    onChange={handleCheckboxFieldChange}
                    name="has_sari"
                    label="SARI - Severe Acute Respiratory illness ?"
                  />
                </div>
                <div className="flex items-center">
                  <CheckboxField
                    checked={state.form.has_ari}
                    onChange={handleCheckboxFieldChange}
                    name="has_ari"
                    label="ARI - Acute Respiratory illness ?"
                  />
                </div>
                <div className="flex items-center">
                  <CheckboxField
                    checked={state.form.is_unusual_course}
                    onChange={handleCheckboxFieldChange}
                    name="is_unusual_course"
                    label="Is unusual course?"
                  />
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={handleSubmit} label={buttonText} />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
