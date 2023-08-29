import { useState, useCallback, useReducer, lazy, FormEvent } from "react";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import { useDispatch } from "react-redux";
import {
  getUserDetails,
  getUserListSkills,
  partialUpdateUser,
  updateUserPassword,
} from "../../Redux/actions";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { validateEmailAddress } from "../../Common/validation";
import * as Notification from "../../Utils/Notifications.js";
import LanguageSelector from "../../Components/Common/LanguageSelector";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import { classNames, handleSignOut } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { SkillModel, SkillObjectModel } from "../Users/models";
import UpdatableApp, { checkForUpdate } from "../Common/UpdatableApp";
import dayjs from "../../Utils/dayjs";
import useAuthUser from "../../Common/hooks/useAuthUser";

const Loading = lazy(() => import("../Common/Loading"));

type EditForm = {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  email: string;
  phoneNumber: string;
  altPhoneNumber: string;
  doctor_qualification: string | undefined;
  doctor_experience_commenced_on: number | string | undefined;
  doctor_medical_council_registration: string | undefined;
  weekly_working_hours: string | undefined;
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
  weekly_working_hours: undefined,
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
  const [updateStatus, setUpdateStatus] = useState({
    isChecking: false,
    isUpdateAvailable: false,
  });

  const authUser = useAuthUser();

  const [changePasswordForm, setChangePasswordForm] = useState<{
    username: string;
    old_password: string;
    new_password_1: string;
    new_password_2: string;
  }>({
    username: authUser.username,
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
      const res = await dispatchAction(getUserDetails(authUser.username));
      const resSkills = await dispatchAction(
        getUserListSkills({ username: authUser.username })
      );
      if (!status.aborted) {
        if (res && res.data && resSkills) {
          res.data.skills = resSkills.data.results.map(
            (skill: SkillModel) => skill.skill_object
          );
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
            doctor_experience_commenced_on: dayjs().diff(
              dayjs(res.data.doctor_experience_commenced_on),
              "years"
            ),
            doctor_medical_council_registration:
              res.data.doctor_medical_council_registration,
            weekly_working_hours: res.data.weekly_working_hours,
          };
          dispatch({
            type: "set_form",
            form: formData,
          });
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, authUser.username]
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
          if (!states.form[field]) {
            errors[field] = "This field is required";
            invalidForm = true;
          } else if (!validateEmailAddress(states.form[field])) {
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
        case "weekly_working_hours":
          if (!states.form[field]) {
            errors[field] = "This field is required";
            invalidForm = true;
          } else if (
            Number(states.form[field]) < 0 ||
            Number(states.form[field]) > 168 ||
            !/^\d+$/.test(states.form[field] ?? "")
          ) {
            errors[field] =
              "Weekly working hours must be a number between 0 and 168";
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      const data = {
        username: authUser.username,
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
        doctor_qualification:
          details.user_type === "Doctor"
            ? states.form.doctor_qualification
            : undefined,
        doctor_experience_commenced_on:
          details.user_type === "Doctor"
            ? dayjs()
                .subtract(
                  parseInt(
                    (states.form.doctor_experience_commenced_on as string) ??
                      "0"
                  ),
                  "years"
                )
                .format("YYYY-MM-DD")
            : undefined,
        doctor_medical_council_registration:
          details.user_type === "Doctor"
            ? states.form.doctor_medical_council_registration
            : undefined,
        weekly_working_hours: states.form.weekly_working_hours,
      };
      const res = await dispatchAction(
        partialUpdateUser(authUser.username, data)
      );
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

  const checkUpdates = async () => {
    setUpdateStatus({ ...updateStatus, isChecking: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if ((await checkForUpdate()) != null) {
      setUpdateStatus({
        isUpdateAvailable: true,
        isChecking: false,
      });
    } else {
      setUpdateStatus({
        isUpdateAvailable: false,
        isChecking: false,
      });
      Notification.Success({
        msg: "No update available",
      });
    }
  };

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
        username: authUser.username,
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
      <div className="p-10 lg:p-20">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Personal Information
              </h3>
              <p className="my-1 text-sm leading-5 text-gray-600">
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
          <div className="mt-5 lg:col-span-2 lg:mt-0">
            {!showEdit && (
              <div className="m-2 overflow-hidden rounded-lg bg-white px-4 py-5  shadow sm:rounded-lg sm:px-6">
                <dl className="col-gap-4 row-gap-8 grid grid-cols-1 sm:grid-cols-2">
                  <div className="my-2 sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Username
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.username || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Contact No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.phone_number || "-"}
                    </dd>
                  </div>

                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Whatsapp No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.alt_phone_number || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.email || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      First Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.first_name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Last Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.last_name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Age
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.age || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Access Level
                    </dt>
                    <dd className="badge badge-pill mt-1 bg-primary-500 text-sm text-white">
                      <i className="fa-solid fa-user-check mr-1"></i>{" "}
                      {details.user_type || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.gender || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Local Body
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.local_body_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      District
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.district_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      State
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.state_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Skills
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      <div className="flex flex-wrap gap-2">
                        {details.skills && details.skills.length
                          ? details.skills?.map((skill: SkillObjectModel) => {
                              return (
                                <span className="flex items-center gap-2 rounded-full border-gray-300 bg-gray-200 px-3 text-xs text-gray-700">
                                  <p className="py-1.5">{skill.name}</p>
                                </span>
                              );
                            })
                          : "-"}
                      </div>
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Weekly working hours
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.weekly_working_hours ?? "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {showEdit && (
              <div className="space-y-4">
                <form action="#" method="POST">
                  <div className="shadow sm:rounded-md">
                    <div className="bg-white px-4 pt-5">
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
                          types={["mobile", "landline"]}
                        />
                        <PhoneNumberFormField
                          {...fieldProps("altPhoneNumber")}
                          label="Whatsapp Number"
                          className="col-span-6 sm:col-span-3"
                          placeholder="WhatsApp Number"
                          types={["mobile"]}
                        />
                        <TextFormField
                          {...fieldProps("email")}
                          label="Email"
                          className="col-span-6 sm:col-span-3"
                          required
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
                            <TextFormField
                              {...fieldProps("doctor_experience_commenced_on")}
                              required
                              className="col-span-6 sm:col-span-3"
                              type="number"
                              min={0}
                              label="Years of experience"
                              placeholder="Years of experience of the Doctor"
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
                        <TextFormField
                          {...fieldProps("weekly_working_hours")}
                          required
                          label="Weekly working hours"
                          className="col-span-6 sm:col-span-3"
                          type="number"
                          min={0}
                          max={168}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                      <Submit onClick={handleSubmit} label="Update" />
                    </div>
                  </div>
                </form>
                <form action="#" method="POST">
                  <div className="overflow-hidden shadow sm:rounded-md">
                    <div className="bg-white px-4 pt-5">
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
                    <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
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

        <div className="mb-8 mt-6 md:grid md:grid-cols-3 md:gap-6">
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
          <div className="mt-5 md:col-span-2 md:mt-0">
            <LanguageSelector className="w-full bg-white" />
          </div>
        </div>
        <div className="mb-8 mt-6 md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Software Update
              </h3>
              <p className="mt-1 text-sm leading-5 text-gray-600">
                Check for an available update
              </p>
            </div>
          </div>
          {updateStatus.isUpdateAvailable && (
            <UpdatableApp silentlyAutoUpdate={false}>
              <ButtonV2 disabled={true}>
                <div className="flex items-center gap-4">
                  <CareIcon className="care-l-exclamation text-2xl" />
                  Update available
                </div>
              </ButtonV2>
            </UpdatableApp>
          )}
          <div className="mt-5 md:col-span-2 md:mt-0">
            {!updateStatus.isUpdateAvailable && (
              <ButtonV2
                disabled={updateStatus.isChecking}
                onClick={checkUpdates}
              >
                {" "}
                <div className="flex items-center gap-4">
                  <CareIcon
                    className={classNames(
                      "care-l-sync text-2xl",
                      updateStatus.isChecking && "animate-spin"
                    )}
                  />
                  {updateStatus.isChecking
                    ? "Checking for update"
                    : "Check for update"}
                </div>
              </ButtonV2>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
