import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";
import {
  GENDER_TYPES,
  USER_TYPES,
  USER_TYPE_OPTIONS,
} from "@/common/constants";
import { useAbortableEffect } from "@/common/utils";
import {
  validateEmailAddress,
  validateName,
  validatePassword,
  validateUsername,
} from "@/common/validation";
import * as Notification from "../../Utils/Notifications";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import {
  classNames,
  dateQueryString,
  isValidUrl,
  parsePhoneNumber,
  scrollTo,
} from "../../Utils/utils";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import DateFormField from "../Form/FormFields/DateFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
import useAppHistory from "@/common/hooks/useAppHistory";
import CircularProgress from "@/components/Common/components/CircularProgress";
import { useAutoSaveReducer } from "../../Utils/AutoSave";
import dayjs from "../../Utils/dayjs";
import useAuthUser from "@/common/hooks/useAuthUser";
import { FieldError, PhoneNumberValidator } from "../Form/FieldValidators";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import useQuery from "../../Utils/request/useQuery";
import CareIcon from "../../CAREUI/icons/CareIcon";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { GenderType } from "./models";
import Form from "../Form/Form";
interface UserProps {
  username?: string;
}

interface StateObj {
  id: number;
  name: string;
}

type UserForm = {
  user_type?: string;
  gender: string;
  password?: string;
  c_password?: string;
  facilities?: Array<string>;
  home_facility?: FacilityModel | null;
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  phone_number_is_whatsapp?: boolean;
  date_of_birth: Date | null | string;
  state?: number;
  district?: number;
  local_body?: number;
  qualification?: string | undefined;
  doctor_experience_commenced_on?: string | undefined;
  doctor_medical_council_registration?: string | undefined;
  video_connect_link?: string;
  weekly_working_hours?: string | null;
};

const initForm: UserForm = {
  user_type: "",
  gender: "",
  password: "",
  c_password: "",
  facilities: [],
  home_facility: null,
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "+91",
  alt_phone_number: "+91",
  phone_number_is_whatsapp: true,
  date_of_birth: null,
  state: 0,
  district: 0,
  local_body: 0,
  qualification: undefined,
  doctor_experience_commenced_on: undefined,
  doctor_medical_council_registration: undefined,
  weekly_working_hours: "",
  video_connect_link: "",
};

const STAFF_OR_NURSE_USER = [
  "Staff",
  "StaffReadOnly",
  "Nurse",
  "NurseReadOnly",
];

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const user_create_reducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_errors": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    case "set_state": {
      if (action.state) return action.state;
      return state;
    }
    default:
      return state;
  }
};

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

export const validateRule = (
  condition: boolean,
  content: JSX.Element | string,
) => {
  return (
    <div>
      {condition ? (
        <CareIcon icon="l-check-circle" className="text-xl text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
      )}{" "}
      <span
        className={classNames(condition ? "text-primary-500" : "text-red-500")}
      >
        {content}
      </span>
    </div>
  );
};

const UserAddEditForm = (props: UserProps) => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const { username } = props;
  const editUser = username ? true : false;
  const formVals = useRef(initForm);

  const {
    loading: userDataLoading,
    data: userData,
    refetch: refetchUserData,
  } = useQuery(routes.getUserDetails, {
    pathParams: {
      username: username ?? "",
    },
    prefetch: editUser,
    onResponse: (result) => {
      if (!editUser || !result || !result.res || !result.data) return;
      const formData: UserForm = {
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        date_of_birth: result.data.date_of_birth || null,
        gender: result.data.gender || "Male",
        email: result.data.email,
        video_connect_link: result.data.video_connect_link,
        phone_number: result.data.phone_number?.toString() || "",
        alt_phone_number: result.data.alt_phone_number?.toString() || "",
        weekly_working_hours: result.data.weekly_working_hours,
      };
      dispatch({
        type: "set_form",
        form: formData,
      });
      formVals.current = formData;
    },
  });

  const handleEditSubmit = async (formData: UserForm) => {
    if (!username) return;
    const data = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      video_connect_link: formData.video_connect_link,
      phone_number: parsePhoneNumber(formData.phone_number) ?? "",
      alt_phone_number: parsePhoneNumber(formData.alt_phone_number) ?? "",
      gender: formData.gender as GenderType,
      date_of_birth: dateQueryString(formData.date_of_birth),
      qualification:
        formData.user_type === "Doctor" || formData.user_type === "Nurse"
          ? formData.qualification
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
          ? formData.doctor_medical_council_registration
          : undefined,
      weekly_working_hours:
        formData.weekly_working_hours && formData.weekly_working_hours !== ""
          ? formData.weekly_working_hours
          : null,
    };
    const { res } = await request(routes.partialUpdateUser, {
      pathParams: { username },
      body: data,
    });
    if (res?.ok) {
      Notification.Success({
        msg: "Details updated successfully",
      });
      await refetchUserData();
    }
  };

  const [state, dispatch] = useAutoSaveReducer<UserForm>(
    user_create_reducer,
    initialState,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<StateObj[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number>(0);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [districts, setDistricts] = useState<StateObj[]>([]);
  const [localBodies, setLocalBodies] = useState<StateObj[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel[]>([]);
  const [usernameInputInFocus, setUsernameInputInFocus] = useState(false);
  const [passwordInputInFocus, setPasswordInputInFocus] = useState(false);
  const [confirmPasswordInputInFocus, setConfirmPasswordInputInFocus] =
    useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const userExistsEnums = {
    idle: 0,
    checking: 1,
    exists: 2,
    available: 3,
  };

  const [usernameExists, setUsernameExists] = useState<number>(0);

  const check_username = async (username: string) => {
    setUsernameExists(userExistsEnums.checking);
    const { res: usernameCheck } = await request(routes.checkUsername, {
      pathParams: { username },
      silent: true,
    });
    if (usernameCheck === undefined || usernameCheck.status === 409)
      setUsernameExists(userExistsEnums.exists);
    else if (usernameCheck.status === 200)
      setUsernameExists(userExistsEnums.available);
    else
      Notification.Error({
        msg: "Some error checking username availabality. Please try again later.",
      });
  };

  useEffect(() => {
    setUsernameExists(userExistsEnums.idle);
    if (validateUsername(usernameInput)) {
      const timeout = setTimeout(() => {
        check_username(usernameInput);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [usernameInput]);

  const authUser = useAuthUser();

  const userIndex = USER_TYPES.indexOf(authUser.user_type);
  const readOnlyUsers = USER_TYPE_OPTIONS.filter((user) => user.readOnly);

  const defaultAllowedUserTypes = USER_TYPE_OPTIONS.slice(0, userIndex + 1);
  const userTypes = authUser.is_superuser
    ? [...USER_TYPE_OPTIONS]
    : authUser.user_type === "StaffReadOnly"
      ? readOnlyUsers.slice(0, 1)
      : authUser.user_type === "DistrictReadOnlyAdmin"
        ? readOnlyUsers.slice(0, 2)
        : authUser.user_type === "StateReadOnlyAdmin"
          ? readOnlyUsers.slice(0, 3)
          : authUser.user_type === "Pharmacist"
            ? USER_TYPE_OPTIONS.slice(0, 1)
            : // Exception to allow Staff to Create Doctors
              defaultAllowedUserTypes;

  // TODO: refactor lines 227 through 248 to be more readable. This is messy.
  if (authUser.user_type === "Nurse" || authUser.user_type === "Staff") {
    userTypes.push(USER_TYPE_OPTIONS[6]); // Temperorily allows creation of users with elevated permissions due to introduction of new roles.
  }

  const showLocalbody = ![
    "Pharmacist",
    "Volunteer",
    "Doctor",
    ...STAFF_OR_NURSE_USER,
  ].includes(state.form.user_type ?? "");

  const { loading: isDistrictLoading } = useQuery(routes.getDistrictByState, {
    prefetch: !!(selectedStateId > 0),
    pathParams: { id: selectedStateId.toString() },
    onResponse: (result) => {
      if (!result || !result.res || !result.data) return;
      if (userIndex <= USER_TYPES.indexOf("DistrictAdmin")) {
        setDistricts([authUser.district_object!]);
      } else {
        setDistricts(result.data);
      }
    },
  });

  const { loading: isLocalbodyLoading } = useQuery(
    routes.getAllLocalBodyByDistrict,
    {
      prefetch: !!(selectedDistrictId > 0),
      pathParams: { id: selectedDistrictId.toString() },
      onResponse: (result) => {
        if (!result || !result.res || !result.data) return;
        if (userIndex <= USER_TYPES.indexOf("LocalBodyAdmin")) {
          setLocalBodies([authUser.local_body_object!]);
        } else {
          setLocalBodies(result.data);
        }
      },
    },
  );

  const { loading: isStateLoading } = useQuery(routes.statesList, {
    onResponse: (result) => {
      if (!result || !result.res || !result.data) return;
      if (userIndex <= USER_TYPES.indexOf("StateAdmin")) {
        setStates([authUser.state_object!]);
      } else {
        setStates(result.data.results);
      }
    },
  });

  const handleDateChange = (e: FieldChangeEvent<Date>, field?: any) => {
    if (dayjs(e.value).isValid()) {
      const errors = { ...state.errors, [e.name]: "" };
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [e.name]: dayjs(e.value).format("YYYY-MM-DD"),
        },
      });
      if (field) field(e.name).onChange(e);
      dispatch({ type: "set_errors", errors });
    }
  };

  const handleFieldChange = (event: FieldChangeEvent<unknown>, field?: any) => {
    const errors = { ...state.errors, [event.name]: "" };
    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        [event.name]: event.value,
      },
    });
    dispatch({ type: "set_errors", errors });
    if (field) field(event.name).onChange(event);
  };

  useAbortableEffect(() => {
    if (state.form.phone_number_is_whatsapp) {
      handleFieldChange({
        name: "alt_phone_number",
        value: state.form.phone_number,
      });
    }
  }, [state.form.phone_number_is_whatsapp, state.form.phone_number]);

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    const newSelectedFacilities = selected
      ? Array.isArray(selected)
        ? selected
        : [selected]
      : [];
    setSelectedFacility(newSelectedFacilities as FacilityModel[]);
    const form = { ...state.form };
    form.facilities = selected
      ? (selected as FacilityModel[]).map((i) => i.id!)
      : [];
    dispatch({ type: "set_form", form });
  };

  const validateForm = (formData: UserForm) => {
    const errors: Partial<Record<keyof UserForm, FieldError>> = {};
    Object.keys(formData).forEach((field) => {
      switch (field) {
        case "facilities":
          if (
            formData.facilities &&
            formData.user_type &&
            formData["facilities"].length === 0 &&
            STAFF_OR_NURSE_USER.includes(authUser.user_type) &&
            STAFF_OR_NURSE_USER.includes(formData.user_type)
          ) {
            errors[field] =
              "Please select atleast one of the facilities you are linked to";
          }
          return;
        case "user_type":
          if (!formData[field]) {
            errors[field] = "Please select the User Type";
          }
          return;
        case "doctor_experience_commenced_on":
          if (formData.user_type === "Doctor" && !formData[field]) {
            errors[field] = t("field_required");
          } else if (
            formData.user_type === "Doctor" &&
            Number(formData.doctor_experience_commenced_on) > 100
          ) {
            errors[field] = "Doctor experience should be less than 100 years";
          }
          return;
        case "qualification":
          if (
            (formData.user_type === "Doctor" ||
              formData.user_type === "Nurse") &&
            !formData[field]
          ) {
            errors[field] = t("field_required");
          }
          return;
        case "doctor_medical_council_registration":
          if (formData.user_type === "Doctor" && !formData[field]) {
            errors[field] = t("field_required");
          }
          return;
        case "first_name":
        case "last_name":
          formData[field] = formData[field].trim();
          if (!formData[field]) {
            errors[field] = `${field
              .split("_")
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" ")} is required`;
          } else if (!validateName(formData[field])) {
            errors[field] = "Please enter a valid name";
          }
          return;
        case "gender":
          if (!formData[field]) {
            errors[field] = "Please select the Gender";
          }
          return;
        case "username":
          if (!formData[field]) {
            errors[field] = "Please enter the username";
          } else if (!validateUsername(formData[field])) {
            errors[field] =
              "Please enter a 4-16 characters long username with lowercase letters, digits and . _ - only and it should not start or end with . _ -";
          } else if (usernameExists !== userExistsEnums.available) {
            errors[field] = "This username already exists";
          }
          return;
        case "password":
          if (!formData[field]) {
            errors[field] = "Please enter the password";
          } else if (!validatePassword(formData[field])) {
            errors.password =
              "Password should have 1 lowercase letter, 1 uppercase letter, 1 number, and be at least 8 characters long";
          }
          return;
        case "c_password":
          if (!formData.password) {
            errors.c_password = "Confirm password is required";
          } else if (formData.password !== formData.c_password) {
            errors.c_password = "Passwords not matching";
          }
          return;
        case "phone_number":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumber(formData[field]);
          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = PhoneNumberValidator()(phoneNumber) === undefined;
          }
          if (!formData[field] || !is_valid) {
            errors[field] = "Please enter valid phone number";
          }
          return;

        case "alt_phone_number":
          // eslint-disable-next-line no-case-declarations
          let alt_is_valid = false;
          if (formData[field] && formData[field] !== "+91") {
            const altPhoneNumber = parsePhoneNumber(formData[field]);
            if (altPhoneNumber) {
              alt_is_valid =
                PhoneNumberValidator(["mobile"])(altPhoneNumber) === undefined;
            }
          }
          if (formData[field] && formData[field] !== "+91" && !alt_is_valid) {
            errors[field] = "Please enter valid mobile number";
          }
          return;
        case "email":
          formData[field] = formData[field].trim();
          if (
            formData[field].length === 0 ||
            !validateEmailAddress(formData[field])
          ) {
            errors[field] = "Please enter a valid email address";
          }
          return;
        case "date_of_birth":
          if (!formData[field]) {
            errors[field] = "Please enter date in DD/MM/YYYY format";
          } else if (
            dayjs(formData[field]).isAfter(dayjs().subtract(1, "year"))
          ) {
            errors[field] = "Enter a valid date of birth";
          }
          return;
        case "state":
          if (!Number(formData[field])) {
            errors[field] = "Please select the state";
          }
          return;
        case "district":
          if (!Number(formData[field])) {
            errors[field] = "Please select the district";
          }
          return;
        case "local_body":
          if (showLocalbody && !Number(formData[field])) {
            errors[field] = "Please select the local body";
          }
          return;
        case "weekly_working_hours":
          if (
            formData[field] &&
            (Number(formData[field]) < 0 ||
              Number(formData[field]) > 168 ||
              !/^\d+$/.test(formData[field] ?? ""))
          ) {
            errors[field] =
              "Average weekly working hours must be a number between 0 and 168";
          }
          return;
        case "video_connect_link":
          if (formData[field]) {
            if (isValidUrl(formData[field]) === false) {
              errors[field] = "Please enter a valid url";
            }
          }
          return;

        default:
          return;
      }
    });

    const firstError = Object.values(errors).find((e) => e);
    if (firstError) {
      scrollTo(firstError);
    }
    dispatch({ type: "set_errors", errors });
    return errors;
  };

  const handleSubmit = async (formData: UserForm) => {
    setIsLoading(true);
    const data = {
      user_type: formData.user_type,
      gender: formData.gender,
      password: formData.password,
      facilities: formData.facilities ? formData.facilities : undefined,
      home_facility: formData.home_facility ?? undefined,
      username: formData.username,
      first_name: formData.first_name ? formData.first_name : undefined,
      last_name: formData.last_name ? formData.last_name : undefined,
      email: formData.email,
      state: formData.state,
      district: formData.district,
      local_body: showLocalbody ? formData.local_body : null,
      phone_number:
        formData.phone_number === "+91"
          ? ""
          : parsePhoneNumber(formData.phone_number),
      alt_phone_number:
        parsePhoneNumber(
          formData.phone_number_is_whatsapp
            ? formData.phone_number === "+91"
              ? ""
              : formData.phone_number
            : formData.alt_phone_number === "+91"
              ? ""
              : formData.alt_phone_number,
        ) ?? "",
      date_of_birth: dateQueryString(formData.date_of_birth),
      qualification:
        formData.user_type === "Doctor" || formData.user_type == "Nurse"
          ? formData.qualification
          : undefined,
      doctor_experience_commenced_on:
        formData.user_type === "Doctor"
          ? dayjs()
              .subtract(
                parseInt(formData.doctor_experience_commenced_on ?? "0"),
                "years",
              )
              .format("YYYY-MM-DD")
          : undefined,
      doctor_medical_council_registration:
        formData.user_type === "Doctor"
          ? formData.doctor_medical_council_registration
          : undefined,
    };

    const { res } = await request(routes.addUser, {
      body: data,
    });
    if (res?.ok) {
      dispatch({ type: "set_form", form: initForm });
      if (!username) {
        Notification.Success({
          msg: "User added successfully",
        });
      } else {
        Notification.Success({
          msg: "User updated successfully",
        });
      }
      navigate("/users");
    }
    setIsLoading(false);
  };

  if (isLoading || (editUser && userDataLoading)) {
    return <Loading />;
  }

  const handleCancel = () => {
    dispatch({
      type: "set_form",
      form: formVals.current,
    });
  };

  return (
    <Form<UserForm>
      disabled={isLoading}
      defaults={userData ? state.form : initForm}
      validate={validateForm}
      onCancel={editUser ? handleCancel : () => goBack()}
      onSubmit={editUser ? handleEditSubmit : handleSubmit}
      onDraftRestore={(newState) => {
        dispatch({ type: "set_state", state: newState });
      }}
      hideRestoreDraft={editUser}
      noPadding
      resetFormVals
    >
      {(field) => (
        <>
          <div className="my-4 flex flex-col gap-y-2">
            {!editUser && (
              <div className="w-full">
                <FieldLabel>Facilities</FieldLabel>
                <FacilitySelect
                  multiple={true}
                  name="facilities"
                  selected={selectedFacility}
                  setSelected={setFacility}
                  errors={state.errors.facilities}
                  showAll={false}
                />
              </div>
            )}
            {!editUser && (
              <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                <SelectFormField
                  {...field("user_type")}
                  required
                  label="User Type"
                  options={userTypes}
                  optionLabel={(o) =>
                    o.role + (o.readOnly ? " (Read Only)" : "")
                  }
                  onChange={(e) => {
                    handleFieldChange(e, field);
                  }}
                  optionValue={(o) => o.id}
                  className="flex-1"
                />
                <SelectFormField
                  {...field("home_facility")}
                  label="Home facility"
                  options={selectedFacility ?? []}
                  optionLabel={(option) => option.name}
                  optionValue={(option) => option.id}
                  onChange={(e) => {
                    handleFieldChange(e, field);
                  }}
                  className="flex-1"
                />
              </div>
            )}
            {(state.form.user_type === "Doctor" ||
              state.form.user_type === "Nurse") && (
              <TextFormField
                {...field("qualification")}
                required
                label={t("qualification")}
                placeholder={t("qualification")}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                className="flex-1"
              />
            )}
            {state.form.user_type === "Doctor" && (
              <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                <TextFormField
                  {...field("doctor_experience_commenced_on")}
                  required
                  min={0}
                  type="number"
                  label="Years of experience"
                  placeholder="Years of experience of the Doctor"
                  onChange={(e) => {
                    handleFieldChange(e, field);
                  }}
                  className="flex-1"
                />

                <TextFormField
                  {...field("doctor_medical_council_registration")}
                  required
                  label="Medical Council Registration"
                  placeholder="Doctor's medical council registration number"
                  onChange={(e) => {
                    handleFieldChange(e, field);
                  }}
                  className="flex-1"
                />
              </div>
            )}

            <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
              <div className="flex flex-1 flex-col">
                <PhoneNumberFormField
                  {...field("phone_number")}
                  placeholder="Phone Number"
                  label="Phone Number"
                  required
                  types={["mobile", "landline"]}
                  onChange={(e) => {
                    handleFieldChange(e, field);
                  }}
                  className=""
                />
                {!editUser && (
                  <CheckBoxFormField
                    name="phone_number_is_whatsapp"
                    value={state.form.phone_number_is_whatsapp}
                    onChange={(e) => {
                      handleFieldChange(e, field);
                    }}
                    label="Is the phone number a WhatsApp number?"
                  />
                )}
              </div>
              <PhoneNumberFormField
                {...field("alt_phone_number")}
                placeholder="WhatsApp Phone Number"
                label="Whatsapp Number"
                disabled={state.form.phone_number_is_whatsapp}
                types={["mobile"]}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                className="flex-1"
              />
            </div>

            <div>
              {!editUser && (
                <TextFormField
                  {...field("username")}
                  label="Username"
                  placeholder="Username"
                  required
                  autoComplete="new-username"
                  value={usernameInput}
                  onChange={(e) => {
                    handleFieldChange(e, field);
                    setUsernameInput(e.value);
                  }}
                  onFocus={() => setUsernameInputInFocus(true)}
                  onBlur={() => {
                    setUsernameInputInFocus(false);
                  }}
                />
              )}
              {!editUser && usernameInputInFocus && (
                <div className="text-small pl-2 text-secondary-500">
                  <div>
                    {usernameExists !== userExistsEnums.idle && (
                      <>
                        {usernameExists === userExistsEnums.checking ? (
                          <span>
                            <CareIcon
                              icon="l-record-audio"
                              className="text-xl"
                            />{" "}
                            checking...
                          </span>
                        ) : (
                          <>
                            {usernameExists === userExistsEnums.exists ? (
                              <div>
                                <CareIcon
                                  icon="l-times-circle"
                                  className="text-xl text-red-500"
                                />{" "}
                                <span className="text-red-500">
                                  Username is not available
                                </span>
                              </div>
                            ) : (
                              <div>
                                <CareIcon
                                  icon="l-check-circle"
                                  className="text-xl text-green-500"
                                />{" "}
                                <span className="text-primary-500">
                                  Username is available
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    {validateRule(
                      usernameInput.length >= 4 && usernameInput.length <= 16,
                      "Username should be 4-16 characters long",
                    )}
                  </div>
                  <div>
                    {validateRule(
                      /^[a-z0-9._-]*$/.test(usernameInput),
                      "Username can only contain lowercase letters, numbers, and . _ -",
                    )}
                  </div>
                  <div>
                    {validateRule(
                      /^[a-z0-9].*[a-z0-9]$/i.test(usernameInput),
                      "Username must start and end with a letter or number",
                    )}
                  </div>
                  <div>
                    {validateRule(
                      !/(?:[._-]{2,})/.test(usernameInput),
                      "Username can't contain consecutive special characters . _ -",
                    )}
                  </div>
                </div>
              )}
            </div>

            {!editUser && (
              <>
                <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                  <div className="flex flex-1 flex-col">
                    <TextFormField
                      {...field("password")}
                      label="Password"
                      placeholder="Password"
                      required
                      autoComplete="new-password"
                      type="password"
                      onFocus={() => setPasswordInputInFocus(true)}
                      onBlur={() => setPasswordInputInFocus(false)}
                      onChange={(e) => {
                        handleFieldChange(e, field);
                      }}
                    />
                    {passwordInputInFocus && state.form.password && (
                      <div className="text-small pl-2 text-secondary-500">
                        {validateRule(
                          state.form.password.length >= 8,
                          "Password should be atleast 8 characters long",
                        )}
                        {validateRule(
                          state.form.password !==
                            state.form.password.toUpperCase(),
                          "Password should contain at least 1 lowercase letter",
                        )}
                        {validateRule(
                          state.form.password !==
                            state.form.password.toLowerCase(),
                          "Password should contain at least 1 uppercase letter",
                        )}
                        {validateRule(
                          /\d/.test(state.form.password),
                          "Password should contain at least 1 number",
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <TextFormField
                      {...field("c_password")}
                      label="Confirm Password"
                      placeholder="Confirm Password"
                      required
                      type="password"
                      autoComplete="off"
                      onFocus={() => setConfirmPasswordInputInFocus(true)}
                      onBlur={() => setConfirmPasswordInputInFocus(false)}
                      onChange={(e) => {
                        handleFieldChange(e, field);
                      }}
                    />
                    {confirmPasswordInputInFocus &&
                      state.form.c_password &&
                      state.form.c_password.length > 0 &&
                      validateRule(
                        state.form.c_password === state.form.password,
                        "Confirm password should match the entered password",
                      )}
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
              <TextFormField
                {...field("first_name")}
                required
                label={t("first_name")}
                className="flex-1"
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
              />
              <TextFormField
                {...field("last_name")}
                required
                label={t("last_name")}
                className="flex-1"
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
              />
            </div>
            <TextFormField
              {...field("email")}
              label={t("email")}
              placeholder="Email"
              required
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
            />
            <div className="flex flex-col justify-between gap-x-3 sm:flex-row sm:items-center">
              <DateFormField
                {...field("date_of_birth")}
                label="Date of Birth"
                required
                value={getDate(state.form.date_of_birth)}
                onChange={(e) => {
                  handleDateChange(e, field);
                }}
                position="LEFT"
                disableFuture
                className="flex-1"
              />
              <SelectFormField
                {...field("gender")}
                label={t("gender")}
                required
                value={state.form.gender}
                options={GENDER_TYPES}
                optionLabel={(o) => o.text}
                optionValue={(o) => o.text}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                className="flex-1"
              />
            </div>

            {editUser && (
              <>
                <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
                  <TextFormField
                    {...field("weekly_working_hours")}
                    label={t("average_weekly_working_hours")}
                    className="flex-1"
                    type="number"
                    min={0}
                    max={168}
                    onChange={(e) => {
                      handleFieldChange(e, field);
                    }}
                  />
                  <TextFormField
                    {...field("video_connect_link")}
                    label={t("video_conference_link")}
                    className="flex-1"
                    type="url"
                    onChange={(e) => {
                      handleFieldChange(e, field);
                    }}
                  />
                </div>
              </>
            )}

            {!editUser && (
              <>
                {isStateLoading ? (
                  <CircularProgress />
                ) : (
                  <SelectFormField
                    {...field("state")}
                    label="State"
                    required
                    placeholder="Choose State"
                    options={states}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(e) => {
                      handleFieldChange(e, field);
                      if (e) setSelectedStateId(e.value);
                    }}
                  />
                )}

                {isDistrictLoading ? (
                  <CircularProgress />
                ) : (
                  <SelectFormField
                    {...field("district")}
                    label="District"
                    required
                    placeholder="Choose District"
                    options={districts}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={(e) => {
                      handleFieldChange(e, field);
                      if (e) setSelectedDistrictId(e.value);
                    }}
                  />
                )}

                {showLocalbody &&
                  (isLocalbodyLoading ? (
                    <CircularProgress />
                  ) : (
                    <SelectFormField
                      {...field("local_body")}
                      label="Local Body"
                      required
                      position="above"
                      placeholder="Choose Local Body"
                      options={localBodies}
                      optionLabel={(o) => o.name}
                      optionValue={(o) => o.id}
                      onChange={(e) => {
                        handleFieldChange(e, field);
                      }}
                    />
                  ))}
              </>
            )}
          </div>
        </>
      )}
    </Form>
  );
};

export default UserAddEditForm;
