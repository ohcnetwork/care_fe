import { useState, useReducer, useRef } from "react";
import { GENDER_TYPES, LocalStorageKeys } from "@/common/constants";
import { validateEmailAddress } from "@/common/validation";
import * as Notification from "../../Utils/Notifications";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import {
  dateQueryString,
  formatDisplayName,
  isValidUrl,
  parsePhoneNumber,
  sleep,
} from "@/Utils/utils";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { GenderType } from "./models";
import dayjs from "../../Utils/dayjs";
import {
  FieldError,
  PhoneNumberValidator,
  RequiredFieldValidator,
} from "../Form/FieldValidators";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import DateFormField from "../Form/FormFields/DateFormField";
import { useTranslation } from "react-i18next";
import Loading from "@/components/Common/Loading";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
import uploadFile from "@/Utils/request/uploadFile";
import careConfig from "@careConfig";
import { Avatar } from "../Common/Avatar";
import Form from "../Form/Form";
import RadioFormField from "../Form/FormFields/RadioFormField";

type EditForm = {
  firstName: string;
  lastName: string;
  date_of_birth: Date | null | string;
  gender: GenderType;
  email: string;
  video_connect_link: string | undefined;
  phoneNumber: string;
  altPhoneNumber: string;
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

export default function UserInformation({ username }: { username: string }) {
  const { t } = useTranslation();
  const [states, dispatch] = useReducer(editFormReducer, initialState);
  const formVals = useRef(initForm);
  const [editAvatar, setEditAvatar] = useState(false);

  const {
    data: userData,
    loading: isLoading,
    refetch: refetchUserData,
  } = useQuery(routes.getUserDetails, {
    pathParams: {
      username,
    },
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
        weekly_working_hours: result.data.weekly_working_hours,
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
        case "firstName":
        case "lastName":
        case "gender":
          errors[field] = RequiredFieldValidator()(states.form[field]);
          return;
        case "date_of_birth":
          if (!states.form[field]) {
            errors[field] = "Enter a valid date of birth";
          } else if (
            !dayjs(states.form[field]).isValid() ||
            dayjs(states.form[field]).isAfter(dayjs().subtract(17, "year"))
          ) {
            errors[field] = "Enter a valid date of birth";
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
          }
          return;
        case "email":
          if (!states.form[field]) {
            errors[field] = t("field_required");
          } else if (!validateEmailAddress(states.form[field])) {
            errors[field] = "Enter a valid email address";
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
          }
          return;
        case "video_connect_link":
          if (states.form[field]) {
            if (isValidUrl(states.form[field]) === false) {
              errors[field] = "Please enter a valid url";
            }
          }
          return;
      }
    });
    return errors;
  };

  const getDate = (value: any) =>
    value && dayjs(value).isValid() && dayjs(value).toDate();

  const handleCancel = () => {
    dispatch({
      type: "set_form",
      form: formVals.current,
    });
  };

  if (isLoading || !userData) {
    return <Loading />;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const data = {
      username: userData.username,
      first_name: states.form.firstName,
      last_name: states.form.lastName,
      email: states.form.email,
      video_connect_link: states.form.video_connect_link,
      phone_number: parsePhoneNumber(states.form.phoneNumber) ?? "",
      alt_phone_number: parsePhoneNumber(states.form.altPhoneNumber) ?? "",
      gender: states.form.gender,
      date_of_birth: dateQueryString(states.form.date_of_birth),
      weekly_working_hours:
        states.form.weekly_working_hours &&
        states.form.weekly_working_hours !== ""
          ? states.form.weekly_working_hours
          : null,
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

  const handleAvatarUpload = async (file: File, onError: () => void) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    const url = `${careConfig.apiUrl}/api/v1/users/${userData.username}/profile_picture/`;

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
          refetchUserData();
          Notification.Success({ msg: "Profile picture updated." });
          setEditAvatar(false);
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
      pathParams: { username },
    });
    if (res?.ok) {
      Notification.Success({ msg: "Profile picture deleted" });
      await refetchUserData();
      setEditAvatar(false);
    } else {
      onError();
    }
  };

  return (
    <>
      <AvatarEditModal
        title={t("edit_avatar")}
        open={editAvatar}
        imageUrl={userData?.read_profile_picture_url}
        handleUpload={handleAvatarUpload}
        handleDelete={handleAvatarDelete}
        onClose={() => setEditAvatar(false)}
      />
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
        <div className="my-4 flex justify-between">
          <div className="flex items-center">
            <Avatar
              imageUrl={userData?.read_profile_picture_url}
              name={formatDisplayName(userData)}
              className="h-20 w-20"
            />
            <div className="my-4 ml-4 flex flex-col gap-2">
              <ButtonV2
                onClick={(_) => setEditAvatar(!editAvatar)}
                type="button"
                id="edit-cancel-profile-button"
                className="border border-gray-200 bg-gray-50 text-black hover:bg-gray-100"
                shadow={false}
              >
                {t("change_avatar")}
              </ButtonV2>
              <p className="text-xs leading-5 text-gray-500">
                {t("change_avatar_note")}
              </p>
            </div>
          </div>
        </div>
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
                    <TextFormField
                      {...field("firstName")}
                      required
                      label={t("first_name")}
                      className="flex-1"
                    />
                    <TextFormField
                      {...field("lastName")}
                      required
                      label={t("last_name")}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-x-3 sm:flex-row sm:items-center">
                    <DateFormField
                      {...field("date_of_birth")}
                      label={t("date_of_birth")}
                      required
                      value={getDate(states.form.date_of_birth)}
                      position="LEFT"
                      disableFuture={true}
                      className="flex-1"
                    />
                    <RadioFormField
                      {...field("gender")}
                      label={t("gender")}
                      className="flex-1"
                      required
                      optionLabel={(o) => o.text}
                      optionValue={(o) => o.text}
                      options={GENDER_TYPES}
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                    <PhoneNumberFormField
                      {...field("phoneNumber")}
                      label={t("phone_number")}
                      className="flex-1"
                      required
                      placeholder={t("phone_number")}
                      types={["mobile", "landline"]}
                    />
                    <PhoneNumberFormField
                      {...field("altPhoneNumber")}
                      label={t("whatsapp_number")}
                      className="flex-1"
                      placeholder={t("whatsapp_number")}
                      types={["mobile"]}
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                    <TextFormField
                      {...field("email")}
                      label={t("email")}
                      className="flex-1"
                      required
                      type="email"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                    <TextFormField
                      {...field("weekly_working_hours")}
                      label={t("average_weekly_working_hours")}
                      className="flex-1"
                      type="number"
                      min={0}
                      max={168}
                    />
                    <TextFormField
                      {...field("video_connect_link")}
                      label={t("video_conference_link")}
                      className="flex-1"
                      type="url"
                    />
                  </div>
                </>
              )}
            </Form>
          </div>
        )}
      </div>
    </>
  );
}
