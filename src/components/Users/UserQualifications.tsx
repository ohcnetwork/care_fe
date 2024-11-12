import { useReducer, useRef } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { FieldError } from "@/components/Form/FieldValidators";
import Form from "@/components/Form/Form";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import { validateNumber } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

import { FormContextValue } from "../Form/FormContext";
import { FieldChangeEvent } from "../Form/FormFields/Utils";

type EditForm = {
  user_type: string;
  qualification?: string | null;
  doctor_experience_commenced_on?: string | null;
  doctor_medical_council_registration?: string | null;
};
type ErrorForm = {
  user_type?: string;
  qualification?: string | null;
  doctor_experience_commenced_on?: string | null;
  doctor_medical_council_registration?: string | null;
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

      const formData: EditForm = {
        user_type: result.data.user_type,
        qualification: result.data.qualification,
        doctor_experience_commenced_on: dayjs()
          .diff(dayjs(result.data.doctor_experience_commenced_on), "years")
          .toString(),
        doctor_medical_council_registration:
          result.data.doctor_medical_council_registration,
      };
      dispatch({
        type: "set_form",
        form: formData,
      });
      formVals.current = formData;
    },
  });

  const validateForm = () => {
    const errors: Partial<Record<keyof EditForm, FieldError>> = {};
    Object.keys(states.form).forEach((field) => {
      switch (field) {
        case "doctor_experience_commenced_on":
          if (states.form.user_type === "Doctor") {
            if (states.form.doctor_experience_commenced_on === undefined) {
              errors[field] = t("field_required");
            } else if (
              !validateNumber(states.form.doctor_experience_commenced_on ?? "")
            ) {
              errors[field] = t("doctor_experience_number_error");
            } else {
              const years = Number(states.form.doctor_experience_commenced_on);
              if (isNaN(years) || years < 0 || years > 100) {
                errors[field] = t("doctor_experience_error");
              }
            }
          }
          break;
        case "qualification":
          if (
            (states.form.user_type === "Doctor" ||
              states.form.user_type === "Nurse") &&
            !states.form[field]
          ) {
            errors[field] = t("field_required");
          }
          break;
        case "doctor_medical_council_registration":
          if (states.form.user_type === "Doctor" && !states.form[field]) {
            errors[field] = t("field_required");
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
    dispatch({
      type: "set_form",
      form: {
        ...states.form,
        [event.name]: event.value,
      },
    });
    if (field) field(event.name as keyof EditForm).onChange(event);
  };

  if (isLoading || !userData) {
    return <Loading />;
  }

  if (!["Doctor", "Nurse"].includes(states.form.user_type ?? "")) return;

  const handleSubmit = async (formData: EditForm) => {
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
    const { res } = await request(routes.partialUpdateUser, {
      pathParams: { username: userData.username },
      body: data,
    });
    if (res?.ok) {
      Notification.Success({
        msg: "Details updated successfully",
      });
      await refetchUserData();
    }
  };

  return (
    <>
      <div className="overflow-visible rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
        {!isLoading && (
          <div className="space-y-4">
            <Form<EditForm>
              disabled={isLoading}
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
                        type="number"
                        min={0}
                        max={100}
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
