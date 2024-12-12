import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import CircularProgress from "@/components/Common/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import { FacilityModel } from "@/components/Facility/models";
import {
  FieldError,
  PhoneNumberValidator,
} from "@/components/Form/FieldValidators";
import Form from "@/components/Form/Form";
import { FormContextValue } from "@/components/Form/FormContext";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import {
  UserForm,
  ValidateDoctorExperienceCommencedOn,
  ValidateDoctorMedicalCouncilRegistration,
  ValidateQualification,
  ValidateVideoLink,
} from "@/components/Users/UserFormValidations";
import { GetUserTypes } from "@/components/Users/UserListAndCard";
import { GenderType, UserModel } from "@/components/Users/models";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { GENDER_TYPES, USER_TYPES } from "@/common/constants";
import {
  validateEmailAddress,
  validateName,
  validateNumber,
  validatePassword,
  validateUsername,
} from "@/common/validation";

import { useAutoSaveReducer } from "@/Utils/AutoSave";
import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { classNames, dateQueryString, parsePhoneNumber } from "@/Utils/utils";

interface StateObj {
  id: number;
  name: string;
}

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
  weekly_working_hours: undefined,
  video_connect_link: undefined,
};

interface UserProps {
  username?: string;
  includedFields?: Array<keyof UserForm>;
  onSubmitSuccess?: () => void;
}

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

type UserFormAction =
  | { type: "set_form"; form: UserForm }
  | { type: "set_state"; state?: typeof initialState };

const user_create_reducer = (state = initialState, action: UserFormAction) => {
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
  isInitialState: boolean = false,
) => {
  return (
    <div>
      {isInitialState ? (
        <CareIcon icon="l-circle" className="text-xl text-gray-500" />
      ) : condition ? (
        <CareIcon icon="l-check-circle" className="text-xl text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
      )}{" "}
      <span
        className={classNames(
          isInitialState
            ? "text-black"
            : condition
              ? "text-primary-500"
              : "text-red-500",
        )}
      >
        {content}
      </span>
    </div>
  );
};

const UserAddEditForm = (props: UserProps) => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const { username, includedFields } = props;
  const editUser = username ? true : false;
  const formVals = useRef(initForm);
  const [facilityErrors, setFacilityErrors] = useState("");

  const {
    loading: userDataLoading,
    data: userData,
    refetch: refetchUserData,
  } = useTanStackQueryInstead(routes.getUserDetails, {
    pathParams: {
      username: username ?? "",
    },
    prefetch: editUser && !!username,
    onResponse: (result) => {
      if (!editUser || !result || !result.res || !result.data) return;
      const userData = result.data;
      const formData: UserForm = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        date_of_birth: userData.date_of_birth || null,
        gender: userData.gender || "Male",
        email: userData.email,
        video_connect_link: userData.video_connect_link,
        phone_number: userData.phone_number?.toString() || "",
        alt_phone_number: userData.alt_phone_number?.toString() || "",
        weekly_working_hours: userData.weekly_working_hours,
        phone_number_is_whatsapp:
          userData.phone_number?.toString() ===
          userData.alt_phone_number?.toString(),
        user_type: userData.user_type,
        qualification: userData.qualification,
        doctor_experience_commenced_on: userData.doctor_experience_commenced_on
          ? dayjs()
              .diff(dayjs(userData.doctor_experience_commenced_on), "years")
              .toString()
          : undefined,
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

  const prepData = (
    formData: UserForm,
    isCreate: boolean = false,
  ): Partial<UserForm> => {
    const fields = includedFields ?? Object.keys(formData);
    let baseData: Partial<UserForm> = {};
    const phoneNumber = parsePhoneNumber(formData.phone_number) ?? "";
    const altPhoneNumber = formData.phone_number_is_whatsapp
      ? phoneNumber
      : (parsePhoneNumber(formData.alt_phone_number) ?? "");

    let fieldMappings: Partial<UserForm> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      video_connect_link: formData.video_connect_link,
      phone_number: phoneNumber,
      alt_phone_number: altPhoneNumber,
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
          : undefined,
    };

    if (isCreate) {
      fieldMappings = {
        ...fieldMappings,
        user_type: formData.user_type,
        password: formData.password,
        facilities: formData.facilities ? formData.facilities : undefined,
        home_facility: formData.home_facility ?? undefined,
        username: formData.username,
        state: formData.state,
        district: formData.district,
        local_body: showLocalbody ? formData.local_body : undefined,
      };
    }

    for (const field of fields) {
      if (field in fieldMappings) {
        baseData = {
          ...baseData,
          [field as keyof UserForm]: fieldMappings[field as keyof UserForm],
        };
      }
    }

    return baseData;
  };

  const handleEditSubmit = async (formData: UserForm) => {
    if (!username) return;
    const data = prepData(formData);
    const { res, error } = await request(routes.partialUpdateUser, {
      pathParams: { username },
      body: data as Partial<UserModel>,
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
    props.onSubmitSuccess?.();
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

  const userTypes = GetUserTypes();
  const authUser = useAuthUser();
  const userIndex = USER_TYPES.indexOf(authUser.user_type);

  const showLocalbody = ![
    "Pharmacist",
    "Volunteer",
    "Doctor",
    ...STAFF_OR_NURSE_USER,
  ].includes(state.form.user_type ?? "");

  const { loading: isDistrictLoading } = useTanStackQueryInstead(
    routes.getDistrictByState,
    {
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
    },
  );

  const { loading: isLocalbodyLoading } = useTanStackQueryInstead(
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

  const { loading: isStateLoading } = useTanStackQueryInstead(
    routes.statesList,
    {
      onResponse: (result) => {
        if (!result || !result.res || !result.data) return;
        if (userIndex <= USER_TYPES.indexOf("StateAdmin")) {
          setStates([authUser.state_object!]);
        } else {
          setStates(result.data.results);
        }
      },
    },
  );

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
    const fieldName = event.name as keyof UserForm;
    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        [fieldName]: event.value,
      },
    });
    field?.(fieldName).onChange(event);
  };

  const changePhoneNumber = (
    field: FormContextValue<UserForm>,
    fieldName: keyof UserForm,
    value: string | boolean,
  ) => {
    field(fieldName).onChange({
      name: field(fieldName).name,
      value: value,
    });
  };

  const updatePhoneNumber = (
    field: FormContextValue<UserForm>,
    phoneNumber: string,
  ) => {
    changePhoneNumber(field, "phone_number", phoneNumber);
    return { phone_number: phoneNumber };
  };

  const updateAltPhoneNumber = (
    field: FormContextValue<UserForm>,
    allowUpdate: boolean,
    phoneNumber: string,
  ) => {
    if (allowUpdate) {
      changePhoneNumber(field, "alt_phone_number", phoneNumber);
      return { alt_phone_number: phoneNumber };
    }
    return {};
  };

  const handlePhoneChange = (
    event: FieldChangeEvent<unknown>,
    field: FormContextValue<UserForm>,
  ) => {
    let formData = { ...state.form };
    let phoneNumberVal = "";
    switch (event.name) {
      case "phone_number":
        formData = {
          ...formData,
          ...updatePhoneNumber(field, event.value as string),
          ...updateAltPhoneNumber(
            field,
            state.form.phone_number_is_whatsapp ?? true,
            event.value as string,
          ),
        };
        break;
      case "alt_phone_number":
        phoneNumberVal = event.value as string;
        formData = {
          ...formData,
          ...updateAltPhoneNumber(
            field,
            !(state.form.phone_number_is_whatsapp ?? true),
            phoneNumberVal,
          ),
        };
        break;
      case "phone_number_is_whatsapp":
        formData = {
          ...formData,
          ...updateAltPhoneNumber(
            field,
            event.value as boolean,
            state.form.phone_number,
          ),
          phone_number_is_whatsapp: event.value as boolean,
        };
        changePhoneNumber(
          field,
          "phone_number_is_whatsapp",
          event.value as boolean,
        );
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
    const fieldsToValidate = includedFields || Object.keys(formData);
    const facilityError = fieldsToValidate.includes("facilities")
      ? validateFacility(formData, selectedFacility)
      : null;
    if (facilityError) {
      errors.facilities = facilityError;
    }
    let currentError = null;
    fieldsToValidate.forEach((field) => {
      switch (field) {
        case "user_type":
          if (!formData[field]) {
            errors[field] = t("please_select_user_type");
          }
          break;
        case "qualification":
          currentError = ValidateQualification(formData, t);
          if (currentError) {
            errors[field] = currentError;
          }
          break;
        case "doctor_experience_commenced_on":
          currentError = ValidateDoctorExperienceCommencedOn(formData, t);
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
            errors[field] = t("password_required");
          } else if (!validatePassword(formData[field])) {
            errors.password = t("password_validation");
          }
          break;
        case "c_password":
          if (!formData.password) {
            errors.c_password = t("confirm_password_required");
          } else if (formData.password !== formData.c_password) {
            errors.c_password = t("password_mismatch");
          }
          break;
        case "first_name":
        case "last_name":
          formData[field] = formData[field].trim();
          if (!formData[field]) {
            errors[field] = t(`${field}_required`);
          } else if (!validateName(formData[field])) {
            errors[field] = t("min_char_length_error", { min_length: 3 });
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
              Number.isNaN(hours) ||
              hours < 0 ||
              hours > 168 ||
              !validateNumber(formData[field] ?? "")
            ) {
              errors[field] = t("weekly_working_hours_error");
            }
          }
          break;
        case "video_connect_link":
          currentError = ValidateVideoLink(formData, t);
          if (currentError) {
            errors[field] = currentError;
          }
          break;
        default:
          break;
      }
    });
    return errors;
  };

  const handleSubmit = async (formData: UserForm) => {
    setIsLoading(true);
    const data = prepData(formData, true);

    const { res, error } = await request(routes.addUser, {
      body: data,
    });
    if (res?.ok) {
      dispatch({ type: "set_form", form: initForm });
      Notification.Success({
        msg: t("user_added_successfully"),
      });
      navigate("/users");
    } else {
      Notification.Error({
        msg: error?.message ?? t("user_add_error"),
      });
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

  const renderDoctorOrNurseFields = (field: FormContextValue<UserForm>) => {
    return (
      <>
        {(state.form.user_type === "Doctor" ||
          state.form.user_type === "Nurse") &&
          includedFields?.includes("qualification") && (
            <TextFormField
              {...field("qualification")}
              required
              label={t("qualification")}
              placeholder={t("qualification")}
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              className="flex-1"
              aria-label={t("qualification")}
            />
          )}
        {state.form.user_type === "Doctor" && (
          <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
            {includedFields?.includes("doctor_experience_commenced_on") && (
              <TextFormField
                {...field("doctor_experience_commenced_on")}
                required
                label={t("years_of_experience")}
                placeholder={t("years_of_experience_of_the_doctor")}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                className="flex-1"
                aria-label={t("years_of_experience")}
              />
            )}
            {includedFields?.includes(
              "doctor_medical_council_registration",
            ) && (
              <TextFormField
                {...field("doctor_medical_council_registration")}
                required
                label={t("medical_council_registration")}
                placeholder={t("doctor_s_medical_council_registration")}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                className="flex-1"
                aria-label={t("medical_council_registration")}
              />
            )}
          </div>
        )}
      </>
    );
  };

  const renderPhoneNumberFields = (field: FormContextValue<UserForm>) => {
    return (
      <>
        {includedFields?.includes("phone_number") && (
          <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
            <div className="flex flex-1 flex-col">
              <PhoneNumberFormField
                {...field("phone_number")}
                placeholder={t("phone_number")}
                label={t("phone_number")}
                required
                types={["mobile", "landline"]}
                onChange={(e) => {
                  handlePhoneChange(e, field);
                }}
                className=""
                aria-label={t("phone_number")}
              />
              <CheckBoxFormField
                name="phone_number_is_whatsapp"
                value={state.form.phone_number_is_whatsapp}
                onChange={(e) => {
                  handlePhoneChange(e, field);
                }}
                label={t("is_phone_a_whatsapp_number")}
              />
            </div>
            <PhoneNumberFormField
              {...field("alt_phone_number")}
              placeholder={t("whatsapp_phone_number")}
              label={t("whatsapp_number")}
              disabled={state.form.phone_number_is_whatsapp}
              types={["mobile"]}
              onChange={(e) => {
                handlePhoneChange(e, field);
              }}
              className="flex-1"
              aria-label={t("whatsapp_number")}
            />
          </div>
        )}
      </>
    );
  };

  const renderUsernameField = (field: FormContextValue<UserForm>) => {
    return (
      <>
        {includedFields?.includes("username") && (
          <>
            <TextFormField
              {...field("username")}
              label={t("username")}
              placeholder={t("username")}
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
              aria-label={t("username")}
            />
            {usernameInputInFocus && (
              <div className="text-small pl-2 text-secondary-500">
                <div>
                  {usernameExists !== userExistsEnums.idle && (
                    <>
                      {usernameExists === userExistsEnums.checking ? (
                        <span>
                          <CareIcon icon="l-record-audio" className="text-xl" />{" "}
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
                                {t("username_not_available")}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <CareIcon
                                icon="l-check-circle"
                                className="text-xl text-green-500"
                              />{" "}
                              <span className="text-primary-500">
                                {t("username_available")}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                <div aria-live="polite">
                  {validateRule(
                    usernameInput.length >= 4 && usernameInput.length <= 16,
                    "Username should be 4-16 characters long",
                    !state.form.username,
                  )}
                  {validateRule(
                    /^[a-z0-9._-]*$/.test(usernameInput),
                    "Username can only contain lowercase letters, numbers, and . _ -",
                    !state.form.username,
                  )}
                  {validateRule(
                    /^[a-z0-9].*[a-z0-9]$/i.test(usernameInput),
                    "Username must start and end with a letter or number",
                    !state.form.username,
                  )}
                  {validateRule(
                    !/(?:[._-]{2,})/.test(usernameInput),
                    "Username can't contain consecutive special characters . _ -",
                    !state.form.username,
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  const renderPasswordFields = (field: FormContextValue<UserForm>) => {
    return (
      <>
        <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
          {includedFields?.includes("password") && (
            <div className="flex flex-1 flex-col">
              <TextFormField
                {...field("password")}
                label={t("password")}
                placeholder={t("password")}
                required
                autoComplete="new-password"
                type="password"
                onFocus={() => setPasswordInputInFocus(true)}
                onBlur={() => setPasswordInputInFocus(false)}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                aria-label={t("password")}
              />
              {passwordInputInFocus && state.form.password && (
                <div
                  className="text-small pl-2 text-secondary-500"
                  aria-live="polite"
                >
                  {validateRule(
                    state.form.password.length >= 8,
                    t("password_length_validation"),
                    !state.form.password,
                  )}
                  {validateRule(
                    state.form.password !== state.form.password.toUpperCase(),
                    t("password_lowercase_validation"),
                    !state.form.password,
                  )}
                  {validateRule(
                    state.form.password !== state.form.password.toLowerCase(),
                    t("password_uppercase_validation"),
                    !state.form.password,
                  )}
                  {validateRule(
                    /\d/.test(state.form.password),
                    t("password_number_validation"),
                    !state.form.password,
                  )}
                </div>
              )}
            </div>
          )}
          {includedFields?.includes("c_password") && (
            <div className="flex flex-1 flex-col">
              <TextFormField
                {...field("c_password")}
                label={t("confirm_password")}
                placeholder={t("confirm_password")}
                required
                type="password"
                autoComplete="off"
                onFocus={() => setConfirmPasswordInputInFocus(true)}
                onBlur={() => setConfirmPasswordInputInFocus(false)}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                aria-label={t("confirm_password")}
              />
              {confirmPasswordInputInFocus &&
                state.form.c_password &&
                state.form.c_password.length > 0 && (
                  <div aria-live="polite">
                    {validateRule(
                      state.form.c_password === state.form.password,
                      t("password_mismatch"),
                      !state.form.c_password,
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPersonalInfoFields = (field: FormContextValue<UserForm>) => {
    return (
      <>
        <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
          {includedFields?.includes("first_name") && (
            <TextFormField
              {...field("first_name")}
              required
              label={t("first_name")}
              className="flex-1"
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              aria-label={t("first_name")}
            />
          )}
          {includedFields?.includes("last_name") && (
            <TextFormField
              {...field("last_name")}
              required
              label={t("last_name")}
              className="flex-1"
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              aria-label={t("last_name")}
            />
          )}
        </div>
        {includedFields?.includes("email") && (
          <TextFormField
            {...field("email")}
            label={t("email")}
            placeholder={t("email")}
            required
            onChange={(e) => {
              handleFieldChange(e, field);
            }}
            aria-label={t("email")}
          />
        )}
        <div className="flex flex-col justify-between gap-x-3 sm:flex-row sm:items-center">
          {includedFields?.includes("date_of_birth") && (
            <DateFormField
              {...field("date_of_birth")}
              label={t("date_of_birth")}
              required
              value={getDate(state.form.date_of_birth)}
              onChange={(e) => {
                handleDateChange(e, field);
              }}
              disableFuture
              className="flex-1"
              aria-label={t("date_of_birth")}
            />
          )}
          {includedFields?.includes("gender") && (
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
              aria-label={t("gender")}
            />
          )}
        </div>
      </>
    );
  };

  const renderHoursAndConferenceLinkFields = (
    field: FormContextValue<UserForm>,
  ) => {
    return (
      <>
        <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
          {includedFields?.includes("weekly_working_hours") && (
            <TextFormField
              {...field("weekly_working_hours")}
              name="weekly_working_hours"
              label={t("average_weekly_working_hours")}
              className="flex-1"
              type="number"
              min={0}
              max={168}
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              aria-label={t("average_weekly_working_hours")}
            />
          )}
          {includedFields?.includes("video_connect_link") && (
            <TextFormField
              {...field("video_connect_link")}
              label={t("video_conference_link")}
              className="flex-1"
              type="url"
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              aria-label={t("video_conference_link")}
            />
          )}
        </div>
      </>
    );
  };

  const renderStateDistrictLocalBodyFields = (
    field: FormContextValue<UserForm>,
  ) => {
    return (
      <>
        {includedFields?.includes("state") && (
          <>
            {isStateLoading ? (
              <CircularProgress />
            ) : (
              <SelectFormField
                {...field("state")}
                label={t("state")}
                required
                placeholder={t("choose_state")}
                options={states}
                optionLabel={(o) => o.name}
                optionValue={(o) => o.id}
                onChange={(e) => {
                  handleFieldChange(e, field);
                  if (e) setSelectedStateId(e.value);
                }}
                aria-label={t("state")}
              />
            )}
          </>
        )}
        {includedFields?.includes("district") && (
          <>
            {isDistrictLoading ? (
              <CircularProgress />
            ) : (
              <SelectFormField
                {...field("district")}
                label={t("district")}
                required
                placeholder={t("choose_district")}
                options={districts}
                optionLabel={(o) => o.name}
                optionValue={(o) => o.id}
                onChange={(e) => {
                  handleFieldChange(e, field);
                  if (e) setSelectedDistrictId(e.value);
                }}
                aria-label={t("district")}
              />
            )}
          </>
        )}
        {includedFields?.includes("local_body") && (
          <>
            {isLocalbodyLoading ? (
              <CircularProgress />
            ) : (
              <SelectFormField
                {...field("local_body")}
                label={t("local_body")}
                required
                position="above"
                placeholder={t("choose_localbody")}
                options={localBodies}
                optionLabel={(o) => o.name}
                optionValue={(o) => o.id}
                onChange={(e) => {
                  handleFieldChange(e, field);
                }}
                aria-label={t("local_body")}
              />
            )}
          </>
        )}
      </>
    );
  };

  const renderFacilityUserTypeHomeFacilityFields = (
    field: FormContextValue<UserForm>,
  ) => {
    return (
      <>
        {includedFields?.includes("facilities") && (
          <div className="w-full">
            <FieldLabel>{t("facilities")}</FieldLabel>
            <FacilitySelect
              multiple={true}
              name="facilities"
              selected={selectedFacility}
              setSelected={setFacility}
              errors={facilityErrors}
              showAll={false}
              aria-label={t("facilities")}
            />
          </div>
        )}
        <div className="flex flex-col justify-between gap-x-3 sm:flex-row">
          {includedFields?.includes("user_type") && (
            <SelectFormField
              {...field("user_type")}
              required
              label={t("user_type")}
              options={userTypes}
              optionLabel={(o) => o.role + (o.readOnly ? " (Read Only)" : "")}
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              optionValue={(o) => o.id}
              className="flex-1"
              aria-label={t("user_type")}
            />
          )}
          {includedFields?.includes("home_facility") && (
            <SelectFormField
              {...field("home_facility")}
              label={t("home_facility")}
              options={selectedFacility ?? []}
              optionLabel={(option) => option.name}
              optionValue={(option) => option.id}
              onChange={(e) => {
                handleFieldChange(e, field);
              }}
              className="flex-1"
              aria-label={t("home_facility")}
            />
          )}
        </div>
      </>
    );
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
      resetFormValsOnCancel
      hideCancelButton={editUser}
    >
      {(field) => (
        <>
          <div className="my-4 flex flex-col gap-y-2">
            {renderFacilityUserTypeHomeFacilityFields(field)}
            {renderDoctorOrNurseFields(field)}
            {renderPhoneNumberFields(field)}
            {renderUsernameField(field)}
            {renderPasswordFields(field)}
            {renderPersonalInfoFields(field)}
            {renderHoursAndConferenceLinkFields(field)}
            {renderStateDistrictLocalBodyFields(field)}
          </div>
        </>
      )}
    </Form>
  );
};

export default UserAddEditForm;
