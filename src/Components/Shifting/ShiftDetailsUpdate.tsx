import * as Notification from "../../Utils/Notifications.js";

import {
  BREATHLESSNESS_LEVEL,
  FACILITY_TYPES,
  PATIENT_CATEGORIES,
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
  SHIFTING_VEHICLE_CHOICES,
} from "../../Common/constants";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { getShiftDetails, getUserList, updateShift } from "../../Redux/actions";
import { navigate, useQueryParams } from "raviger";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { lazy, useCallback, useEffect, useReducer, useState } from "react";
import { ConsultationModel } from "../Facility/models.js";
import DischargeModal from "../Facility/DischargeModal.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FieldChangeEvent } from "../Form/FormFields/Utils.js";
import { FieldLabel } from "../Form/FormFields/FormField";
import PatientCategorySelect from "../Patient/PatientCategorySelect";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField.js";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import CircularProgress from "../Common/components/CircularProgress.js";
import Card from "../../CAREUI/display/Card";
import RadioFormField from "../Form/FormFields/RadioFormField.js";
import Page from "../Common/components/Page.js";
import UserAutocompleteFormField from "../Common/UserAutocompleteFormField.js";
import { UserModel } from "../Users/models.js";

const Loading = lazy(() => import("../Common/Loading"));

interface patientShiftProps {
  id: string;
}

export const ShiftDetailsUpdate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { kasp_full_string, kasp_enabled, wartime_shifting } = useConfig();
  const dispatchAction: any = useDispatch();
  const [qParams, _] = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);
  const [assignedUser, SetAssignedUser] = useState<UserModel>();
  const [assignedUserLoading, setAssignedUserLoading] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {} as ConsultationModel
  );
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const { t } = useTranslation();

  const initForm: any = {
    shifting_approving_facility_object: null,
    assigned_facility_object: null,
    emergency: "false",
    is_kasp: "false",
    is_up_shift: "true",
    reason: "",
    vehicle_preference: "",
    comments: "",
    assigned_facility_type: null,
    preferred_vehicle_choice: null,
    assigned_to: "",
    initial_status: "",
    patient_category: "",
    ambulance_driver_name: "",
    ambulance_phone_number: "",
    ambulance_number: "",
  };

  const initError = Object.assign(
    {},
    ...Object.keys(initForm).map((k) => ({ [k]: "" }))
  );

  const initialState = {
    form: { ...initForm },
    errors: { ...initError },
  };

  let requiredFields: any = {
    reason: {
      errorText: t("please_enter_a_reason_for_the_shift"),
    },
  };

  if (wartime_shifting) {
    requiredFields = {
      ...requiredFields,
      shifting_approving_facility_object: {
        errorText: t("shifting_approving_facility_can_not_be_empty"),
      },
      assigned_facility_type: {
        errorText: t("please_select_facility_type"),
      },
      preferred_vehicle_choice: {
        errorText: t("please_select_preferred_vehicle_type"),
      },
    };
  }

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

  useEffect(() => {
    async function fetchData() {
      if (state.form.assigned_to) {
        setAssignedUserLoading(true);

        const res = await dispatchAction(
          getUserList({ id: state.form.assigned_to })
        );

        if (res && res.data && res.data.count)
          SetAssignedUser(res.data.results[0]);

        setAssignedUserLoading(false);
      }
    }
    fetchData();
  }, [dispatchAction, state.form.assigned_to]);

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      if (!state.form[field] || !/\S+/.test(state.form[field])) {
        errors[field] = requiredFields[field].errorText;
        isInvalidForm = true;
      }
    });

    dispatch({ type: "set_error", errors });
    return !isInvalidForm;
  };

  const handleAssignedUserSelect = (event: FieldChangeEvent<UserModel>) => {
    const user = event.value;
    const form = { ...state.form };
    form["assigned_to"] = user?.id;
    SetAssignedUser(user);
    dispatch({ type: "set_form", form });
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [event.name]: event.value },
    });
  };

  const handleTextFormFieldChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const setFacility = (selected: any, name: string) => {
    const form = { ...state.form };
    form[name] = selected;
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = async (discharged = false) => {
    const validForm = validateForm();

    if (validForm) {
      if (!discharged && state.form.status === "PATIENT EXPIRED") {
        setShowDischargeModal(true);
        return;
      }

      setIsLoading(true);

      const data: any = {
        origin_facility: state.form.origin_facility_object?.id,
        shifting_approving_facility:
          state.form?.shifting_approving_facility_object?.id,
        assigned_facility:
          state.form?.assigned_facility_object?.id != -1
            ? state.form?.assigned_facility_object?.id
            : null,
        assigned_facility_external:
          state.form?.assigned_facility_object?.id === -1
            ? state.form?.assigned_facility_object?.name
            : null,
        patient: state.form.patient_object?.id,
        emergency: [true, "true"].includes(state.form.emergency),
        is_kasp: [true, "true"].includes(state.form.is_kasp),
        is_up_shift: [true, "true"].includes(state.form.is_up_shift),
        reason: state.form.reason,
        vehicle_preference: state.form.vehicle_preference,
        comments: state.form.comments,
        assigned_facility_type: state.form.assigned_facility_type,
        preferred_vehicle_choice: state.form.preferred_vehicle_choice,
        assigned_to: state.form.assigned_to,
        breathlessness_level: state.form.breathlessness_level,
        patient_category: state.form.patient_category,
        ambulance_driver_name: state.form.ambulance_driver_name,
        ambulance_phone_number: parsePhoneNumberFromString(
          state.form.ambulance_phone_number
        )?.format("E.164"),
        ambulance_number: state.form.ambulance_number,
      };

      if (state.form.status !== state.form.initial_status) {
        data["status"] = state.form.status;
      }

      const res = await dispatchAction(updateShift(props.id, data));
      setIsLoading(false);

      if (res && res.status == 200 && res.data) {
        dispatch({ type: "set_form", form: res.data });
        Notification.Success({
          msg: t("shift_request_updated_successfully"),
        });

        navigate(`/shifting/${props.id}`);
      } else {
        setIsLoading(false);
      }
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getShiftDetails({ id: props.id }));
      if (!status.aborted) {
        if (res && res.data) {
          const d = res.data;
          setConsultationData(d.patient.last_consultation);
          if (d.assigned_facility_external)
            d["assigned_facility_object"] = {
              id: -1,
              name: res.data.assigned_facility_external,
            };
          d["initial_status"] = res.data.status;
          d["status"] = qParams.status || res.data.status;
          const patient_category =
            d.patient.last_consultation?.last_daily_round?.patient_category ??
            d.patient.last_consultation?.category;
          d["patient_category"] = PATIENT_CATEGORIES.find(
            (c) => c.text === patient_category
          )?.id;
          dispatch({ type: "set_form", form: d });
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatchAction, qParams.status]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const vehicleOptions = SHIFTING_VEHICLE_CHOICES.map((obj) => obj.text);
  const facilityOptions = FACILITY_TYPES.map((obj) => obj.text);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page title={t("update_shift_request")} backUrl={`/shifting/${props.id}`}>
      <DischargeModal
        show={showDischargeModal}
        onClose={() => setShowDischargeModal(false)}
        consultationData={consultationData}
        discharge_reason="EXP"
        afterSubmit={() => {
          handleSubmit(true);
        }}
      />
      <Card className="mx-auto mt-4 w-full max-w-4xl md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectFormField
            name="status"
            label={t("status")}
            required
            options={
              wartime_shifting
                ? SHIFTING_CHOICES_WARTIME
                : SHIFTING_CHOICES_PEACETIME
            }
            value={state.form.status}
            optionLabel={(option) => option.text}
            optionValue={(option) => option.text}
            optionSelectedLabel={(option) => option.text}
            onChange={handleFormFieldChange}
            className="w-full bg-white md:col-span-1 md:leading-5"
          />

          {wartime_shifting &&
            (assignedUserLoading ? (
              <CircularProgress />
            ) : (
              <UserAutocompleteFormField
                name="assigned_to"
                label={t("assigned_to")}
                value={assignedUser}
                onChange={handleAssignedUserSelect}
                facilityId={state.form?.shifting_approving_facility_object?.id}
                error={state.errors.assigned_to}
              />
            ))}

          {wartime_shifting && (
            <div>
              <FieldLabel>
                {t("name_of_shifting_approving_facility")}
              </FieldLabel>
              <FacilitySelect
                multiple={false}
                name="shifting_approving_facility"
                facilityType={1300}
                selected={state.form.shifting_approving_facility_object}
                setSelected={(obj) =>
                  setFacility(obj, "shifting_approving_facility_object")
                }
                errors={state.errors.shifting_approving_facility_object}
              />
            </div>
          )}

          <div>
            <FieldLabel>{t("what_facility_assign_the_patient_to")}</FieldLabel>
            <FacilitySelect
              multiple={false}
              freeText
              name="assigned_facility"
              selected={state.form.assigned_facility_object}
              setSelected={(obj) =>
                setFacility(obj, "assigned_facility_object")
              }
              errors={state.errors.assigned_facility}
            />
          </div>

          <RadioFormField
            label={t("is_this_an_emergency")}
            name="emergency"
            value={state.form.emergency?.toString()}
            onChange={handleFormFieldChange}
            options={[
              { label: t("yes"), value: "true" },
              { label: t("no"), value: "false" },
            ]}
            optionDisplay={(option) => option.label}
            optionValue={(option) => option.value}
          />

          {kasp_enabled && (
            <RadioFormField
              name="is_kasp"
              value={state.form.is_kasp?.toString()}
              label={t("is") + " " + kasp_full_string + "?"}
              options={[
                { label: t("yes"), value: "true" },
                { label: t("no"), value: "false" },
              ]}
              optionValue={(option) => option.value}
              optionDisplay={(option) => option.label}
              onChange={handleFormFieldChange}
            />
          )}

          <RadioFormField
            label={t("is_this_an_upshift")}
            name="is_up_shift"
            value={state.form.is_up_shift?.toString()}
            options={[
              { label: t("yes"), value: "true" },
              { label: t("no"), value: "false" },
            ]}
            optionValue={(option) => option.value}
            optionDisplay={(option) => option.label}
            onChange={handleFormFieldChange}
          />

          <PatientCategorySelect
            required={true}
            name="patient_category"
            value={state.form.patient_category}
            onChange={handleFormFieldChange}
            label="Patient Category"
            className="md:col-span-2"
          />

          {wartime_shifting && (
            <>
              <SelectFormField
                name="preferred_vehicle_choice"
                label={t("preferred_vehicle")}
                value={state.form.preferred_vehicle_choice}
                options={vehicleOptions}
                optionLabel={(option) => option}
                optionValue={(option) => option}
                onChange={handleFormFieldChange}
                className="mt-2 h-11 w-full bg-white shadow-sm md:leading-5"
                error={state.errors.preferred_vehicle_choice}
              />
              <SelectFormField
                name="assigned_facility_type"
                required
                label={t("preferred_facility_type")}
                value={state.form.assigned_facility_type}
                options={facilityOptions}
                optionLabel={(option) => option}
                optionValue={(option) => option}
                onChange={handleFormFieldChange}
                className="mt-2 h-11 w-full bg-white shadow-sm md:col-span-1 md:leading-5"
                error={state.errors.assigned_facility_type}
              />
              <SelectFormField
                name="breathlessness_level"
                required
                label={t("severity_of_breathlessness")}
                value={state.form.breathlessness_level}
                options={BREATHLESSNESS_LEVEL}
                optionLabel={(option) => option}
                optionValue={(option) => option}
                onChange={handleFormFieldChange}
                className="mt-2 h-11 w-full bg-white shadow-sm md:col-span-1 md:leading-5"
              />
            </>
          )}

          <TextAreaFormField
            className="md:col-span-2"
            rows={5}
            name="reason"
            label={t("reason_for_shift")}
            required
            placeholder={t("type_your_reason_here") + "*"}
            value={state.form.reason}
            onChange={handleFormFieldChange}
            error={state.errors.reason}
          />

          <TextFormField
            className="md:col-span-2"
            label="Name of ambulance driver"
            name="ambulance_driver_name"
            placeholder="Name of ambulance driver"
            value={state.form.ambulance_driver_name}
            onChange={handleTextFormFieldChange}
          />

          <PhoneNumberFormField
            className="md:col-span-1"
            name="ambulance_phone_number"
            label="Ambulance Phone Number"
            value={state.form.ambulance_phone_number}
            onChange={(event) => {
              handleFormFieldChange(event);
            }}
            error={state.errors.ambulance_phone_number}
            types={["mobile", "landline"]}
          />

          <TextFormField
            label="Ambulance No."
            name="ambulance_number"
            className="md:col-span-1"
            placeholder="Ambulance No."
            value={state.form.ambulance_number}
            onChange={handleTextFormFieldChange}
            error={state.errors.ambulance_number}
          />

          <TextAreaFormField
            className="md:col-span-2"
            rows={5}
            name="comments"
            label={t("any_other_comments")}
            placeholder={t("type_any_extra_comments_here")}
            value={state.form.comments}
            onChange={handleFormFieldChange}
            error={state.errors.comments}
          />

          <div className="mt-4 flex flex-col justify-between gap-2 md:col-span-2 md:flex-row">
            <Cancel onClick={() => goBack()} />
            <Submit onClick={() => handleSubmit()} />
          </div>
        </div>
      </Card>
    </Page>
  );
};
