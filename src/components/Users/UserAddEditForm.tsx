import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";
import {
  GENDER_TYPES,
  USER_TYPES,
  USER_TYPE_OPTIONS,
} from "@/common/constants";
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
import { GenderType, UserModel } from "./models";
import Form from "../Form/Form";
import { FormContextValue } from "../Form/FormContext";
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
    case "set_state": {
      if (action.state) return action.state;
      return state;
    }
    default:
      return state;
  }
};

const getDate = (value: string | Date | null) =>
  value && dayjs(value).isValid() ? dayjs(value).toDate() : undefined;

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
  const [facilityErrors, setFacilityErrors] = useState("");

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

  const getUserTypes = (authUser: UserModel) => {
    // Superuser gets all options
    if (authUser.is_superuser) {
      return [...USER_TYPE_OPTIONS];
    }

    switch (authUser.user_type) {
      case "StaffReadOnly":
        return readOnlyUsers.slice(0, 1);
      case "DistrictReadOnlyAdmin":
        return readOnlyUsers.slice(0, 2);
      case "StateReadOnlyAdmin":
        return readOnlyUsers.slice(0, 3);
      case "Pharmacist":
        return USER_TYPE_OPTIONS.slice(0, 1);
      case "Nurse":
      case "Staff":
        // Allow creation of users with elevated permissions
        return [...defaultAllowedUserTypes, USER_TYPE_OPTIONS[6]];
      default:
        // Exception to allow Staff to Create Doctors
        return defaultAllowedUserTypes;
    }
  };

  const userTypes = getUserTypes(authUser);

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

  const handleDateChange = (
    event: FieldChangeEvent<Date>,
    field?: FormContextValue<UserForm>,
  ) => {
    if (dayjs(event.value).isValid()) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [event.name]: dayjs(event.value).format("YYYY-MM-DD"),
        },
      });
      if (field) field(event.name as keyof UserForm).onChange(event);
    }
  };

  const handleFieldChange = (
    event: FieldChangeEvent<unknown>,
    field?: FormContextValue<UserForm>,
  ) => {
    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        [event.name]: event.value,
      },
    });
    if (field) field(event.name as keyof UserForm).onChange(event);
  };

  const handlePhoneChange = (
    event: FieldChangeEvent<unknown>,
    field: FormContextValue<UserForm>,
  ) => {
    let formData = { ...state.form };
    let phoneNumberVal = "";
    switch (event.name) {
      case "phone_number":
        phoneNumberVal = event.value as string;
        field("phone_number").onChange({
          name: field("phone_number").name,
          value: phoneNumberVal,
        });
        formData = { ...formData, phone_number: phoneNumberVal };
        if (state.form.phone_number_is_whatsapp) {
          field("alt_phone_number").onChange({
            name: field("alt_phone_number").name,
            value: phoneNumberVal,
          });
          formData = { ...formData, alt_phone_number: phoneNumberVal };
        }
        break;
      case "alt_phone_number":
        phoneNumberVal = event.value as string;
        if (!state.form.phone_number_is_whatsapp) {
          field("alt_phone_number").onChange({
            name: field("alt_phone_number").name,
            value: phoneNumberVal,
          });
          formData = { ...formData, alt_phone_number: phoneNumberVal };
        }
        break;
      case "phone_number_is_whatsapp":
        phoneNumberVal = state.form.phone_number;
        formData = {
          ...formData,
          alt_phone_number: phoneNumberVal,
          phone_number_is_whatsapp: event.value as boolean,
        };
        field("alt_phone_number").onChange({
          name: field("alt_phone_number").name,
          value: phoneNumberVal,
        });
        field("phone_number_is_whatsapp").onChange({
          name: field("phone_number_is_whatsapp").name,
          value: event.value,
        });
        break;
    }
    dispatch({
      type: "set_form",
      form: formData,
    });
  };

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

  const validateFacility = (
    formData: UserForm,
    selectedFacility: FacilityModel[],
  ) => {
    if (
      selectedFacility &&
      formData.user_type &&
      selectedFacility.length === 0 &&
      STAFF_OR_NURSE_USER.includes(authUser.user_type) &&
      STAFF_OR_NURSE_USER.includes(formData.user_type)
    ) {
      return "Please select atleast one of the facilities you are linked to";
    }
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
    if (!parsedPhoneNumber) return false;
    return PhoneNumberValidator()(parsedPhoneNumber) === undefined;
  };

  const validateForm = (formData: UserForm) => {
    const errors: Partial<Record<keyof UserForm, FieldError>> = {};
    const facilityError = validateFacility(formData, selectedFacility);
    if (facilityError) {
      errors.facilities = facilityError;
    }
    Object.keys(formData).forEach((field) => {
      switch (field) {
        case "user_type":
          if (!formData[field]) {
            errors[field] = t("please_select_user_type");
          }
          break;
        case "qualification":
          if (
            (formData.user_type === "Doctor" ||
              formData.user_type === "Nurse") &&
            !formData[field]
          ) {
            errors[field] = t("field_required");
          }
          break;
        case "doctor_experience_commenced_on":
          if (formData.user_type === "Doctor" && !formData[field]) {
            errors[field] = t("field_required");
          } else if (
            formData.user_type === "Doctor" &&
            Number(formData.doctor_experience_commenced_on) > 100
          ) {
            errors[field] = t("doctor_experience_less_than_100_years");
          }
          break;
        case "doctor_medical_council_registration":
          if (formData.user_type === "Doctor" && !formData[field]) {
            errors[field] = t("field_required");
          }
          break;
        case "phone_number":
          if (!formData[field] || !validatePhoneNumber(formData[field])) {
            errors[field] = t("invalid_phone");
          }
          break;
        case "alt_phone_number":
          if (
            formData[field] &&
            formData[field] !== "+91" &&
            !validatePhoneNumber(formData[field])
          ) {
            errors[field] = t("mobile_number_validation_error");
          }
          break;
        case "username":
          if (!formData[field]) {
            errors[field] = t("please_enter_username");
          } else if (!validateUsername(formData[field])) {
            errors[field] = t("invalid_username");
          } else if (usernameExists !== userExistsEnums.available) {
            errors[field] = t("username_already_exists");
          }
          break;
        case "password":
          if (!formData[field]) {
            errors[field] = t("please_enter_password");
          } else if (!validatePassword(formData[field])) {
            errors.password = t("password_validation");
          }
          break;
        case "c_password":
          if (!formData.password) {
            errors.c_password = t("confirm_password_required");
          } else if (formData.password !== formData.c_password) {
            errors.c_password = t("passwords_not_matching");
          }
          break;
        case "first_name":
        case "last_name":
          formData[field] = formData[field].trim();
          if (!formData[field]) {
            errors[field] = t(`${field}_required`);
          } else if (!validateName(formData[field])) {
            errors[field] = t("enter_valid_name");
          }
          break;
        case "email":
          formData[field] = formData[field].trim();
          if (
            formData[field].length === 0 ||
            !validateEmailAddress(formData[field])
          ) {
            errors[field] = t("invalid_email");
          }
          break;
        case "date_of_birth":
          if (!formData[field]) {
            errors[field] = t("dob_format");
          } else if (
            dayjs(formData[field]).isAfter(dayjs().subtract(1, "year"))
          ) {
            errors[field] = t("enter_valid_dob");
          } else if (
            dayjs(formData[field]).isAfter(dayjs().subtract(16, "year"))
          ) {
            errors[field] = t("enter_valid_dob_age");
          }
          break;
        case "gender":
          if (!formData[field]) {
            errors[field] = t("please_select_gender");
          }
          break;
        case "state":
          if (!Number(formData[field])) {
            errors[field] = t("please_select_state");
          }
          break;
        case "district":
          if (!Number(formData[field])) {
            errors[field] = t("please_select_district");
          }
          break;
        case "local_body":
          if (showLocalbody && !Number(formData[field])) {
            errors[field] = t("please_select_localbody");
          }
          break;
        case "weekly_working_hours":
          if (formData[field] !== null && formData[field] !== undefined) {
            const hours = Number(formData[field]);
            if (
              isNaN(hours) ||
              hours < 0 ||
              hours > 168 ||
              !/^\d+$/.test(formData[field] ?? "")
            ) {
              errors[field] = t("weekly_working_hours_error");
            }
          }
          break;
        case "video_connect_link":
          if (formData[field]) {
            if (isValidUrl(formData[field]) === false) {
              errors[field] = t("invalid_url");
            }
          }
          break;
        default:
          break;
      }
    });
    const firstError = Object.keys(errors).find((e) => e);
    if (firstError) {
      scrollTo(firstError);
    }
    return errors;
  };

  const handleSubmit = async (formData: UserForm) => {
    setIsLoading(true);
    const data = {
      user_type: formData.user_type,
      gender: formData.gender,
      password: formData.password,
      facilities: selectedFacility ? selectedFacility : undefined,
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

  useEffect(() => {
    const facilityError = validateFacility(state.form, selectedFacility);
    setFacilityErrors(facilityError || "");
  }, [state.form, selectedFacility]);

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
                  errors={facilityErrors}
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
                    handlePhoneChange(e, field);
                  }}
                  className=""
                />
                <CheckBoxFormField
                  name="phone_number_is_whatsapp"
                  value={state.form.phone_number_is_whatsapp}
                  onChange={(e) => {
                    handlePhoneChange(e, field);
                  }}
                  label="Is the phone number a WhatsApp number?"
                />
              </div>
              <PhoneNumberFormField
                {...field("alt_phone_number")}
                placeholder="WhatsApp Phone Number"
                label="Whatsapp Number"
                disabled={state.form.phone_number_is_whatsapp}
                types={["mobile"]}
                onChange={(e) => {
                  handlePhoneChange(e, field);
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
