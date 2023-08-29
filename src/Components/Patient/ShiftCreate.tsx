import * as Notification from "../../Utils/Notifications.js";

import {
  BREATHLESSNESS_LEVEL,
  FACILITY_TYPES,
  PATIENT_CATEGORIES,
  SHIFTING_VEHICLE_CHOICES,
} from "../../Common/constants";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { createShift, getPatient } from "../../Redux/actions";
import { lazy, useEffect, useReducer, useState } from "react";

import { FacilitySelect } from "../Common/FacilitySelect";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { FieldLabel } from "../Form/FormFields/FormField";
import PatientCategorySelect from "./PatientCategorySelect";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { phonePreg } from "../../Common/validation";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Page from "../Common/components/Page.js";
import Card from "../../CAREUI/display/Card.js";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField.js";
import { SelectFormField } from "../Form/FormFields/SelectFormField.js";

const Loading = lazy(() => import("../Common/Loading"));

interface patientShiftProps {
  facilityId: number;
  patientId: number;
}

export const ShiftCreate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { facilityId, patientId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientCategory, setPatientCategory] = useState<any>();
  const { t } = useTranslation();
  const { wartime_shifting } = useConfig();

  const initForm: any = {
    shifting_approving_facility: null,
    assigned_facility: null,
    emergency: "false",
    is_up_shift: "true",
    reason: "",
    vehicle_preference: "",
    comments: "",
    refering_facility_contact_name: "",
    refering_facility_contact_number: "+91",
    assigned_facility_type: null,
    preferred_vehicle_choice: null,
    breathlessness_level: null,
    patient_category: "",
    ambulance_driver_name: "",
    ambulance_phone_number: undefined,
    ambulance_number: "",
  };

  let requiredFields: any = {
    refering_facility_contact_name: {
      errorText: "Name of contact of the current facility",
    },
    refering_facility_contact_number: {
      errorText: "Phone number of contact of the current facility",
      invalidText: "Please enter valid phone number",
    },
    reason: {
      errorText: "Reason for shifting in mandatory",
      invalidText: "Please enter reason for shifting",
    },
  };

  if (wartime_shifting) {
    requiredFields = {
      ...requiredFields,
      shifting_approving_facility: {
        errorText: "Name of the referring facility",
      },
      assigned_facility_type: {
        errorText: "Please Select Facility Type",
      },
      preferred_vehicle_choice: {
        errorText: "Please Preferred Vehicle Type",
      },
      breathlessness_level: {
        errorText: "Severity of Breathlessness is required",
      },
    };
  }

  const initError = Object.assign(
    {},
    ...Object.keys(initForm).map((k) => ({ [k]: "" }))
  );

  const initialState = {
    form: { ...initForm },
    errors: { ...initError },
  };

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          const patient_category =
            res.data.last_consultation?.last_daily_round?.patient_category ??
            res.data.last_consultation?.category;
          setPatientCategory(
            PATIENT_CATEGORIES.find((c) => c.text === patient_category)?.id
          );
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

  const shiftFormReducer = (state = initialState, action: any) => {
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

  const [state, dispatch] = useReducer(shiftFormReducer, initialState);

  const validateForm = () => {
    const errors = { ...initError };

    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      switch (field) {
        case "refering_facility_contact_number": {
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          } else if (
            !parsePhoneNumberFromString(state.form[field])?.isPossible() ||
            !phonePreg(
              String(parsePhoneNumberFromString(state.form[field])?.number)
            )
          ) {
            errors[field] = requiredFields[field].invalidText;
            isInvalidForm = true;
          }
          return;
        }
        default: {
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          }
        }
      }
    });

    dispatch({ type: "set_error", errors });
    return !isInvalidForm;
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [event.name]: event.value },
    });
  };

  const handleSubmit = async () => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const data = {
        status: wartime_shifting ? "PENDING" : "APPROVED",
        origin_facility: props.facilityId,
        shifting_approving_facility: (
          state.form.shifting_approving_facility || {}
        ).id,
        assigned_facility:
          state.form?.assigned_facility?.id != -1
            ? state.form?.assigned_facility?.id
            : null,
        assigned_facility_external:
          state.form?.assigned_facility?.id === -1
            ? state.form?.assigned_facility?.name
            : null,
        patient: props.patientId,
        emergency: state.form.emergency === "true",
        is_up_shift: state.form.is_up_shift === "true",
        reason: state.form.reason,
        vehicle_preference: state.form.vehicle_preference,
        comments: state.form.comments,
        assigned_facility_type: state.form.assigned_facility_type,
        preferred_vehicle_choice: state.form.preferred_vehicle_choice,
        refering_facility_contact_name:
          state.form.refering_facility_contact_name,
        refering_facility_contact_number: parsePhoneNumberFromString(
          state.form.refering_facility_contact_number
        )?.format("E.164"),
        breathlessness_level: state.form.breathlessness_level,
        patient_category: patientCategory,
        ambulance_driver_name: state.form.ambulance_driver_name,
        ambulance_phone_number: parsePhoneNumberFromString(
          state.form.ambulance_phone_number
        )?.format("E.164"),
        ambulance_number: state.form.ambulance_number,
      };

      const res = await dispatchAction(createShift(data));
      setIsLoading(false);

      if (res && res.data && (res.status == 201 || res.status == 200)) {
        await dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Shift request created successfully",
        });

        navigate(`/shifting/${res.data.id}`);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const field = (name: string) => ({
    name,
    value: state.form[name],
    onChange: handleFormFieldChange,
    error: state.errors[name],
  });

  return (
    <Page
      title={"Create Shift Request"}
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <Card className="mx-auto mt-4 flex w-full max-w-3xl flex-col px-8 py-5 md:px-16 md:py-11">
        <TextFormField
          {...field("refering_facility_contact_name")}
          label="Name of Contact person at the current facility"
          required
        />

        <PhoneNumberFormField
          {...field("refering_facility_contact_number")}
          label="Contact person phone number"
          required
          types={["mobile", "landline"]}
        />

        {wartime_shifting && (
          <div>
            <FieldLabel required>
              Name of shifting approving facility
            </FieldLabel>
            <FacilitySelect
              multiple={false}
              facilityType={1300}
              name="shifting_approving_facility"
              selected={state.form.shifting_approving_facility}
              setSelected={(value) =>
                handleFormFieldChange({
                  name: "shifting_approving_facility",
                  value,
                })
              }
              errors={state.errors.shifting_approving_facility}
            />
          </div>
        )}

        <div>
          <FieldLabel>{t("what_facility_assign_the_patient_to")}</FieldLabel>
          <FacilitySelect
            multiple={false}
            name="assigned_facility"
            selected={state.form.assigned_facility}
            setSelected={(value) =>
              handleFormFieldChange({ name: "assigned_facility", value })
            }
            freeText={true}
            errors={state.errors.assigned_facility}
          />
        </div>

        <CheckBoxFormField
          className="mt-6"
          {...field("emergency")}
          label="This is an emergency"
        />

        <CheckBoxFormField
          {...field("is_up_shift")}
          label="This is an upshift"
        />

        <PatientCategorySelect
          required={true}
          {...field("patient_category")}
          value={patientCategory}
          onChange={(e) => setPatientCategory(e.value)}
          label="Patient Category"
        />

        {wartime_shifting && (
          <>
            <SelectFormField
              {...field("preferred_vehicle_choice")}
              required
              label="Preferred Vehicle"
              options={SHIFTING_VEHICLE_CHOICES}
              optionLabel={(option) => option.text}
              optionValue={(option) => option.text}
            />
            <SelectFormField
              {...field("assigned_facility_type")}
              required
              label="Preferred Facility Type"
              options={FACILITY_TYPES}
              optionLabel={(option) => option.text}
              optionValue={(option) => option.text}
            />
            <SelectFormField
              {...field("breathlessness_level")}
              required
              label="Severity of Breathlessness"
              options={BREATHLESSNESS_LEVEL}
              optionLabel={(option) => option}
              optionValue={(option) => option}
            />
          </>
        )}

        <TextAreaFormField
          {...field("reason")}
          label="Reason for shift"
          required
          rows={5}
          placeholder="Type your reason here"
        />

        <TextFormField
          {...field("ambulance_driver_name")}
          label="Name of ambulance driver"
        />

        <PhoneNumberFormField
          {...field("ambulance_phone_number")}
          label="Ambulance Phone Number"
          types={["mobile", "landline"]}
        />

        <TextFormField {...field("ambulance_number")} label="Ambulance No." />
        <TextAreaFormField
          {...field("comments")}
          label="Any other comments"
          placeholder="Type any extra comments here"
        />

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit onClick={handleSubmit} />
        </div>
      </Card>
    </Page>
  );
};
