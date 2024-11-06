import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FacilityModel } from "@/components/Facility/models";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

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

import { DraftSection, useAutoSaveReducer } from "@/Utils/AutoSave";
import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  dateQueryString,
  parsePhoneNumber,
  scrollTo,
} from "@/Utils/utils";

interface UserProps {
  userId?: number;
}

interface StateObj {
  id: number;
  name: string;
}

type UserForm = {
  user_type: string;
  gender: string;
  password: string;
  c_password: string;
  facilities: Array<string>;
  home_facility: FacilityModel | null;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  phone_number_is_whatsapp: boolean;
  date_of_birth: Date | null;
  state: number;
  district: number;
  local_body: number;
  qualification: string | undefined;
  doctor_experience_commenced_on: string | undefined;
  doctor_medical_council_registration: string | undefined;
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
  isInitialState: boolean,
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

export const UserAdd = (props: UserProps) => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const { userId } = props;

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

  const headerText = !userId ? "Add User" : "Update User";
  const buttonText = !userId ? "Save User" : "Update Details";
  const showLocalbody = ![
    "Pharmacist",
    "Volunteer",
    "Doctor",
    ...STAFF_OR_NURSE_USER,
  ].includes(state.form.user_type);

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

  const handleDateChange = (e: FieldChangeEvent<Date>) => {
    if (dayjs(e.value).isValid()) {
      const errors = { ...state.errors, [e.name]: "" };
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [e.name]: dayjs(e.value).format("YYYY-MM-DD"),
        },
      });
      dispatch({ type: "set_errors", errors });
    }
  };

  const handleFieldChange = (event: FieldChangeEvent<unknown>) => {
    const errors = { ...state.errors, [event.name]: "" };
    dispatch({
      type: "set_form",
      form: {
        ...state.form,
        [event.name]: event.value,
      },
    });
    dispatch({ type: "set_errors", errors });
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

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "facilities":
          if (
            state.form[field].length === 0 &&
            STAFF_OR_NURSE_USER.includes(authUser.user_type) &&
            STAFF_OR_NURSE_USER.includes(state.form.user_type)
          ) {
            errors[field] =
              "Please select atleast one of the facilities you are linked to";
            invalidForm = true;
          }
          return;
        case "user_type":
          if (!state.form[field]) {
            errors[field] = "Please select the User Type";
            invalidForm = true;
          }
          return;
        case "doctor_experience_commenced_on":
          if (state.form.user_type === "Doctor" && !state.form[field]) {
            errors[field] = t("field_required");
            invalidForm = true;
          } else if (
            state.form.user_type === "Doctor" &&
            Number(state.form.doctor_experience_commenced_on) > 100
          ) {
            errors[field] = "Doctor experience should be less than 100 years";
            invalidForm = true;
          }
          return;
        case "qualification":
          if (
            (state.form.user_type === "Doctor" ||
              state.form.user_type === "Nurse") &&
            !state.form[field]
          ) {
            errors[field] = t("field_required");
            invalidForm = true;
          }
          return;
        case "doctor_medical_council_registration":
          if (state.form.user_type === "Doctor" && !state.form[field]) {
            errors[field] = t("field_required");
            invalidForm = true;
          }
          return;
        case "first_name":
        case "last_name":
          state.form[field] = state.form[field].trim();
          if (!state.form[field]) {
            errors[field] = `${field
              .split("_")
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" ")} is required`;
            invalidForm = true;
          } else if (!validateName(state.form[field])) {
            errors[field] = "Please enter a valid name";
            invalidForm = true;
          }
          return;
        case "gender":
          if (!state.form[field]) {
            errors[field] = "Please select the Gender";
            invalidForm = true;
          }
          return;
        case "username":
          if (!state.form[field]) {
            errors[field] = "Please enter the username";
            invalidForm = true;
          } else if (!validateUsername(state.form[field])) {
            errors[field] =
              "Please enter a 4-16 characters long username with lowercase letters, digits and . _ - only and it should not start or end with . _ -";
            invalidForm = true;
          } else if (usernameExists !== userExistsEnums.available) {
            errors[field] = "This username already exists";
            invalidForm = true;
          }
          return;
        case "password":
          if (!state.form[field]) {
            errors[field] = "Please enter the password";
            invalidForm = true;
          } else if (!validatePassword(state.form[field])) {
            errors.password =
              "Password should have 1 lowercase letter, 1 uppercase letter, 1 number, and be at least 8 characters long";
            invalidForm = true;
          }
          return;
        case "c_password":
          if (!state.form.password) {
            errors.c_password = "Confirm password is required";
            invalidForm = true;
          } else if (state.form.password !== state.form.c_password) {
            errors.c_password = "Passwords not matching";
            invalidForm = true;
          }
          return;
        case "phone_number":
          // eslint-disable-next-line no-case-declarations
          const phoneNumber = parsePhoneNumber(state.form[field]);
          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = PhoneNumberValidator()(phoneNumber) === undefined;
          }
          if (!state.form[field] || !is_valid) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;

        case "alt_phone_number":
          // eslint-disable-next-line no-case-declarations
          let alt_is_valid = false;
          if (state.form[field] && state.form[field] !== "+91") {
            const altPhoneNumber = parsePhoneNumber(state.form[field]);
            if (altPhoneNumber) {
              alt_is_valid =
                PhoneNumberValidator(["mobile"])(altPhoneNumber) === undefined;
            }
          }
          if (
            state.form[field] &&
            state.form[field] !== "+91" &&
            !alt_is_valid
          ) {
            errors[field] = "Please enter valid mobile number";
            invalidForm = true;
          }
          return;
        case "email":
          state.form[field] = state.form[field].trim();
          if (
            state.form[field].length === 0 ||
            !validateEmailAddress(state.form[field])
          ) {
            errors[field] = "Please enter a valid email address";
            invalidForm = true;
          }
          return;
        case "date_of_birth":
          if (!state.form[field]) {
            errors[field] = "Please enter date in DD/MM/YYYY format";
            invalidForm = true;
          } else if (
            dayjs(state.form[field]).isAfter(dayjs().subtract(1, "year"))
          ) {
            errors[field] = "Enter a valid date of birth";
            invalidForm = true;
          }
          return;
        case "state":
          if (!Number(state.form[field])) {
            errors[field] = "Please select the state";
            invalidForm = true;
          }
          return;
        case "district":
          if (!Number(state.form[field])) {
            errors[field] = "Please select the district";
            invalidForm = true;
          }
          return;
        case "local_body":
          if (showLocalbody && !Number(state.form[field])) {
            errors[field] = "Please select the local body";
            invalidForm = true;
          }
          return;

        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_errors", errors });
      const firstError = Object.keys(errors).find((e) => errors[e]);
      if (firstError) {
        scrollTo(firstError);
      }
      return false;
    }
    dispatch({ type: "set_errors", errors });
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data = {
        user_type: state.form.user_type,
        gender: state.form.gender,
        password: state.form.password,
        facilities: state.form.facilities ? state.form.facilities : undefined,
        home_facility: state.form.home_facility ?? undefined,
        username: state.form.username,
        first_name: state.form.first_name ? state.form.first_name : undefined,
        last_name: state.form.last_name ? state.form.last_name : undefined,
        email: state.form.email,
        state: state.form.state,
        district: state.form.district,
        local_body: showLocalbody ? state.form.local_body : null,
        phone_number:
          state.form.phone_number === "+91"
            ? ""
            : parsePhoneNumber(state.form.phone_number),
        alt_phone_number:
          parsePhoneNumber(
            state.form.phone_number_is_whatsapp
              ? state.form.phone_number === "+91"
                ? ""
                : state.form.phone_number
              : state.form.alt_phone_number === "+91"
                ? ""
                : state.form.alt_phone_number,
          ) ?? "",
        date_of_birth: dateQueryString(state.form.date_of_birth),
        qualification:
          state.form.user_type === "Doctor" || state.form.user_type == "Nurse"
            ? state.form.qualification
            : undefined,
        doctor_experience_commenced_on:
          state.form.user_type === "Doctor"
            ? dayjs()
                .subtract(
                  parseInt(state.form.doctor_experience_commenced_on ?? "0"),
                  "years",
                )
                .format("YYYY-MM-DD")
            : undefined,
        doctor_medical_council_registration:
          state.form.user_type === "Doctor"
            ? state.form.doctor_medical_council_registration
            : undefined,
      };

      const { res } = await request(routes.addUser, {
        body: data,
      });
      if (res?.ok) {
        dispatch({ type: "set_form", form: initForm });
        if (!userId) {
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
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const field = (name: string) => {
    return {
      id: name,
      name,
      onChange: handleFieldChange,
      value: (state.form as any)[name],
      error: (state.errors as any)[name],
    };
  };

  return (
    <Page
      title={headerText}
      options={
        <Link
          href="https://school.ohc.network/targets/12953"
          className="inline-block rounded border border-secondary-600 bg-secondary-50 px-4 py-2 text-secondary-600 transition hover:bg-secondary-100"
          target="_blank"
        >
          <CareIcon icon="l-question-circle" className="text-lg" /> &nbsp;Need
          Help?
        </Link>
      }
      backUrl="/users"
    >
      <Card>
        <form onSubmit={(e) => handleSubmit(e)}>
          <DraftSection
            handleDraftSelect={(newState) => {
              dispatch({ type: "set_state", state: newState });
            }}
            formData={state.form}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
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
            <SelectFormField
              {...field("user_type")}
              required
              label="User Type"
              options={userTypes}
              optionLabel={(o) => o.role + (o.readOnly ? " (Read Only)" : "")}
              optionValue={(o) => o.id}
            />

            {(state.form.user_type === "Doctor" ||
              state.form.user_type === "Nurse") && (
              <TextFormField
                {...field("qualification")}
                required
                label={t("qualification")}
                placeholder={t("qualification")}
              />
            )}
            {state.form.user_type === "Doctor" && (
              <>
                <TextFormField
                  {...field("doctor_experience_commenced_on")}
                  required
                  min={0}
                  type="number"
                  label="Years of experience"
                  placeholder="Years of experience of the Doctor"
                />

                <TextFormField
                  {...field("doctor_medical_council_registration")}
                  required
                  label="Medical Council Registration"
                  placeholder="Doctor's medical council registration number"
                />
              </>
            )}

            <SelectFormField
              {...field("home_facility")}
              label="Home facility"
              options={selectedFacility ?? []}
              optionLabel={(option) => option.name}
              optionValue={(option) => option.id}
              onChange={handleFieldChange}
            />

            <div>
              <PhoneNumberFormField
                {...field("phone_number")}
                placeholder="Phone Number"
                label="Phone Number"
                required
                types={["mobile", "landline"]}
              />
              <CheckBoxFormField
                name="phone_number_is_whatsapp"
                value={state.form.phone_number_is_whatsapp}
                onChange={handleFieldChange}
                label="Is the phone number a WhatsApp number?"
              />
            </div>

            <PhoneNumberFormField
              {...field("alt_phone_number")}
              placeholder="WhatsApp Phone Number"
              label="Whatsapp Number"
              disabled={state.form.phone_number_is_whatsapp}
              types={["mobile"]}
            />

            <div>
              <TextFormField
                {...field("username")}
                label="Username"
                placeholder="Username"
                required
                autoComplete="new-username"
                value={usernameInput}
                onChange={(e) => {
                  handleFieldChange(e);
                  setUsernameInput(e.value);
                }}
                onFocus={() => setUsernameInputInFocus(true)}
                onBlur={() => {
                  setUsernameInputInFocus(false);
                }}
              />
              {usernameInputInFocus && (
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
                      !state.form.username,
                    )}
                  </div>
                  <div>
                    {validateRule(
                      /^[a-z0-9._-]*$/.test(usernameInput),
                      "Username can only contain lowercase letters, numbers, and . _ -",
                      !state.form.username,
                    )}
                  </div>
                  <div>
                    {validateRule(
                      /^[a-z0-9].*[a-z0-9]$/i.test(usernameInput),
                      "Username must start and end with a letter or number",
                      !state.form.username,
                    )}
                  </div>
                  <div>
                    {validateRule(
                      !/(?:[._-]{2,})/.test(usernameInput),
                      "Username can't contain consecutive special characters . _ -",
                      !state.form.username,
                    )}
                  </div>
                </div>
              )}
            </div>

            <DateFormField
              {...field("date_of_birth")}
              label="Date of Birth"
              required
              value={getDate(state.form.date_of_birth)}
              onChange={handleDateChange}
              disableFuture
            />

            <div>
              <TextFormField
                {...field("password")}
                label="Password"
                placeholder="Password"
                required
                autoComplete="new-password"
                type="password"
                onFocus={() => setPasswordInputInFocus(true)}
                onBlur={() => setPasswordInputInFocus(false)}
              />
              {passwordInputInFocus && (
                <div className="text-small pl-2 text-secondary-500">
                  {validateRule(
                    state.form.password?.length >= 8,
                    "Password should be atleast 8 characters long",
                    !state.form.password,
                  )}
                  {validateRule(
                    state.form.password !== state.form.password.toUpperCase(),
                    "Password should contain at least 1 lowercase letter",
                    !state.form.password,
                  )}
                  {validateRule(
                    state.form.password !== state.form.password.toLowerCase(),
                    "Password should contain at least 1 uppercase letter",
                    !state.form.password,
                  )}
                  {validateRule(
                    /\d/.test(state.form.password),
                    "Password should contain at least 1 number",
                    !state.form.password,
                  )}
                </div>
              )}
            </div>
            <div>
              <TextFormField
                {...field("c_password")}
                label="Confirm Password"
                placeholder="Confirm Password"
                required
                type="password"
                autoComplete="off"
                onFocus={() => setConfirmPasswordInputInFocus(true)}
                onBlur={() => setConfirmPasswordInputInFocus(false)}
              />
              {confirmPasswordInputInFocus &&
                state.form.c_password.length > 0 &&
                validateRule(
                  state.form.c_password === state.form.password,
                  "Confirm password should match the entered password",
                  !state.form.password,
                )}
            </div>
            <TextFormField
              {...field("first_name")}
              label="First name"
              placeholder="First name"
              required
            />
            <TextFormField
              {...field("last_name")}
              label="Last name"
              placeholder="Last name"
              required
            />
            <TextFormField
              {...field("email")}
              label="Email"
              placeholder="Email"
              required
            />
            <SelectFormField
              {...field("gender")}
              label="Gender"
              required
              value={state.form.gender}
              options={GENDER_TYPES}
              optionLabel={(o) => o.text}
              optionValue={(o) => o.text}
            />

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
                  handleFieldChange(e);
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
                  handleFieldChange(e);
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
                />
              ))}
          </div>
          <div className="mt-4 flex flex-col justify-end gap-2 md:flex-row">
            <Cancel onClick={() => goBack()} />
            <Submit onClick={handleSubmit} label={buttonText} />
          </div>
        </form>
      </Card>
    </Page>
  );
};
