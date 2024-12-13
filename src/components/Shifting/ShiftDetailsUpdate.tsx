import careConfig from "@careConfig";
import { navigate, useQueryParams } from "raviger";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";

import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { ConsultationModel, ShiftingModel } from "@/components/Facility/models";
import Form from "@/components/Form/Form";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import PatientCategorySelect from "@/components/Patient/PatientCategorySelect";
import { PatientModel } from "@/components/Patient/models";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import {
  BREATHLESSNESS_LEVEL,
  DISCHARGE_REASONS,
  FACILITY_TYPES,
  PATIENT_CATEGORIES,
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
  SHIFTING_VEHICLE_CHOICES,
  USER_TYPES,
} from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { parsePhoneNumber } from "@/Utils/utils";

import DischargeModal from "../Facility/DischargeModal";

interface patientShiftProps {
  id: string;
}

export const ShiftDetailsUpdate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { user_type, home_facility } = useAuthUser();
  const [qParams, _] = useQueryParams();

  const [isLoading, setIsLoading] = useState(true);

  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {} as ConsultationModel,
  );
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeReason, setDischargeReason] = useState<number>();
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
    status: "",
    patient_category: "",
    breathlessness_level: "",
    ambulance_driver_name: "",
    ambulance_phone_number: "",
    ambulance_number: "",
  };

  const initError = Object.assign(
    {},
    ...Object.keys(initForm).map((k) => ({ [k]: "" })),
  );

  const initialState = {
    form: { ...initForm },
    errors: { ...initError },
  };

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

  let requiredFields: any = {
    assigned_facility_object: {
      condition: [
        "DESTINATION APPROVED",
        "PATIENT TO BE PICKED UP",
        "TRANSFER IN PROGRESS",
        "COMPLETED",
      ].includes(state.form.status),
      errorText: t("please_select_a_facility"),
    },
    status: {
      errorText: t("please_select_status"),
    },
    patient_category: {
      errorText: t("please_select_patient_category"),
    },
    reason: {
      errorText: t("please_enter_a_reason_for_the_shift"),
    },
  };

  if (careConfig.wartimeShifting) {
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
      breathlessness_level: {
        errorText: t("please_select_breathlessness_level"),
      },
    };
  }

  const validateForm = (form: typeof initForm) => {
    const errors = { ...initError };
    let validForm = true;
    Object.keys(requiredFields).forEach((field) => {
      if (
        (!form[field] || !/\S+/.test(form[field])) &&
        ("condition" in requiredFields[field]
          ? requiredFields[field].condition
          : true)
      ) {
        errors[field] = requiredFields[field].errorText;
        validForm = false;
      } else {
        errors[field] = "";
      }
    });

    dispatch({ type: "set_error", errors });
    return validForm;
  };

  const handleSubmit = async (
    form: typeof initForm,
    source?: string,
    discharged = false,
  ) => {
    const validForm = validateForm(form);

    if (validForm) {
      if (!discharged && form.status === "PATIENT EXPIRED") {
        setDischargeReason(
          DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id,
        );
        setShowDischargeModal(true);
        return;
      }
      if (!discharged && form.status === "COMPLETED") {
        setDischargeReason(
          DISCHARGE_REASONS.find((i) => i.text == "Referred")?.id,
        );
        setShowDischargeModal(true);
        return;
      }

      setIsLoading(true);
      const data: Partial<ShiftingModel> = {
        origin_facility: form.origin_facility_object?.id,
        shifting_approving_facility:
          form?.shifting_approving_facility_object?.id,
        assigned_facility: form?.assigned_facility_object?.id,
        assigned_facility_external: !form?.assigned_facility_object?.id
          ? form?.assigned_facility_object?.name
          : null,
        patient: form.patient_object?.id,
        emergency: [true, "true"].includes(form.emergency),
        is_kasp: [true, "true"].includes(form.is_kasp),
        is_up_shift: [true, "true"].includes(form.is_up_shift),
        reason: form.reason,
        vehicle_preference: form.vehicle_preference,
        comments: form.comments,
        assigned_facility_type: form.assigned_facility_type,
        preferred_vehicle_choice: form.preferred_vehicle_choice,
        assigned_to: form.assigned_to,
        breathlessness_level: form.breathlessness_level,
        patient_category: form.patient_category,
        ambulance_driver_name: form.ambulance_driver_name,
        ambulance_phone_number:
          form.ambulance_phone_number === "+91"
            ? ""
            : parsePhoneNumber(form.ambulance_phone_number),
        ambulance_number: form.ambulance_number,
      };

      if (form.status !== form.initial_status) {
        data["status"] = form.status;
      }

      const { res, data: shiftData } = await request(routes.updateShift, {
        pathParams: { id: props.id },
        body: data,
      });
      setIsLoading(false);
      if (res?.ok && shiftData) {
        dispatch({ type: "set_form", form: shiftData });
        Notification.Success({
          msg: t("shift_request_updated_successfully"),
        });

        navigate(`/shifting/${props.id}`);
      } else {
        setIsLoading(false);
      }
    }
  };

  useTanStackQueryInstead(routes.getShiftDetails, {
    pathParams: { id: props.id },
    onResponse: ({ res, data }) => {
      if (res?.ok && data) {
        const d = data;
        setConsultationData(
          (d.patient as PatientModel).last_consultation as ConsultationModel,
        );
        if (d.assigned_facility_external)
          d["assigned_facility_object"] = {
            name: String(data.assigned_facility_external),
          };
        d["initial_status"] = data.status;
        d["status"] = qParams.status || data.status;
        const patient_category =
          (d.patient as PatientModel).last_consultation?.last_daily_round
            ?.patient_category ??
          (d.patient as PatientModel).last_consultation?.category;
        d["patient_category"] =
          PATIENT_CATEGORIES.find((c) => c.text === patient_category)?.id ?? "";
        dispatch({ type: "set_form", form: d });
        setIsLoading(false);
      }
    },
  });

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
        referred_to={state.form.assigned_facility_object}
        new_discharge_reason={dischargeReason}
        afterSubmit={() => {
          handleSubmit(state.form, "", true);
        }}
      />
      <Card className="mx-auto mt-4 w-full max-w-4xl md:p-6 lg:p-8">
        <Form
          className=""
          defaults={state.form}
          onSubmit={handleSubmit}
          onCancel={() => goBack()}
          noPadding
          hideRestoreDraft
        >
          {(field) => (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectFormField
                name="status"
                label={t("status")}
                required
                options={
                  careConfig.wartimeShifting
                    ? SHIFTING_CHOICES_WARTIME
                    : SHIFTING_CHOICES_PEACETIME
                }
                value={field("status").value}
                optionLabel={(option) => option.text}
                optionValue={(option) => option.text}
                optionDisabled={(option) =>
                  // disable all options except `Destination Approved` for non-admin destination facility users
                  home_facility === state.form.assigned_facility_object?.id &&
                  USER_TYPES.findIndex((type) => user_type === type) <
                    USER_TYPES.findIndex((type) => type === "DistrictAdmin") &&
                  !["DESTINATION APPROVED"].includes(option.text)
                }
                optionSelectedLabel={(option) => option.text}
                onChange={(e) => field("status").onChange(e)}
                className="w-full bg-white md:col-span-1 md:leading-5"
              />

              <div>
                <FieldLabel
                  required={[
                    "DESTINATION APPROVED",
                    "PATIENT TO BE PICKED UP",
                    "TRANSFER IN PROGRESS",
                    "COMPLETED",
                  ].includes(state.form.status)}
                >
                  {t("what_facility_assign_the_patient_to")}
                </FieldLabel>
                <FacilitySelect
                  multiple={false}
                  freeText
                  name="assigned_facility"
                  required={[
                    "DESTINATION APPROVED",
                    "PATIENT TO BE PICKED UP",
                    "TRANSFER IN PROGRESS",
                    "COMPLETED",
                  ].includes(state.form.status)}
                  selected={field("assigned_facility_object").value}
                  setSelected={(obj: any) => {
                    field("assigned_facility_object").onChange({
                      name: "assigned_facility_object",
                      value: obj,
                    });
                    field("assigned_facility").onChange({
                      name: "assigned_facility",
                      value: obj.id,
                    });
                  }}
                  errors={field("assigned_facility_object").error}
                />
              </div>

              <RadioFormField
                label={t("is_this_an_emergency")}
                name="emergency"
                value={field("emergency").value?.toString()}
                onChange={(e) => {
                  field("emergency").onChange(e);
                }}
                options={[
                  { label: t("yes"), value: "true" },
                  { label: t("no"), value: "false" },
                ]}
                optionLabel={(option) => option.label}
                optionValue={(option) => option.value}
              />

              {careConfig.kasp.enabled && (
                <RadioFormField
                  name="is_kasp"
                  value={field("is_kasp").value?.toString()}
                  label={t("is") + " " + careConfig.kasp.fullString + "?"}
                  options={[
                    { label: t("yes"), value: "true" },
                    { label: t("no"), value: "false" },
                  ]}
                  optionValue={(option) => option.value}
                  optionLabel={(option) => option.label}
                  onChange={(e) => {
                    field("is_kasp").onChange(e);
                  }}
                />
              )}

              <RadioFormField
                label={t("is_this_an_upshift")}
                name="is_up_shift"
                value={field("is_up_shift").value?.toString()}
                options={[
                  { label: t("yes"), value: "true" },
                  { label: t("no"), value: "false" },
                ]}
                optionValue={(option) => option.value}
                optionLabel={(option) => option.label}
                onChange={(e) => {
                  field("is_up_shift").onChange(e);
                }}
              />

              <PatientCategorySelect
                required={true}
                name="patient_category"
                value={field("patient_category").value}
                onChange={(e) => {
                  field("patient_category").onChange(e);
                }}
                label="Patient Category"
                className="md:col-span-2"
                error={field("patient_category").error}
              />

              {careConfig.wartimeShifting && (
                <>
                  <SelectFormField
                    name="preferred_vehicle_choice"
                    label={t("preferred_vehicle")}
                    value={field("preferred_vehicle_choice").value}
                    options={vehicleOptions}
                    optionLabel={(option) => option}
                    optionValue={(option) => option}
                    onChange={(e) =>
                      field("preferred_vehicle_choice").onChange(e)
                    }
                    className="mt-2 h-11 w-full bg-white shadow-sm md:leading-5"
                    error={field("preferred_vehicle_choice").error}
                  />
                  <SelectFormField
                    name="assigned_facility_type"
                    required
                    label={t("preferred_facility_type")}
                    value={field("assigned_facility_type").value}
                    options={facilityOptions}
                    optionLabel={(option) => option}
                    optionValue={(option) => option}
                    onChange={(e) =>
                      field("assigned_facility_type").onChange(e)
                    }
                    className="mt-2 h-11 w-full bg-white shadow-sm md:col-span-1 md:leading-5"
                    error={field("assigned_facility_type").error}
                  />
                  <SelectFormField
                    name="breathlessness_level"
                    required
                    label={t("severity_of_breathlessness")}
                    value={field("breathlessness_level").value}
                    options={BREATHLESSNESS_LEVEL}
                    optionLabel={(option) => option}
                    optionValue={(option) => option}
                    onChange={(e) => field("breathlessness_level").onChange(e)}
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
                value={field("reason").value}
                onChange={(e) => field("reason").onChange(e)}
                error={field("reason").error}
              />

              <TextFormField
                className="md:col-span-2"
                label="Name of ambulance driver"
                name="ambulance_driver_name"
                placeholder="Name of ambulance driver"
                value={field("ambulance_driver_name").value}
                onChange={(e) => field("ambulance_driver_name").onChange(e)}
              />

              <PhoneNumberFormField
                className="md:col-span-1"
                name="ambulance_phone_number"
                label="Ambulance Phone Number"
                value={field("ambulance_phone_number").value}
                onChange={(e) => field("ambulance_phone_number").onChange(e)}
                error={field("ambulance_phone_number").error}
                types={["mobile", "landline"]}
              />

              <TextFormField
                label="Ambulance No."
                name="ambulance_number"
                className="md:col-span-1"
                placeholder="Ambulance No."
                value={field("ambulance_number").value}
                onChange={(e) => field("ambulance_number").onChange(e)}
                error={field("ambulance_number").error}
              />

              <TextAreaFormField
                className="md:col-span-2"
                rows={5}
                name="comments"
                label={t("any_other_comments")}
                placeholder={t("type_any_extra_comments_here")}
                value={field("comments").value}
                onChange={(e) => field("comments").onChange(e)}
                error={field("comments").error}
              />
            </div>
          )}
        </Form>
      </Card>
    </Page>
  );
};
