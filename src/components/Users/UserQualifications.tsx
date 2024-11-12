import { useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { FieldError } from "@/components/Form/FieldValidators";
import Form from "@/components/Form/Form";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  EditForm,
  ValidateDoctorExperienceCommencedOn,
  ValidateDoctorMedicalCouncilRegistration,
  ValidateQualification,
} from "@/components/Users/UserFormValidations";

import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

import { FormContextValue } from "../Form/FormContext";
import { FieldChangeEvent } from "../Form/FormFields/Utils";

type ErrorForm = {
  user_type?: string;
  qualification?: string;
  doctor_experience_commenced_on?: string;
  doctor_medical_council_registration?: string;
};
type State = {
  form: EditForm;
  errors: ErrorForm;
};
type Action =
  | { type: "set_form"; form: EditForm }
  | { type: "set_error"; errors: ErrorForm };

const initForm: EditForm = {
  user_type: "",
  qualification: null,
  doctor_experience_commenced_on: null,
  doctor_medical_council_registration: null,
};

const initError: ErrorForm = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
);

const initialState: State = {
  form: { ...initForm },
  errors: { ...initError },
};

const editFormReducer = (state: State, action: Action) => {
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
  }
};

export default function UserQualifications({ username }: { username: string }) {
  const { t } = useTranslation();
  const [states, dispatch] = useReducer(editFormReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formVals = useRef(initForm);

  const {
    data: userData,
    loading: isLoading,
    refetch: refetchUserData,
  } = useQuery(routes.getUserDetails, {
    query: {
      username: username,
    },
    onResponse: (result) => {
      if (!result || !result.res || !result.data) return;
      const userData = result.data;

      const formData: EditForm = {
        user_type: userData.user_type,
        qualification: userData.qualification,
        doctor_experience_commenced_on: userData.doctor_experience_commenced_on
          ? dayjs()
              .diff(dayjs(userData.doctor_experience_commenced_on), "years")
              .toString()
          : null,
        doctor_medical_council_registration:
          userData.doctor_medical_council_registration,
      };
      dispatch({
        type: "set_form",
        form: formData,
      });
      formVals.current = formData;
    },
  });

  const validateForm = (formData: EditForm) => {
    const errors: Partial<Record<keyof EditForm, FieldError>> = {};
    Object.keys(formData).forEach((field) => {
      let currentError = null;
      switch (field) {
        case "doctor_experience_commenced_on":
          currentError = ValidateDoctorExperienceCommencedOn(formData, t);
          if (currentError) {
            errors[field] = currentError;
          }
          break;
        case "qualification":
          currentError = ValidateQualification(formData, t);
          if (currentError) {
            errors[field] = currentError;
          }
          break;
        case "doctor_medical_council_registration":
          currentError = ValidateDoctorMedicalCouncilRegistration(formData, t);
          if (currentError) {
            errors[field] = currentError;
          }
          break;
      }
    });
    return errors;
  };

  const handleCancel = () => {
    dispatch({
      type: "set_form",
      form: formVals.current,
    });
  };

  const handleFieldChange = (
    event: FieldChangeEvent<unknown>,
    field?: FormContextValue<EditForm>,
  ) => {
    const fieldName = event.name as keyof EditForm;
    dispatch({
      type: "set_form",
      form: {
        ...states.form,
        [fieldName]: event.value,
      },
    });
    field?.(fieldName).onChange(event);
  };

  if (isLoading || !userData) {
    return <Loading />;
  }

  if (!["Doctor", "Nurse"].includes(states.form.user_type ?? "")) return;

  const handleSubmit = async (formData: EditForm) => {
    setIsSubmitting(true);
    const data = {
      qualification:
        formData.user_type === "Doctor" || formData.user_type === "Nurse"
          ? (formData.qualification ?? undefined)
          : undefined,
      doctor_experience_commenced_on:
        formData.user_type === "Doctor"
          ? dayjs()
              .subtract(
                parseInt(
                  (formData.doctor_experience_commenced_on as string) ?? "0",
                ),
                "years",
              )
              .format("YYYY-MM-DD")
          : undefined,
      doctor_medical_council_registration:
        formData.user_type === "Doctor"
          ? (formData.doctor_medical_council_registration ?? undefined)
          : undefined,
    };
    const { res, error } = await request(routes.partialUpdateUser, {
      pathParams: { username: userData.username },
      body: data,
    });
    if (res?.ok) {
      Notification.Success({
        msg: t("user_details_update_success"),
      });
      await refetchUserData();
    } else {
      Notification.Error({
        msg: error?.message ?? t("user_details_update_error"),
      });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="overflow-visible rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
        {!isLoading && (
          <div className="space-y-4">
            <Form<EditForm>
              disabled={isSubmitting || isLoading}
              defaults={userData ? states.form : initForm}
              validate={validateForm}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              hideRestoreDraft
              noPadding
              resetFormVals
            >
              {(field) => (
                <>
                  <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                    {(states.form.user_type === "Doctor" ||
                      states.form.user_type === "Nurse") && (
                      <TextFormField
                        {...field("qualification")}
                        required
                        className="flex-1"
                        label={t("qualification")}
                        placeholder={t("qualification")}
                        onChange={(e) => {
                          handleFieldChange(e, field);
                        }}
                      />
                    )}
                  </div>
                  {states.form.user_type === "Doctor" && (
                    <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                      <TextFormField
                        {...field("doctor_experience_commenced_on")}
                        required
                        className="flex-1"
                        label={t("years_of_experience")}
                        placeholder={t("years_of_experience_of_the_doctor")}
                        onChange={(e) => {
                          handleFieldChange(e, field);
                        }}
                      />
                      <TextFormField
                        {...field("doctor_medical_council_registration")}
                        required
                        className="flex-1"
                        label={t("medical_council_registration")}
                        placeholder={t("doctor_s_medical_council_registration")}
                        onChange={(e) => {
                          handleFieldChange(e, field);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </Form>
          </div>
        )}
      </div>
    </>
  );
}
