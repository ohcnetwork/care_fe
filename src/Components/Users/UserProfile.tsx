import loadable from "@loadable/component";
import React, { useState, useCallback, useReducer } from "react";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import { useDispatch, useSelector } from "react-redux";
import {
  getUserDetails,
  partialUpdateUser,
  updateUserPassword,
} from "../../Redux/actions";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { validateEmailAddress } from "../../Common/validation";
import * as Notification from "../../Utils/Notifications.js";
import LanguageSelector from "../../Components/Common/LanguageSelector";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import { getExperienceSuffix, handleSignOut } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import MonthFormField from "../Form/FormFields/Month";
import moment from "moment";

const Loading = loadable(() => import("../Common/Loading"));

type EditForm = {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  email: string;
  phoneNumber: string;
  altPhoneNumber: string;
  doctor_qualification: string | undefined;
  doctor_experience_commenced_on: string | undefined;
  doctor_medical_council_registration: string | undefined;
};
type State = {
  form: EditForm;
  errors: EditForm;
};
type Action =
  | { type: "set_form"; form: EditForm }
  | { type: "set_error"; errors: EditForm };

const initForm: EditForm = {
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  email: "",
  phoneNumber: "",
  altPhoneNumber: "",
  doctor_qualification: undefined,
  doctor_experience_commenced_on: undefined,
  doctor_medical_council_registration: undefined,
};

const initError: EditForm = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
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
export default function UserProfile() {
  const [states, dispatch] = useReducer(editFormReducer, initialState);
  const reduxDispatch: any = useDispatch();

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const username = currentUser.data.username;

  const [changePasswordForm, setChangePasswordForm] = useState<{
    username: string;
    old_password: string;
    new_password_1: string;
    new_password_2: string;
  }>({
    username: username,
    old_password: "",
    new_password_1: "",
    new_password_2: "",
  });

  const [changePasswordErrors] = useState<{
    old_password: string;
    password_confirmation: string;
  }>({
    old_password: "",
    password_confirmation: "",
  });

  const [showEdit, setShowEdit] = useState<boolean | false>(false);

  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();

  const initialDetails: any = [{}];
  const [details, setDetails] = useState(initialDetails);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getUserDetails(username));
      if (!status.aborted) {
        if (res && res.data) {
          setDetails(res.data);
          const formData: EditForm = {
            firstName: res.data.first_name,
            lastName: res.data.last_name,
            age: res.data.age,
            gender: res.data.gender,
            email: res.data.email,
            phoneNumber: res.data.phone_number,
            altPhoneNumber: res.data.alt_phone_number,
            doctor_qualification: res.data.doctor_qualification,
            doctor_experience_commenced_on:
              res.data.doctor_experience_commenced_on,
            doctor_medical_council_registration:
              res.data.doctor_medical_council_registration,
          };
          dispatch({
            type: "set_form",
            form: formData,
          });
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, username]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(states.form).forEach((field) => {
      switch (field) {
        case "firstName":
        case "lastName":
        case "gender":
          if (!states.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "age":
          if (!states.form[field]) {
            errors[field] = "This field is required";
            invalidForm = true;
          } else if (
            Number(states.form[field]) <= 0 ||
            !/^\d+$/.test(states.form[field])
          ) {
            errors[field] = "Age must be a number greater than 0";
            invalidForm = true;
          }
          return;
        case "phoneNumber":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumberFromString(
            states.form[field],
            "IN"
          );

          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = phoneNumber.isValid();
          }

          if (!states.form[field] || !is_valid) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "altPhoneNumber":
          // eslint-disable-next-line no-case-declarations
          let alt_is_valid = false;
          if (states.form[field] && states.form[field] !== "+91") {
            const altPhoneNumber = parsePhoneNumberFromString(
              states.form[field],
              "IN"
            );
            if (altPhoneNumber) {
              alt_is_valid = altPhoneNumber.isValid();
            }
          }

          if (
            states.form[field] &&
            states.form[field] !== "+91" &&
            !alt_is_valid
          ) {
            errors[field] = "Please enter valid mobile number";
            invalidForm = true;
          }
          return;
        case "email":
          if (states.form[field] && !validateEmailAddress(states.form[field])) {
            errors[field] = "Enter a valid email address";
            invalidForm = true;
          }
          return;
        case "doctor_qualification":
        case "doctor_experience_commenced_on":
        case "doctor_medical_council_registration":
          if (details.user_type === "Doctor" && !states.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...states.form, [event.name]: event.value },
    });
  };

  const fieldProps = (name: string) => {
    return {
      name,
      id: name,
      value: (states.form as any)[name],
      onChange: handleFieldChange,
      error: (states.errors as any)[name],
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      const data = {
        username: username,
        first_name: states.form.firstName,
        last_name: states.form.lastName,
        email: states.form.email,
        phone_number: parsePhoneNumberFromString(
          states.form.phoneNumber
        )?.format("E.164"),
        alt_phone_number:
          parsePhoneNumberFromString(states.form.altPhoneNumber)?.format(
            "E.164"
          ) || "",
        gender: states.form.gender,
        age: states.form.age,
        doctor_qualification: states.form.doctor_qualification,
        doctor_experience_commenced_on: moment(
          states.form.doctor_experience_commenced_on
        ).format("YYYY-MM-DD"),
        doctor_medical_council_registration:
          states.form.doctor_medical_council_registration,
      };
      const res = await dispatchAction(partialUpdateUser(username, data));
      if (res && res.data) {
        Notification.Success({
          msg: "Details updated successfully",
        });
        window.location.reload();
        setDetails({
          ...details,
          first_name: states.form.firstName,
          last_name: states.form.lastName,
          age: states.form.age,
          gender: states.form.gender,
          email: states.form.email,
          phone_number: states.form.phoneNumber,
          alt_phone_number: states.form.altPhoneNumber,
        });
        setShowEdit(false);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const changePassword = (e: any) => {
    e.preventDefault();
    //validating form
    if (
      changePasswordForm.new_password_1 != changePasswordForm.new_password_2
    ) {
      Notification.Error({
        msg: "Passwords are different in the new and the confirmation column.",
      });
    } else {
      setIsLoading(true);
      const form = {
        old_password: changePasswordForm.old_password,
        username: username,
        new_password: changePasswordForm.new_password_1,
      };
      reduxDispatch(updateUserPassword(form)).then((resp: any) => {
        setIsLoading(false);
        const res = resp && resp.data;
        if (res.message === "Password updated successfully") {
          Notification.Success({
            msg: "Password changed!",
          });
        } else {
          Notification.Error({
            msg: "There was some error. Please try again in some time.",
          });
        }
        setChangePasswordForm({
          ...changePasswordForm,
          new_password_1: "",
          new_password_2: "",
          old_password: "",
        });
      });
    }
  };
  return (
    <div>
      <div className="lg:p-20 p-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Personal Information
              </h3>
              <p className="mt-1 text-sm leading-5 text-gray-600 mb-1">
                Local Body, District and State are Non Editable Settings.
              </p>
              <div className="flex flex-col gap-2">
                <ButtonV2 onClick={(_) => setShowEdit(!showEdit)} type="button">
                  {showEdit ? "Cancel" : "Edit User Profile"}
                </ButtonV2>
                <ButtonV2 variant="danger" onClick={(_) => handleSignOut(true)}>
                  <CareIcon className="care-l-sign-out-alt" />
                  Sign out
                </ButtonV2>
              </div>
            </div>
          </div>
          <div className="mt-5 lg:mt-0 lg:col-span-2">
            {!showEdit && (
              <div className="px-4 py-5 sm:px-6 bg-white shadow overflow-hidden  sm:rounded-lg m-2 rounded-lg">
                <dl className="grid grid-cols-1 col-gap-4 row-gap-8 sm:grid-cols-2">
                  <div className="sm:col-span-1 my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Username
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.username || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Contact No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.phone_number || "-"}
                    </dd>
                  </div>

                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Whatsapp No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.alt_phone_number || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.email || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      First Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.first_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Last Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.last_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Age
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.age || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Access Level
                    </dt>
                    <dd className="mt-1 badge badge-pill bg-primary-500 text-sm text-white">
                      <i className="fa-solid fa-user-check mr-1"></i>{" "}
                      {details.user_type || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.gender || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      Local Body
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.local_body_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      District
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.district_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1  my-2">
                    <dt className="text-sm leading-5 font-medium text-black">
                      State
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.state_object?.name || "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {showEdit && (
              <div className="space-y-4">
                <form action="#" method="POST">
                  <div className="shadow sm:rounded-md">
                    <div className="px-4 pt-5 bg-white">
                      <div className="grid grid-cols-6 gap-4">
                        <TextFormField
                          {...fieldProps("firstName")}
                          required
                          label="First Name"
                          className="col-span-6 sm:col-span-3"
                        />
                        <TextFormField
                          {...fieldProps("lastName")}
                          required
                          label="Last name"
                          className="col-span-6 sm:col-span-3"
                        />
                        <TextFormField
                          {...fieldProps("age")}
                          required
                          label="Age"
                          className="col-span-6 sm:col-span-3"
                          type="number"
                          min={1}
                        />
                        <SelectFormField
                          {...fieldProps("gender")}
                          label="Gender"
                          className="col-span-6 sm:col-span-3"
                          required
                          optionLabel={(o) => o.text}
                          optionValue={(o) => o.text}
                          optionIcon={(o) => (
                            <i className="text-base">{o.icon}</i>
                          )}
                          options={GENDER_TYPES}
                        />
                        <PhoneNumberFormField
                          {...fieldProps("phoneNumber")}
                          label="Phone Number"
                          className="col-span-6 sm:col-span-3"
                          required
                          placeholder="Phone Number"
                        />
                        <PhoneNumberFormField
                          {...fieldProps("altPhoneNumber")}
                          label="Whatsapp Number"
                          className="col-span-6 sm:col-span-3"
                          placeholder="WhatsApp Number"
                        />
                        <TextFormField
                          {...fieldProps("email")}
                          label="Email"
                          className="col-span-6 sm:col-span-3"
                          type="email"
                        />
                        {details.user_type === "Doctor" && (
                          <>
                            <TextFormField
                              {...fieldProps("doctor_qualification")}
                              required
                              className="col-span-6 sm:col-span-3"
                              label="Qualification"
                              placeholder="Doctor's Qualification"
                            />
                            <MonthFormField
                              {...fieldProps("doctor_experience_commenced_on")}
                              value={
                                states.form.doctor_experience_commenced_on
                                  ? moment(
                                      states.form.doctor_experience_commenced_on
                                    ).toDate()
                                  : undefined
                              }
                              required
                              className="col-span-6 sm:col-span-3"
                              label="Experience Commenced On"
                              suffix={(date) => (
                                <span className="ml-2 text-sm whitespace-nowrap">
                                  {getExperienceSuffix(date)}
                                </span>
                              )}
                            />
                            <TextFormField
                              {...fieldProps(
                                "doctor_medical_council_registration"
                              )}
                              required
                              className="col-span-6 sm:col-span-3"
                              label="Medical Council Registration"
                              placeholder="Doctor's Medical Council Registration"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 text-right">
                      <Submit onClick={handleSubmit} label="Update" />
                    </div>
                  </div>
                </form>
                <form action="#" method="POST">
                  <div className="shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 pt-5 bg-white">
                      <div className="grid grid-cols-6 gap-4">
                        <TextFormField
                          name="old_password"
                          label="Current Password"
                          className="col-span-6 sm:col-span-3"
                          type="password"
                          value={changePasswordForm.old_password}
                          onChange={(e) =>
                            setChangePasswordForm({
                              ...changePasswordForm,
                              old_password: e.value,
                            })
                          }
                          error={changePasswordErrors.old_password}
                          required
                        />
                        <TextFormField
                          name="new_password_1"
                          label="New Password"
                          type="password"
                          value={changePasswordForm.new_password_1}
                          className="col-span-6 sm:col-span-3"
                          onChange={(e) =>
                            setChangePasswordForm({
                              ...changePasswordForm,
                              new_password_1: e.value,
                            })
                          }
                          error=""
                          required
                        />
                        <TextFormField
                          name="new_password_2"
                          label="New Password Confirmation"
                          className="col-span-6 sm:col-span-3"
                          type="password"
                          value={changePasswordForm.new_password_2}
                          onChange={(e) =>
                            setChangePasswordForm({
                              ...changePasswordForm,
                              new_password_2: e.value,
                            })
                          }
                          error={changePasswordErrors.password_confirmation}
                        />
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 text-right">
                      <Submit
                        onClick={changePassword}
                        label="Change Password"
                      />
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="md:grid md:grid-cols-3 md:gap-6 mt-6 mb-8">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Language Selection
              </h3>
              <p className="mt-1 text-sm leading-5 text-gray-600">
                Set your local language
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <LanguageSelector className="bg-white w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
