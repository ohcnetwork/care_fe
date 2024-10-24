import * as Notification from "../../Utils/Notifications.js";

import {
  BREATHLESSNESS_LEVEL,
  DISCHARGE_REASONS,
  FACILITY_TYPES,
  PATIENT_CATEGORIES,
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
  SHIFTING_VEHICLE_CHOICES,
  USER_TYPES,
} from "../../Common/constants";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { navigate, useQueryParams } from "raviger";
import { useReducer, useState } from "react";
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
import { parsePhoneNumber } from "../../Utils/utils.js";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { useTranslation } from "react-i18next";
import CircularProgress from "../Common/components/CircularProgress.js";
import Card from "../../CAREUI/display/Card";
import RadioFormField from "../Form/FormFields/RadioFormField.js";
import Page from "../Common/components/Page.js";
import { LinkedFacilityUsers } from "../Common/UserAutocompleteFormField.js";
import { UserBareMinimum } from "../Users/models.js";
import useQuery from "../../Utils/request/useQuery.js";
import routes from "../../Redux/api.js";
import { IShift } from "./models.js";
import request from "../../Utils/request/request.js";
import { PatientModel } from "../Patient/models.js";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import careConfig from "@careConfig";

import Loading from "@/Components/Common/Loading";
interface patientShiftProps {
  id: string;
}

export const ShiftDetailsUpdate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { user_type, home_facility } = useAuthUser();
  const [qParams, _] = useQueryParams();

  const [isLoading, setIsLoading] = useState(true);
  const [assignedUser, SetAssignedUser] = useState<UserBareMinimum>();

  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {} as ConsultationModel
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

  const { loading: assignedUserLoading } = useQuery(routes.userList, {
    query: { id: state.form.assigned_to },
    prefetch: state.form.assigned_to ? true : false,
    onResponse: ({ res, data }) => {
      if (res?.ok && data?.count) SetAssignedUser(data.results[0]);
    },
  });

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      if (
        (!state.form[field] || !/\S+/.test(state.form[field])) &&
        ("condition" in requiredFields[field]
          ? requiredFields[field].condition
          : true)
      ) {
        errors[field] = requiredFields[field].errorText;
        isInvalidForm = true;
      } else {
        errors[field] = "";
      }
    });

    dispatch({ type: "set_error", errors });
    return !isInvalidForm;
  };

  const handleAssignedUserSelect = (
    event: FieldChangeEvent<UserBareMinimum>
  ) => {
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
        setDischargeReason(
          DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id
        );
        setShowDischargeModal(true);
        return;
      }
      if (!discharged && state.form.status === "COMPLETED") {
        setDischargeReason(
          DISCHARGE_REASONS.find((i) => i.text == "Referred")?.id
        );
        setShowDischargeModal(true);
        return;
      }

      setIsLoading(true);
      const data: Partial<IShift> = {
        origin_facility: state.form.origin_facility_object?.id,
        shifting_approving_facility:
          state.form?.shifting_approving_facility_object?.id,
        assigned_facility: state.form?.assigned_facility_object?.id,
        assigned_facility_external: !state.form?.assigned_facility_object?.id
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
        ambulance_phone_number:
          state.form.ambulance_phone_number === "+91"
            ? ""
            : parsePhoneNumber(state.form.ambulance_phone_number),
        ambulance_number: state.form.ambulance_number,
      };

      if (state.form.status !== state.form.initial_status) {
        data["status"] = state.form.status;
      }

      const res = await request.patch(`/api/v1/shifting/${props.id}/`, data);
      setIsLoading(false);
      if (res?.status === 200) {
        Notification.Success({
          msg: t("shift_details_updated_successfully"),
        });
        goBack();
      } else {
        Notification.Error({
          msg: t("something_went_wrong"),
        });
      }
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Page title={t("shift_details_update")} hideBack={true}>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex justify-end gap-2">
            <Cancel onClick={goBack} />
            <Submit onClick={() => handleSubmit()} />
          </div>
        </form>
      </Card>
    </Page>
  );
};
