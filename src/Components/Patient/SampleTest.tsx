import { navigate } from "raviger";

import { useReducer, useState, useEffect, lazy } from "react";
import { useDispatch } from "react-redux";
import { SAMPLE_TYPE_CHOICES, ICMR_CATEGORY } from "../../Common/constants";
import { createSampleTest, getPatient } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SampleTestModel } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import Page from "../Common/components/Page";
import { FacilitySelect } from "../Common/FacilitySelect";
const Loading = lazy(() => import("../Common/Loading"));

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

export const SampleTest = ({ facilityId, patientId }: any) => {
  const { goBack } = useAppHistory();
  const dispatchAction: any = useDispatch();
  const [state, dispatch] = useReducer(sampleTestFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const headerText = "Request Sample";
  const buttonText = "Confirm your request to send sample for testing";

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
        testing_facility: state.form.testing_facility?.id,
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

  const handleFormFieldChange = (e: FieldChangeEvent<unknown>) => {
    dispatch({ type: "set_form", form: { ...state.form, [e.name]: e.value } });
  };

  const field = (name: string, label: string) => ({
    name,
    label,
    value: state.form[name],
    onChange: handleFormFieldChange,
    error: state.errors[name],
  });

  if (isLoading) {
    return <Loading />;
  }
  return (
    <Page
      title={headerText}
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-5xl rounded bg-white px-8 py-5 md:px-16 md:py-11"
      >
        <SelectFormField
          {...field("sample_type", "Sample Test Type")}
          required
          options={SAMPLE_TYPE_CHOICES}
          optionLabel={(option) => option.text}
          optionValue={(option) => option.id}
        />

        {state.form.sample_type === "OTHER TYPE" && (
          <TextAreaFormField
            {...field("sample_type_other", "Sample Test Type Details")}
            required
          />
        )}

        <SelectFormField
          {...field("icmr_category", "ICMR Category (for COVID Test)")}
          options={ICMR_CATEGORY}
          optionLabel={(option) => option}
          optionValue={(option) => option}
        />
        <div className="mb-6 flex flex-col gap-1">
          <p className="font-medium">
            Refer below to know more about ICMR Categories
          </p>
          <span>
            <li>Cat 0 - Repeat Sample of Positive Case / Follow Up case</li>
            <li>Cat 1 - Symptomatic International Traveller in last 14 days</li>
            <li>Cat 2 - Symptomatic contact of lab confirmed Case</li>
            <li>Cat 3 - Symptomatic Healthcare Worker</li>
            <li>
              Cat 4 - Hospitalized SARI (Severe Acute Respiratory illness
              Patient)
            </li>
            <li>
              Cat 5a - Asymptomatic Direct and High Risk contact of confirmed
              case - family Member
            </li>
            <li>
              Cat 5b - Asymptomatic Healthcare worker in contact with confirmed
              case without adequate protection
            </li>
          </span>
        </div>

        <TextFormField {...field("icmr_label", "ICMR Label")} required />
        <div className="mb-6 w-full flex-none">
          <FieldLabel>Testing Facility</FieldLabel>
          <FacilitySelect
            name="testing_facility"
            setSelected={(selected) =>
              dispatch({
                type: "set_form",
                form: { ...state.form, testing_facility: selected },
              })
            }
            facilityType={950}
            selected={state.form.testing_facility}
            errors={state.errors.testing_facility}
            showAll
            multiple={false}
          />
        </div>
        <CheckBoxFormField
          {...field("isFastTrack", "Is fast-track testing required?")}
        />
        {state.form.isFastTrack && (
          <TextAreaFormField
            {...field("fast_track", "Reasons for fast-track testing")}
            required
          />
        )}

        <TextFormField {...field("doctor_name", "Doctor's Name")} />
        <CheckBoxFormField
          {...field("is_atypical_presentation", "Is atypical presentation?")}
        />
        {state.form.is_atypical_presentation && (
          <div>
            <TextAreaFormField
              {...field(
                "atypical_presentation",
                "Atypical presentation details"
              )}
              required
            />
          </div>
        )}
        <TextAreaFormField {...field("diagnosis", "Diagnosis")} />
        <TextAreaFormField
          {...field("etiology_identified", "Etiology identified")}
        />
        <TextAreaFormField
          {...field("diff_diagnosis", "Differential diagnosis")}
        />

        <CheckBoxFormField
          {...field("has_sari", "Has SARI (Severe Acute Respiratory illness)?")}
        />
        <CheckBoxFormField
          {...field("has_ari", "Has ARI (Acute Respiratory illness)?")}
        />
        <CheckBoxFormField
          {...field("is_unusual_course", "Is unusual course?")}
        />
        <div className="mt-4 flex flex-col justify-end gap-2 lg:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit onClick={handleSubmit} label={buttonText} />
        </div>
      </form>
    </Page>
  );
};
