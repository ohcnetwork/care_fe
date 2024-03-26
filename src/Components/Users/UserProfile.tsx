import { useState, useReducer, lazy, FormEvent } from "react";
import { GENDER_TYPES } from "../../Common/constants";
import { validateEmailAddress } from "../../Common/validation";
import * as Notification from "../../Utils/Notifications.js";
import LanguageSelector from "../../Components/Common/LanguageSelector";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import {
  classNames,
  dateQueryString,
  formatDate,
  isValidUrl,
  parsePhoneNumber,
} from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { GenderType, SkillModel, UpdatePasswordForm } from "../Users/models";
import UpdatableApp, { checkForUpdate } from "../Common/UpdatableApp";
import dayjs from "../../Utils/dayjs";
import useAuthUser, { useAuthContext } from "../../Common/hooks/useAuthUser";
import { PhoneNumberValidator } from "../Form/FieldValidators";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import DateFormField from "../Form/FormFields/DateFormField";
const Loading = lazy(() => import("../Common/Loading"));

type EditForm = {
  firstName: string;
  lastName: string;
  date_of_birth: Date | null | string;
  gender: GenderType;
  email: string;
  video_connect_link: string | undefined;
  phoneNumber: string;
  altPhoneNumber: string;
  user_type: string | undefined;
  doctor_qualification: string | undefined;
  doctor_experience_commenced_on: number | string | undefined;
  doctor_medical_council_registration: string | undefined;
  weekly_working_hours: string | null | undefined;
};
type ErrorForm = {
  firstName: string;
  lastName: string;
  date_of_birth: string | null;
  gender: string;
  email: string;
  video_connect_link: string | undefined;
  phoneNumber: string;
  altPhoneNumber: string;
  user_type: string | undefined;
  doctor_qualification: string | undefined;
  doctor_experience_commenced_on: number | string | undefined;
  doctor_medical_council_registration: string | undefined;
  weekly_working_hours: string | undefined;
};
type State = {
  form: EditForm;
  errors: ErrorForm;
};
type Action =
  | { type: "set_form"; form: EditForm }
  | { type: "set_error"; errors: ErrorForm };

const initForm: EditForm = {
  firstName: "",
  lastName: "",
  date_of_birth: null,
  gender: "Male",
  video_connect_link: "",
  email: "",
  phoneNumber: "",
  altPhoneNumber: "",
  user_type: "",
  doctor_qualification: undefined,
  doctor_experience_commenced_on: undefined,
  doctor_medical_council_registration: undefined,
  weekly_working_hours: undefined,
};

const initError: ErrorForm = Object.assign(
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
  const { signOut } = useAuthContext();
  const [states, dispatch] = useReducer(editFormReducer, initialState);
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

  const {
    data: userData,
    loading: isUserLoading,
    refetch: refetchUserData,
  } = useQuery(routes.getUserDetails, {
    pathParams: { username: authUser.username },
    onResponse: (result) => {
      if (!result || !result.res || !result.data) return;
      const formData: EditForm = {
        firstName: result.data.first_name,
        lastName: result.data.last_name,
        date_of_birth: result.data.date_of_birth || null,
        gender: result.data.gender || "Male",
        email: result.data.email,
        video_connect_link: result.data.video_connect_link,
        phoneNumber: result.data.phone_number?.toString() || "",
        altPhoneNumber: result.data.alt_phone_number?.toString() || "",
        user_type: result.data.user_type,
        doctor_qualification: result.data.doctor_qualification,
        doctor_experience_commenced_on: dayjs().diff(
          dayjs(result.data.doctor_experience_commenced_on),
          "years"
        ),
        doctor_medical_council_registration:
          result.data.doctor_medical_council_registration,
        weekly_working_hours: result.data.weekly_working_hours,
      };
      dispatch({
        type: "set_form",
        form: formData,
      });
    },
  });

  const { data: skillsView, loading: isSkillsLoading } = useQuery(
    routes.userListSkill,
    {
      pathParams: { username: authUser.username },
    }
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
        case "date_of_birth":
          if (!states.form[field]) {
            errors[field] = "Enter a valid date of birth";
            invalidForm = true;
          } else if (
            !dayjs(states.form[field]).isValid() ||
            dayjs(states.form[field]).isAfter(dayjs().subtract(17, "year"))
          ) {
            errors[field] = "Enter a valid date of birth";
            invalidForm = true;
          }
          return;
        case "phoneNumber":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumber(states.form[field]);

          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = PhoneNumberValidator()(phoneNumber) === undefined;
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
            const altPhoneNumber = parsePhoneNumber(states.form[field]);
            if (altPhoneNumber) {
              alt_is_valid =
                PhoneNumberValidator(["mobile"])(altPhoneNumber) === undefined;
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
        case "doctor_experience_commenced_on":
          if (states.form.user_type === "Doctor" && !states.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          } else if (
            (states.form.user_type === "Doctor" &&
              Number(states.form.doctor_experience_commenced_on) >= 100) ||
            Number(states.form.doctor_experience_commenced_on) < 0
          ) {
            errors[field] =
              "Doctor experience should be at least 0 years and less than 100 years.";
            invalidForm = true;
          }
          return;
        case "doctor_qualification":
        case "doctor_medical_council_registration":
          if (states.form.user_type === "Doctor" && !states.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "weekly_working_hours":
          if (
            states.form[field] &&
            (Number(states.form[field]) < 0 ||
              Number(states.form[field]) > 168 ||
              !/^\d+$/.test(states.form[field] ?? ""))
          ) {
            errors[field] =
              "Average weekly working hours must be a number between 0 and 168";
            invalidForm = true;
          }
          return;
        case "video_connect_link":
          if (states.form[field]) {
            if (isValidUrl(states.form[field]) === false) {
              errors[field] = "Please enter a valid url";
              invalidForm = true;
            }
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

  const getDate = (value: any) =>
    value && dayjs(value).isValid() && dayjs(value).toDate();

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
        video_connect_link: states.form.video_connect_link,
        phone_number: parsePhoneNumber(states.form.phoneNumber) ?? "",
        alt_phone_number: parsePhoneNumber(states.form.altPhoneNumber) ?? "",
        gender: states.form.gender,
        date_of_birth: dateQueryString(states.form.date_of_birth),
        doctor_qualification:
          states.form.user_type === "Doctor"
            ? states.form.doctor_qualification
            : undefined,
        doctor_experience_commenced_on:
          states.form.user_type === "Doctor"
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
          states.form.user_type === "Doctor"
            ? states.form.doctor_medical_council_registration
            : undefined,
        weekly_working_hours:
          states.form.weekly_working_hours &&
          states.form.weekly_working_hours !== ""
            ? states.form.weekly_working_hours
            : null,
      };
      const { res } = await request(routes.partialUpdateUser, {
        pathParams: { username: authUser.username },
        body: data,
      });
      if (res?.ok) {
        Notification.Success({
          msg: "Details updated successfully",
        });
        await refetchUserData();
        setShowEdit(false);
      }
    }
  };

  const isLoading = isUserLoading || isSkillsLoading;

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

  const changePassword = async (e: any) => {
    e.preventDefault();
    //validating form
    if (
      changePasswordForm.new_password_1 != changePasswordForm.new_password_2
    ) {
      Notification.Error({
        msg: "Passwords are different in the new and the confirmation column.",
      });
    } else {
      const form: UpdatePasswordForm = {
        old_password: changePasswordForm.old_password,
        username: authUser.username,
        new_password: changePasswordForm.new_password_1,
      };
      const { res, data } = await request(routes.updatePassword, {
        body: form,
      });
      if (res?.ok && data?.message === "Password updated successfully") {
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
    }
  };
  return (
    <div>
      <div className="p-10 lg:p-16">
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
                <ButtonV2
                  onClick={(_) => setShowEdit(!showEdit)}
                  type="button"
                  id="edit-cancel-profile-button"
                >
                  {showEdit ? "Cancel" : "Edit User Profile"}
                </ButtonV2>
                <ButtonV2 variant="danger" onClick={signOut}>
                  <CareIcon icon="l-sign-out-alt" />
                  Sign out
                </ButtonV2>
              </div>
            </div>
          </div>
          <div className="mt-5 lg:col-span-2 lg:mt-0">
            {!showEdit && !isLoading && (
              <div className="m-2 overflow-hidden rounded-lg bg-white px-4 py-5  shadow sm:rounded-lg sm:px-6">
                <dl className="col-gap-4 row-gap-8 grid grid-cols-1 sm:grid-cols-2">
                  <div
                    className="my-2 sm:col-span-1"
                    id="username-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Username
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.username || "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="contactno-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Contact No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.phone_number || "-"}
                    </dd>
                  </div>

                  <div
                    className="my-2  sm:col-span-1"
                    id="whatsapp-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Whatsapp No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.alt_phone_number || "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="emailid-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.email || "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="firstname-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      First Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.first_name || "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="lastname-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Last Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.last_name || "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="date_of_birth-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Date of Birth
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.date_of_birth
                        ? formatDate(userData?.date_of_birth)
                        : "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Access Level
                    </dt>
                    <dd className="badge badge-pill mt-1 bg-primary-500 text-sm text-white">
                      <CareIcon icon="l-user-check" className="mr-1 text-lg" />{" "}
                      {userData?.user_type || "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="gender-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.gender || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Local Body
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.local_body_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      District
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.district_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      State
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.state_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="my-2  sm:col-span-1">
                    <dt className="text-sm font-medium leading-5 text-black">
                      Skills
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      <div
                        className="flex flex-wrap gap-2"
                        id="already-linked-skills"
                      >
                        {skillsView?.results?.length
                          ? skillsView.results?.map((skill: SkillModel) => {
                              return (
                                <span className="flex items-center gap-2 rounded-full border-gray-300 bg-gray-200 px-3 text-xs text-gray-700">
                                  <p className="py-1.5">
                                    {skill.skill_object.name}
                                  </p>
                                </span>
                              );
                            })
                          : "-"}
                      </div>
                    </dd>
                  </div>
                  <div
                    className="my-2  sm:col-span-1"
                    id="averageworkinghour-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Average weekly working hours
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {userData?.weekly_working_hours ?? "-"}
                    </dd>
                  </div>
                  <div
                    className="my-2 sm:col-span-2"
                    id="videoconnectlink-profile-details"
                  >
                    <dt className="text-sm font-medium leading-5 text-black">
                      Video Connect Link
                    </dt>
                    <dd className="mt-1 break-words text-sm leading-5 text-gray-900">
                      {userData?.video_connect_link ? (
                        <a
                          className="text-blue-500"
                          href={userData?.video_connect_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {userData?.video_connect_link}
                        </a>
                      ) : (
                        "-"
                      )}
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
                        <DateFormField
                          {...fieldProps("date_of_birth")}
                          label="Date of Birth"
                          required
                          className="col-span-6 sm:col-span-3"
                          value={getDate(states.form.date_of_birth)}
                          position="LEFT"
                          disableFuture={true}
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
                        {states.form.user_type === "Doctor" && (
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
                          label="Average weekly working hours"
                          className="col-span-6 sm:col-span-3"
                          type="number"
                          min={0}
                          max={168}
                        />
                        <TextFormField
                          {...fieldProps("video_connect_link")}
                          label="Video Conference Link"
                          className="col-span-6 sm:col-span-6"
                          type="url"
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
                  <CareIcon icon="l-exclamation" className="text-2xl" />
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
                    icon="l-sync"
                    className={classNames(
                      "text-2xl",
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
