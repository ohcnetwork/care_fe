import careConfig from "@careConfig";
import { FormEvent, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import AvatarEditModal from "@/components/Common/AvatarEditModal";
import AvatarEditable from "@/components/Common/AvatarEditable";
import ButtonV2, { Submit } from "@/components/Common/ButtonV2";
import LanguageSelector from "@/components/Common/LanguageSelector";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import UpdatableApp, { checkForUpdate } from "@/components/Common/UpdatableApp";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import { validateRule } from "@/components/Users/UserAdd";
import {
  GenderType,
  SkillModel,
  UpdatePasswordForm,
} from "@/components/Users/models";

import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";

import { GENDER_TYPES, LocalStorageKeys } from "@/common/constants";
import { validateEmailAddress } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  dateQueryString,
  formatDate,
  formatDisplayName,
  isValidUrl,
  parsePhoneNumber,
  sleep,
} from "@/Utils/utils";

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
  qualification: string | undefined;
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
  qualification: string | undefined;
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
  qualification: undefined,
  doctor_experience_commenced_on: undefined,
  doctor_medical_council_registration: undefined,
  weekly_working_hours: undefined,
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

export default function UserProfile() {
  const { t } = useTranslation();
  const { signOut, refetchUser } = useAuthContext();
  const [states, dispatch] = useReducer(editFormReducer, initialState);
  const [editAvatar, setEditAvatar] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({
    isChecking: false,
    isUpdateAvailable: false,
  });
  const [dirty, setDirty] = useState<boolean>(false);

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

  const [showEdit, setShowEdit] = useState<boolean>(false);
  const {
    data: userData,
    loading: isUserLoading,
    refetch: refetchUserData,
  } = useQuery(routes.currentUser, {
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
        qualification: result.data.qualification,
        doctor_experience_commenced_on: dayjs().diff(
          dayjs(result.data.doctor_experience_commenced_on),
          "years",
        ),
        doctor_medical_council_registration:
          result.data.doctor_medical_council_registration,
        weekly_working_hours: result.data.weekly_working_hours,
      };
      dispatch({
        type: "set_form",
        form: formData,
      });
      setDirty(false);
    },
  });

  const { data: skillsView, loading: isSkillsLoading } = useQuery(
    routes.userListSkill,
    {
      pathParams: { username: authUser.username },
    },
  );

  const validatePassword = (password: string) => {
    const rules = [
      {
        test: (p: string) => p.length >= 8,
        message: "Password should be at least 8 characters long",
      },
      {
        test: (p: string) => p !== p.toUpperCase(),
        message: "Password should contain at least 1 lowercase letter",
      },
      {
        test: (p: string) => p !== p.toLowerCase(),
        message: "Password should contain at least 1 uppercase letter",
      },
      {
        test: (p: string) => /\d/.test(p),
        message: "Password should contain at least 1 number",
      },
    ];
    return rules.map((rule) =>
      validateRule(rule.test(password), rule.message, !password),
    );
  };

  const validateNewPassword = (password: string) => {
    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      password === password.toUpperCase() ||
      password === password.toLowerCase()
    ) {
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(states.form).forEach((field) => {
      switch (field) {
        case "firstName":
        case "lastName":
        case "gender":
          if (!states.form[field]) {
            errors[field] = t("field_required");
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
            errors[field] = t("field_required");
            invalidForm = true;
          } else if (!validateEmailAddress(states.form[field])) {
            errors[field] = "Enter a valid email address";
            invalidForm = true;
          }
          return;
        case "doctor_experience_commenced_on":
          if (states.form.user_type === "Doctor" && !states.form[field]) {
            errors[field] = t("field_required");
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
        case "qualification":
          if (
            (states.form.user_type === "Doctor" ||
              states.form.user_type === "Nurse") &&
            !states.form[field]
          ) {
            errors[field] = t("field_required");
            invalidForm = true;
          }
          return;
        case "doctor_medical_council_registration":
          if (states.form.user_type === "Doctor" && !states.form[field]) {
            errors[field] = t("field_required");
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
    setDirty(true);
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
        qualification:
          states.form.user_type === "Doctor" ||
          states.form.user_type === "Nurse"
            ? states.form.qualification
            : undefined,
        doctor_experience_commenced_on:
          states.form.user_type === "Doctor"
            ? dayjs()
                .subtract(
                  parseInt(
                    (states.form.doctor_experience_commenced_on as string) ??
                      "0",
                  ),
                  "years",
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
      changePasswordForm.new_password_1 !== changePasswordForm.new_password_2
    ) {
      Notification.Error({
        msg: "Passwords are different in new password and confirmation password column.",
      });
    } else if (!validateNewPassword(changePasswordForm.new_password_1)) {
      Notification.Error({
        msg: "Entered New Password is not valid, please check!",
      });
    } else if (
      changePasswordForm.new_password_1 === changePasswordForm.old_password
    ) {
      Notification.Error({
        msg: "New password is same as old password, Please enter a different new password.",
      });
    } else {
      const form: UpdatePasswordForm = {
        old_password: changePasswordForm.old_password,
        username: authUser.username,
        new_password: changePasswordForm.new_password_1,
      };
      const { res, data, error } = await request(routes.updatePassword, {
        body: form,
      });
      if (res?.ok) {
        Notification.Success({ msg: data?.message });
      } else if (!error) {
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

  const handleAvatarUpload = async (file: File, onError: () => void) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    const url = `${careConfig.apiUrl}/api/v1/users/${authUser.username}/profile_picture/`;

    uploadFile(
      url,
      formData,
      "POST",
      {
        Authorization:
          "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken),
      },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          await sleep(1000);
          refetchUser();
          Notification.Success({ msg: "Profile picture updated." });
          setEditAvatar(false);
        } else {
          onError();
        }
      },
      null,
      () => {
        onError();
      },
    );
  };

  const handleAvatarDelete = async (onError: () => void) => {
    const { res } = await request(routes.deleteProfilePicture, {
      pathParams: { username: authUser.username },
    });
    if (res?.ok) {
      Notification.Success({ msg: "Profile picture deleted" });
      await refetchUser();
      setEditAvatar(false);
    } else {
      onError();
    }
  };

  return (
    <Page
      title={t("personal_information")}
      focusOnLoad={true}
      backUrl="/facility"
    >
      <AvatarEditModal
        title={t("edit_avatar")}
        open={editAvatar}
        imageUrl={authUser?.read_profile_picture_url}
        handleUpload={handleAvatarUpload}
        handleDelete={handleAvatarDelete}
        onClose={() => setEditAvatar(false)}
      />
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-1">
          <p className="my-1 text-sm leading-5 text-secondary-600">
            {t("local_body")}, {t("district")}, {t("state")}{" "}
            {t("are_non_editable_fields")}.
          </p>
          <div className="my-4 flex items-center">
            <AvatarEditable
              id="user-profile-picture"
              imageUrl={authUser?.read_profile_picture_url}
              name={formatDisplayName(authUser)}
              onClick={() => setEditAvatar(!editAvatar)}
              className="h-20 w-20"
            />
            <div className="my-4 ml-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {authUser?.first_name} {authUser?.last_name}
              </h3>
              <p className="text-sm leading-5 text-gray-500">
                @{authUser?.username}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <ButtonV2
              onClick={(_) => setShowEdit(!showEdit)}
              type="button"
              id="edit-cancel-profile-button"
            >
              {showEdit ? t("cancel") : t("edit_user_profile")}
            </ButtonV2>
            <ButtonV2 variant="danger" onClick={signOut}>
              <CareIcon icon="l-sign-out-alt" />
              {t("sign_out")}
            </ButtonV2>
          </div>
        </div>
        <div className="mt-5 lg:col-span-2 lg:mt-0">
          {!showEdit && !isLoading && (
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
              <dl className="col-gap-4 row-gap-8 grid grid-cols-1 sm:grid-cols-2">
                <div
                  className="my-2 sm:col-span-1"
                  id="username-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("username")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.username || "-"}
                  </dd>
                </div>
                <div
                  className="my-2 sm:col-span-1"
                  id="contactno-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("phone_number")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.phone_number || "-"}
                  </dd>
                </div>

                <div
                  className="my-2 sm:col-span-1"
                  id="whatsapp-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("whatsapp_number")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.alt_phone_number || "-"}
                  </dd>
                </div>
                <div
                  className="my-2 sm:col-span-1"
                  id="emailid-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("email")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.email || "-"}
                  </dd>
                </div>
                <div
                  className="my-2 sm:col-span-1"
                  id="firstname-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("first_name")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.first_name || "-"}
                  </dd>
                </div>
                <div
                  className="my-2 sm:col-span-1"
                  id="lastname-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("last_name")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.last_name || "-"}
                  </dd>
                </div>
                <div
                  className="my-2 sm:col-span-1"
                  id="date_of_birth-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("date_of_birth")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.date_of_birth
                      ? formatDate(userData?.date_of_birth)
                      : "-"}
                  </dd>
                </div>
                <div className="my-2 sm:col-span-1">
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("access_level")}
                  </dt>
                  <dd className="badge badge-pill mt-1 bg-primary-500 text-sm text-white">
                    <CareIcon icon="l-user-check" className="mr-2 text-lg" />
                    {userData?.user_type || "-"}
                  </dd>
                </div>
                <div className="my-2 sm:col-span-1" id="gender-profile-details">
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("gender")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.gender || "-"}
                  </dd>
                </div>
                <div className="my-2 sm:col-span-1">
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("local_body")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.local_body_object?.name || "-"}
                  </dd>
                </div>
                <div className="my-2 sm:col-span-1">
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("district")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.district_object?.name || "-"}
                  </dd>
                </div>
                <div className="my-2 sm:col-span-1">
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("state")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.state_object?.name || "-"}
                  </dd>
                </div>
                <div className="my-2 sm:col-span-1">
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("skills")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    <div
                      className="flex flex-wrap gap-2"
                      id="already-linked-skills"
                    >
                      {skillsView?.results?.length
                        ? skillsView.results?.map((skill: SkillModel) => {
                            return (
                              <span className="flex items-center gap-2 rounded-full border-secondary-300 bg-secondary-200 px-3 text-xs text-secondary-700">
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
                  className="my-2 sm:col-span-1"
                  id="averageworkinghour-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("average_weekly_working_hours")}
                  </dt>
                  <dd className="mt-1 text-sm leading-5 text-secondary-900">
                    {userData?.weekly_working_hours ?? "-"}
                  </dd>
                </div>
                <div
                  className="my-2 sm:col-span-2"
                  id="videoconnectlink-profile-details"
                >
                  <dt className="text-sm font-medium leading-5 text-black">
                    {t("video_conference_link")}
                  </dt>
                  <dd className="mt-1 break-words text-sm leading-5 text-secondary-900">
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
                        label={t("first_name")}
                        className="col-span-6 sm:col-span-3"
                      />
                      <TextFormField
                        {...fieldProps("lastName")}
                        required
                        label={t("last_name")}
                        className="col-span-6 sm:col-span-3"
                      />
                      <DateFormField
                        {...fieldProps("date_of_birth")}
                        label={t("date_of_birth")}
                        required
                        className="col-span-6 sm:col-span-3"
                        value={getDate(states.form.date_of_birth)}
                        disableFuture={true}
                      />
                      <SelectFormField
                        {...fieldProps("gender")}
                        label={t("gender")}
                        className="col-span-6 sm:col-span-3"
                        required
                        optionLabel={(o) => o.text}
                        optionValue={(o) => o.text}
                        options={GENDER_TYPES}
                      />
                      <PhoneNumberFormField
                        {...fieldProps("phoneNumber")}
                        label={t("phone_number")}
                        className="col-span-6 sm:col-span-3"
                        required
                        placeholder={t("phone_number")}
                        types={["mobile", "landline"]}
                      />
                      <PhoneNumberFormField
                        {...fieldProps("altPhoneNumber")}
                        label={t("whatsapp_number")}
                        className="col-span-6 sm:col-span-3"
                        placeholder={t("whatsapp_number")}
                        types={["mobile"]}
                      />
                      <TextFormField
                        {...fieldProps("email")}
                        label={t("email")}
                        className="col-span-6 sm:col-span-3"
                        required
                        type="email"
                      />
                      {(states.form.user_type === "Doctor" ||
                        states.form.user_type === "Nurse") && (
                        <TextFormField
                          {...fieldProps("qualification")}
                          required
                          className="col-span-6 sm:col-span-3"
                          label={t("qualification")}
                          placeholder={t("qualification")}
                        />
                      )}
                      {states.form.user_type === "Doctor" && (
                        <>
                          <TextFormField
                            {...fieldProps("doctor_experience_commenced_on")}
                            required
                            className="col-span-6 sm:col-span-3"
                            type="number"
                            min={0}
                            label={t("years_of_experience")}
                            placeholder={t("years_of_experience_of_the_doctor")}
                          />
                          <TextFormField
                            {...fieldProps(
                              "doctor_medical_council_registration",
                            )}
                            required
                            className="col-span-6 sm:col-span-3"
                            label={t("medical_council_registration")}
                            placeholder={t(
                              "doctor_s_medical_council_registration",
                            )}
                          />
                        </>
                      )}
                      <TextFormField
                        {...fieldProps("weekly_working_hours")}
                        label={t("average_weekly_working_hours")}
                        className="col-span-6 sm:col-span-3"
                        type="number"
                        min={0}
                        max={168}
                      />
                      <TextFormField
                        {...fieldProps("video_connect_link")}
                        label={t("video_conference_link")}
                        className="col-span-6 sm:col-span-6"
                        type="url"
                      />
                    </div>
                  </div>
                  <div className="bg-secondary-50 px-4 py-3 text-right sm:px-6">
                    <Submit
                      onClick={handleSubmit}
                      label={t("update")}
                      disabled={!dirty}
                    />
                  </div>
                </div>
              </form>
              <form action="#" method="POST">
                <div className="overflow-hidden shadow sm:rounded-md">
                  <div className="bg-white px-4 pt-5">
                    <div className="grid grid-cols-6 gap-4">
                      <TextFormField
                        name="old_password"
                        label={t("current_password")}
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
                      <div className="col-span-6 sm:col-span-3">
                        <TextFormField
                          name="new_password_1"
                          label={t("new_password")}
                          type="password"
                          value={changePasswordForm.new_password_1}
                          className="peer col-span-6 sm:col-span-3"
                          onChange={(e) => {
                            setChangePasswordForm({
                              ...changePasswordForm,
                              new_password_1: e.value,
                            });
                          }}
                          required
                        />
                        <div className="text-small mb-2 hidden pl-2 text-secondary-500 peer-focus-within:block">
                          {validatePassword(changePasswordForm.new_password_1)}
                        </div>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <TextFormField
                          name="new_password_2"
                          label={t("new_password_confirmation")}
                          className="peer col-span-6 sm:col-span-3"
                          type="password"
                          value={changePasswordForm.new_password_2}
                          onChange={(e) => {
                            setChangePasswordForm({
                              ...changePasswordForm,
                              new_password_2: e.value,
                            });
                          }}
                        />
                        {changePasswordForm.new_password_2.length > 0 && (
                          <div className="text-small mb-2 hidden pl-2 text-secondary-500 peer-focus-within:block">
                            {validateRule(
                              changePasswordForm.new_password_1 ===
                                changePasswordForm.new_password_2,
                              "Confirm password should match the new password",
                              !changePasswordForm.new_password_2,
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-secondary-50 px-4 py-3 text-right sm:px-6">
                    <Submit
                      onClick={changePassword}
                      label={t("change_password")}
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
            <h3 className="text-lg font-medium leading-6 text-secondary-900">
              {t("language_selection")}
            </h3>
            <p className="mt-1 text-sm leading-5 text-secondary-600">
              {t("set_your_local_language")}
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
            <h3 className="text-lg font-medium leading-6 text-secondary-900">
              {t("software_update")}
            </h3>
            <p className="mt-1 text-sm leading-5 text-secondary-600">
              {t("check_for_available_update")}
            </p>
          </div>
        </div>
        {updateStatus.isUpdateAvailable && (
          <UpdatableApp silentlyAutoUpdate={false}>
            <ButtonV2 disabled={true}>
              <div className="flex items-center gap-4">
                <CareIcon icon="l-exclamation" className="text-2xl" />
                {t("update_available")}
              </div>
            </ButtonV2>
          </UpdatableApp>
        )}
        <div className="mt-5 md:col-span-2 md:mt-0">
          {!updateStatus.isUpdateAvailable && (
            <ButtonV2 disabled={updateStatus.isChecking} onClick={checkUpdates}>
              {" "}
              <div className="flex items-center gap-4">
                <CareIcon
                  icon="l-sync"
                  className={classNames(
                    "text-2xl",
                    updateStatus.isChecking && "animate-spin",
                  )}
                />
                {updateStatus.isChecking
                  ? t("checking_for_update")
                  : t("check_for_update")}
              </div>
            </ButtonV2>
          )}
        </div>
      </div>
    </Page>
  );
}
