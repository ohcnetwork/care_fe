import * as Notification from "../../Utils/Notifications.js";

import {
  BREATHLESSNESS_LEVEL,
  FACILITY_TYPES,
  PATIENT_CATEGORIES,
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
  SHIFTING_VEHICLE_CHOICES,
} from "../../Common/constants";
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@material-ui/core";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { getShiftDetails, getUserList, updateShift } from "../../Redux/actions";
import { navigate, useQueryParams } from "raviger";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useCallback, useEffect, useReducer, useState } from "react";

import { CircularProgress } from "@material-ui/core";
import { ConsultationModel } from "../Facility/models.js";
import DischargeModal from "../Facility/DischargeModal.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FieldChangeEvent } from "../Form/FormFields/Utils.js";
import { FieldLabel } from "../Form/FormFields/FormField";
import { LegacyErrorHelperText } from "../Common/HelperInputFields";
import { LegacySelectField } from "../Common/HelperInputFields";
import PatientCategorySelect from "../Patient/PatientCategorySelect";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField.js";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { UserSelect } from "../Common/UserSelect";
import loadable from "@loadable/component";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { FieldChangeEvent } from "../Form/FormFields/Utils.js";
import { classNames } from "../../Utils/utils.js";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface patientShiftProps {
  id: string;
}

export const ShiftDetailsUpdate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { kasp_full_string, kasp_enabled, wartime_shifting } = useConfig();
  const dispatchAction: any = useDispatch();
  const [qParams, _] = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);
  const [assignedUser, SetAssignedUser] = useState(null);
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

  const shiftStatusOptions = wartime_shifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

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

  const handleChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e.target;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleTextAreaChange = (e: any) => {
    const form = { ...state.form };
    const { name, value } = e;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleOnSelect = (user: any) => {
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
        orgin_facility: state.form.orgin_facility_object?.id,
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
          d["patient_category"] = PATIENT_CATEGORIES.find(
            (c) => c.text === res.data.patient_category
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
    <div className="px-2 pb-2">
      <DischargeModal
        show={showDischargeModal}
        onClose={() => setShowDischargeModal(false)}
        consultationData={consultationData}
        discharge_reason="EXP"
        afterSubmit={() => {
          handleSubmit(true);
        }}
      />
      <PageTitle
        title={t("update_shift_request")}
        backUrl={`/shifting/${props.id}`}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-1">
                <SelectFormField
                  name="status"
                  label="Status"
                  required
                  options={shiftStatusOptions}
                  value={state.form.status}
                  optionLabel={(option) => option.label || option.text}
                  optionValue={(option) => option.text}
                  optionSelectedLabel={(option) => option.label || option.text}
                  onChange={handleChange}
                  className={classNames(
                    "bg-white",
                    wartime_shifting ? " h-14 " : " h-12 ",
                    "w-full shadow-sm md:text-sm md:leading-5 mt-2"
                  )}
                />
              </div>
              {wartime_shifting && (
                <div className="flex-none">
                  <FieldLabel>{t("assigned_to")}</FieldLabel>
                  <div>
                    {assignedUserLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <UserSelect
                        multiple={false}
                        selected={assignedUser}
                        setSelected={handleOnSelect}
                        errors={""}
                        facilityId={
                          state.form?.shifting_approving_facility_object?.id
                        }
                      />
                    )}
                  </div>
                </div>
              )}
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
                <FieldLabel>
                  {t("what_facility_assign_the_patient_to")}
                </FieldLabel>
                <FacilitySelect
                  multiple={false}
                  freeText={true}
                  name="assigned_facility"
                  className={classNames(!wartime_shifting && " mt-6 ")}
                  selected={state.form.assigned_facility_object}
                  setSelected={(obj) =>
                    setFacility(obj, "assigned_facility_object")
                  }
                  errors={state.errors.assigned_facility}
                />
              </div>

              <div>
                <FieldLabel>{t("is_this_an_emergency")}</FieldLabel>
                <RadioGroup
                  aria-label="emergency"
                  name="emergency"
                  value={[true, "true"].includes(state.form.emergency)}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box>
                    <FormControlLabel
                      value={true}
                      control={<Radio />}
                      label={t("yes")}
                    />
                    <FormControlLabel
                      value={false}
                      control={<Radio />}
                      label={t("no")}
                    />
                  </Box>
                </RadioGroup>
                <LegacyErrorHelperText error={state.errors.emergency} />
              </div>

              {kasp_enabled && (
                <div>
                  <FieldLabel>
                    {t("is")} {kasp_full_string}?
                  </FieldLabel>
                  <RadioGroup
                    aria-label="is_kasp"
                    name="is_kasp"
                    value={[true, "true"].includes(state.form.is_kasp)}
                    onChange={handleChange}
                    style={{ padding: "0px 5px" }}
                  >
                    <Box>
                      <FormControlLabel
                        value={true}
                        control={<Radio />}
                        label={t("yes")}
                      />
                      <FormControlLabel
                        value={false}
                        control={<Radio />}
                        label={t("no")}
                      />
                    </Box>
                  </RadioGroup>
                  <LegacyErrorHelperText error={state.errors.is_kasp} />
                </div>
              )}

              <div>
                <FieldLabel>{t("is_this_an_upshift")}</FieldLabel>
                <RadioGroup
                  aria-label={t("is_it_upshift")}
                  name="is_up_shift"
                  value={[true, "true"].includes(state.form.is_up_shift)}
                  onChange={handleChange}
                  style={{ padding: "0px 5px" }}
                >
                  <Box>
                    <FormControlLabel
                      value={true}
                      control={<Radio />}
                      label={t("yes")}
                    />
                    <FormControlLabel
                      value={false}
                      control={<Radio />}
                      label={t("no")}
                    />
                  </Box>
                </RadioGroup>
                <LegacyErrorHelperText error={state.errors.is_up_shift} />
              </div>

              <div className="md:col-span-2">
                <PatientCategorySelect
                  required={false}
                  name="patient_category"
                  value={state.form.patient_category}
                  onChange={handleFormFieldChange}
                  label="Patient Category"
                />
              </div>

              {wartime_shifting && (
                <>
                  <div className="md:col-span-1">
                    <FieldLabel>{t("preferred_vehicle")}</FieldLabel>
                    <LegacySelectField
                      name="preferred_vehicle_choice"
                      variant="outlined"
                      margin="dense"
                      optionArray={true}
                      value={state.form.preferred_vehicle_choice}
                      options={["", ...vehicleOptions]}
                      onChange={handleChange}
                      className="bg-white h-11 w-full mt-2 shadow-sm md:leading-5"
                      errors={state.errors.preferred_vehicle_choice}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <FieldLabel>{t("preferred_facility_type")}*</FieldLabel>
                    <LegacySelectField
                      name="assigned_facility_type"
                      variant="outlined"
                      margin="dense"
                      optionArray={true}
                      value={state.form.assigned_facility_type}
                      options={["", ...facilityOptions]}
                      onChange={handleChange}
                      className="bg-white h-11 w-full mt-2 shadow-sm md:leading-5"
                      errors={state.errors.assigned_facility_type}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <FieldLabel>{t("severity_of_breathlessness")}*</FieldLabel>
                    <LegacySelectField
                      name="breathlessness_level"
                      variant="outlined"
                      margin="dense"
                      optionArray={true}
                      value={state.form.breathlessness_level}
                      options={BREATHLESSNESS_LEVEL}
                      onChange={handleChange}
                      className="bg-white h-11 w-full mt-2 shadow-sm md:leading-5"
                    />
                  </div>{" "}
                </>
              )}
              <div className="md:col-span-2">
                <TextAreaFormField
                  rows={5}
                  name="reason"
                  label={t("reason_for_shift")}
                  required
                  placeholder={t("type_your_reason_here") + "*"}
                  value={state.form.reason}
                  onChange={handleTextAreaChange}
                  error={state.errors.reason}
                />
              </div>

              <div className="md:col-span-2">
                <TextFormField
                  label="Name of ambulance driver"
                  name="ambulance_driver_name"
                  placeholder="Name of ambulance driver"
                  value={state.form.ambulance_driver_name}
                  onChange={handleTextFormFieldChange}
                />
              </div>

              <div className="md:col-span-1">
                <PhoneNumberFormField
                  name="ambulance_phone_number"
                  label="Ambulance Phone Number"
                  value={state.form.ambulance_phone_number}
                  onChange={(event) => {
                    handleFormFieldChange(event);
                  }}
                  error={state.errors.ambulance_phone_number}
                />
              </div>

              <div className="md:col-span-1">
                <TextFormField
                  label="Ambulance No."
                  name="ambulance_number"
                  placeholder="Ambulance No."
                  value={state.form.ambulance_number}
                  onChange={handleTextFormFieldChange}
                  error={state.errors.ambulance_number}
                />
              </div>

              <div className="md:col-span-2">
                <TextAreaFormField
                  rows={5}
                  name="comments"
                  label={t("any_other_comments")}
                  placeholder={t("type_any_extra_comments_here")}
                  value={state.form.comments}
                  onChange={handleTextAreaChange}
                  error={state.errors.comments}
                />
              </div>

              <div className="md:col-span-2 flex flex-col md:flex-row gap-2 justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={() => handleSubmit()} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
