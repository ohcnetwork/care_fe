import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import loadable from "@loadable/component";
import { Link, navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import moment from "moment";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GENDER_TYPES, USER_TYPES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  validateEmailAddress,
  validateName,
  validatePassword,
  validateUsername,
} from "../../Common/validation";
import {
  addUser,
  getDistrictByState,
  getLocalbodyByDistrict,
  getStates,
  getUserListFacility,
  checkUsername,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  DateInputField,
  PhoneNumberField,
  SelectField,
  TextInputField,
  CheckboxField,
} from "../Common/HelperInputFields";
import { FacilityModel } from "../Facility/models";

import { classNames, goBack } from "../../Utils/utils";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const genderTypes = [
  {
    id: 0,
    text: "Select",
  },
  ...GENDER_TYPES,
];

interface UserProps {
  userId?: number;
}

const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];
const initialLocalbodies = [{ id: 0, name: "Choose Localbody" }];
const selectDistrict = [{ id: 0, name: "Please select your district" }];

const initForm: any = {
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
  phone_number: "",
  alt_phone_number: "",
  age: "",
  date_of_birth: null,
  state: "",
  district: "",
  local_body: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
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
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
};

export const UserAdd = (props: UserProps) => {
  const dispatchAction: any = useDispatch();
  const { userId } = props;

  const [state, dispatch] = useReducer(user_create_reducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [_current_user_facilities, setFacilities] = useState<
    Array<FacilityModel>
  >([]);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
  const [localBody, setLocalBody] = useState(selectDistrict);
  const [selectedFacility, setSelectedFacility] = useState<
    FacilityModel[] | null
  >([]);
  const [phoneIsWhatsApp, setPhoneIsWhatsApp] = useState(true);
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
    const usernameCheck = await dispatchAction(
      checkUsername({ username: username })
    );
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
    if (
      usernameInput.length > 1 &&
      !(state.form.username?.length < 2) &&
      /[^.@+_-]/.test(state.form.username[state.form.username?.length - 1])
    ) {
      const timeout = setTimeout(() => {
        check_username(usernameInput);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [usernameInput]);

  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;
  const isSuperuser = currentUser.data.is_superuser;

  const username = currentUser.data.username;

  const userType = currentUser.data.user_type;

  const userIndex = USER_TYPES.indexOf(userType);

  const defaultAllowedUserTypes = USER_TYPES.slice(0, userIndex + 1);
  const userTypes = isSuperuser
    ? [...USER_TYPES]
    : userType === "StaffReadOnly"
    ? ["StaffReadOnly"]
    : userType === "DistrictReadOnlyAdmin"
    ? ["StaffReadOnly", "DistrictReadOnlyAdmin"]
    : userType === "StateReadOnlyAdmin"
    ? ["StaffReadOnly", "DistrictReadOnlyAdmin", "StateReadOnlyAdmin"]
    : userType === "Pharmacist"
    ? ["Pharmacist"]
    : // Exception to allow Staff to Create Doctors
    userType === "Staff"
    ? ["Doctor", ...defaultAllowedUserTypes]
    : defaultAllowedUserTypes;

  const headerText = !userId ? "Add User" : "Update User";
  const buttonText = !userId ? "Save User" : "Update Details";
  const showLocalbody = !(
    state.form.user_type === "Pharmacist" ||
    state.form.user_type === "Volunteer" ||
    state.form.user_type === "Doctor" ||
    state.form.user_type === "Staff" ||
    state.form.user_type === "StaffReadOnly"
  );

  const fetchDistricts = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsDistrictLoading(true);
        const districtList = await dispatchAction(getDistrictByState({ id }));
        if (districtList) {
          if (userIndex <= USER_TYPES.indexOf("DistrictAdmin")) {
            setDistricts([
              ...initialDistricts,
              {
                id: currentUser.data.district,
                name: currentUser.data.district_object.name,
              },
            ]);
          } else {
            setDistricts([...initialDistricts, ...districtList.data]);
          }
        }
        setIsDistrictLoading(false);
      } else {
        setDistricts(selectStates);
      }
    },
    [dispatchAction]
  );

  const fetchLocalBody = useCallback(
    async (id: string) => {
      if (Number(id) > 0) {
        setIsLocalbodyLoading(true);
        const localBodyList = await dispatchAction(
          getLocalbodyByDistrict({ id })
        );
        setIsLocalbodyLoading(false);
        if (localBodyList) {
          if (userIndex <= USER_TYPES.indexOf("LocalBodyAdmin")) {
            setLocalBody([
              ...initialLocalbodies,
              {
                id: currentUser.data.local_body,
                name: currentUser.data.local_body_object.name,
              },
            ]);
          } else {
            setLocalBody([...initialLocalbodies, ...localBodyList.data]);
          }
        }
      } else {
        setLocalBody(selectDistrict);
      }
    },
    [dispatchAction]
  );

  const fetchStates = useCallback(
    async (status: statusType) => {
      setIsStateLoading(true);
      const statesRes = await dispatchAction(getStates());
      if (!status.aborted && statesRes.data.results) {
        if (userIndex <= USER_TYPES.indexOf("StateAdmin")) {
          setStates([
            ...initialStates,
            {
              id: currentUser.data.state,
              name: currentUser.data.state_object.name,
            },
          ]);
        } else {
          setStates([...initialStates, ...statesRes.data.results]);
        }
      }
      setIsStateLoading(false);
    },
    [dispatchAction]
  );

  const fetchFacilities = useCallback(
    async (status: any) => {
      setIsStateLoading(true);
      const res = await dispatchAction(getUserListFacility({ username }));
      if (!status.aborted && res && res.data) {
        setFacilities(res.data);
      }
      setIsStateLoading(false);
    },
    [dispatchAction, username]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchStates(status);
      if (userType === "Staff" || userType === "StaffReadOnly") {
        fetchFacilities(status);
      }
    },
    [dispatch]
  );

  const handleChange = (e: any) => {
    const { value, name } = e.target;
    const form = { ...state.form };
    form[name] = value;
    if (name === "username") {
      form[name] = value.toLowerCase();
    }
    if (name === "state") {
      form["district"] = "";
    }
    dispatch({ type: "set_form", form });
  };

  const handleChangeHomeFacility = (e: any) => {
    const { value, name } = e.target;
    const newValue = value === "" ? null : value;
    const form = { ...state.form };
    form[name] = newValue;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      form[field] = date;
      dispatch({ type: "set_form", form });
    }
  };

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  useAbortableEffect(() => {
    phoneIsWhatsApp &&
      handleValueChange(state.form.phone_number, "alt_phone_number");
  }, [phoneIsWhatsApp, state.form.phone_number]);

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    setSelectedFacility(selected as FacilityModel[]);
    const form = { ...state.form };
    form.facilities = selected
      ? (selected as FacilityModel[]).map((i) => i.id)
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
            (userType === "Staff" || userType === "StaffReadOnly") &&
            (state.form["user_type"] === "Staff" ||
              state.form["user_type"] === "StaffReadOnly")
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
        case "first_name":
        case "last_name":
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
              "Please enter letters, digits and @ . + - _ only and username should not end with @, ., +, - or _";
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
          const phoneNumber = parsePhoneNumberFromString(
            state.form[field],
            "IN"
          );
          // eslint-disable-next-line no-case-declarations
          let is_valid = false;
          if (phoneNumber) {
            is_valid = phoneNumber.isValid();
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
            const altPhoneNumber = parsePhoneNumberFromString(
              state.form[field],
              "IN"
            );
            if (altPhoneNumber) {
              alt_is_valid = altPhoneNumber.isValid();
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
          if (
            state.form[field].length &&
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
          }
          return;
        case "state":
          if (!Number(state.form[field])) {
            errors[field] = "Please select the state";
            invalidForm = true;
          }
          return;
        case "district":
          if (!Number(state.form[field]) || state.form[field] === "") {
            errors[field] = "Please select the district";
            invalidForm = true;
          }
          return;

        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const validateRule = (condition: boolean, content: JSX.Element | string) => {
    return (
      <div>
        {condition ? (
          <i className="fas fa-circle-check text-green-500" />
        ) : (
          <i className="fas fa-circle-xmark text-red-500" />
        )}{" "}
        <span
          className={classNames(
            condition ? "text-primary-500" : "text-red-500"
          )}
        >
          {content}
        </span>
      </div>
    );
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
        local_body: state.form.local_body,
        phone_number: parsePhoneNumberFromString(
          state.form.phone_number
        )?.format("E.164"),
        alt_phone_number:
          parsePhoneNumberFromString(state.form.alt_phone_number)?.format(
            "E.164"
          ) || "",
        date_of_birth: moment(state.form.date_of_birth).format("YYYY-MM-DD"),
        age: Number(moment().diff(state.form.date_of_birth, "years", false)),
      };

      const res = await dispatchAction(addUser(data));
      // userId ? updateUser(userId, data) : addUser(data)
      if (
        res &&
        (res.data || res.data === "") &&
        res.status >= 200 &&
        res.status < 300
      ) {
        // const id = res.data.id;
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

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={headerText}
        componentRight={
          <Link
            href="https://school.coronasafe.network/targets/12953"
            className="text-gray-600 border border-gray-600 bg-gray-50 hover:bg-gray-100 transition rounded px-4 py-2 inline-block"
            target="_blank"
          >
            <i className="fas fa-info-circle" /> &nbsp;Need Help?
          </Link>
        }
        justifyContents="justify-between"
      />

      <Card className="mt-4">
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <InputLabel>Facilities</InputLabel>
                <FacilitySelect
                  multiple={true}
                  name="facilities"
                  selected={selectedFacility}
                  setSelected={setFacility}
                  errors={state.errors.facilities}
                  showAll={false}
                />
              </div>

              <div>
                <InputLabel>User Type*</InputLabel>
                <SelectField
                  showEmpty={true}
                  name="user_type"
                  variant="outlined"
                  margin="dense"
                  optionArray={true}
                  value={state.form.user_type}
                  options={userTypes}
                  onChange={handleChange}
                  errors={state.errors.user_type}
                />
              </div>
              <div>
                <InputLabel>Home Facility</InputLabel>
                <SelectField
                  name="home_facility"
                  variant="outlined"
                  margin="dense"
                  value={state.form.home_facility}
                  options={[
                    { id: "", name: "Select" },
                    ...(selectedFacility ?? []),
                  ]}
                  optionValue="name"
                  onChange={handleChangeHomeFacility}
                  errors={state.errors.home_facility}
                />
              </div>

              <div>
                <PhoneNumberField
                  placeholder="Phone Number"
                  label="Phone Number*"
                  value={state.form.phone_number}
                  onChange={(value: any) =>
                    handleValueChange(value, "phone_number")
                  }
                  errors={state.errors.phone_number}
                  onlyIndia={true}
                />
                <CheckboxField
                  checked={phoneIsWhatsApp}
                  onChange={(_, checked) => {
                    setPhoneIsWhatsApp(checked);
                    !checked && handleValueChange("+91", "alt_phone_number");
                  }}
                  label="Is the phone number a WhatsApp number?"
                  className="font-bold"
                />
              </div>

              <div>
                <PhoneNumberField
                  placeholder="WhatsApp Phone Number"
                  label="Whatsapp Number"
                  value={state.form.alt_phone_number}
                  onChange={(value: any) =>
                    handleValueChange(value, "alt_phone_number")
                  }
                  disabled={phoneIsWhatsApp}
                  errors={state.errors.alt_phone_number}
                  onlyIndia={true}
                />
              </div>

              <div>
                <InputLabel>Username*</InputLabel>
                <TextInputField
                  fullWidth
                  name="username"
                  autoComplete="new-username"
                  variant="outlined"
                  margin="dense"
                  value={usernameInput}
                  onChange={(e) => {
                    handleChange(e);
                    setUsernameInput(e.target.value);
                  }}
                  errors={state.errors.username}
                  onFocus={() => setUsernameInputInFocus(true)}
                  onBlur={() => setUsernameInputInFocus(false)}
                />
                {usernameInputInFocus && (
                  <div className="pl-2 text-small text-gray-500">
                    <div>
                      {usernameExists !== userExistsEnums.idle && (
                        <>
                          {usernameExists === userExistsEnums.checking ? (
                            <span>
                              <i className="fas fa-circle-dot" /> checking...
                            </span>
                          ) : (
                            <>
                              {usernameExists === userExistsEnums.exists ? (
                                <div>
                                  {" "}
                                  <i className="fas fa-circle-xmark text-red-500" />
                                  <span className="text-red-500">
                                    Username is not available
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  {" "}
                                  <i className="fas fa-circle-check text-green-500" />
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
                        state.form.username?.length >= 2,
                        "Username should be atleast 2 characters long"
                      )}
                    </div>
                    <div>
                      {validateRule(
                        /[^.@+_-]/.test(
                          state.form.username[state.form.username?.length - 1]
                        ),
                        "Username can't end with ^ . @ + _ -"
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <InputLabel>Date of birth*</InputLabel>
                <DateInputField
                  name="dob"
                  fullWidth={true}
                  value={state.form.date_of_birth}
                  onChange={(date) => handleDateChange(date, "date_of_birth")}
                  errors={state.errors.date_of_birth}
                  inputVariant="outlined"
                  margin="dense"
                  openTo="year"
                  disableFuture={true}
                />
              </div>

              <div>
                <InputLabel>Password*</InputLabel>
                <TextInputField
                  fullWidth
                  name="password"
                  autoComplete="new-password"
                  type="password"
                  variant="outlined"
                  margin="dense"
                  value={state.form.password}
                  onChange={handleChange}
                  errors={state.errors.password}
                  onFocus={() => setPasswordInputInFocus(true)}
                  onBlur={() => setPasswordInputInFocus(false)}
                />
                {passwordInputInFocus && (
                  <div className="pl-2 text-small text-gray-500">
                    {validateRule(
                      state.form.password?.length >= 8,
                      "Password should be atleast 8 characters long"
                    )}
                    {validateRule(
                      state.form.password !== state.form.password.toUpperCase(),
                      "Password should contain at least 1 lowercase letter"
                    )}
                    {validateRule(
                      state.form.password !== state.form.password.toLowerCase(),
                      "Password should contain at least 1 uppercase letter"
                    )}
                    {validateRule(
                      /\d/.test(state.form.password),
                      "Password should contain at least 1 number"
                    )}
                  </div>
                )}
              </div>
              <div>
                <InputLabel>Confirm Password*</InputLabel>
                <TextInputField
                  fullWidth
                  name="c_password"
                  type="password"
                  variant="outlined"
                  margin="dense"
                  autoComplete="off"
                  value={state.form.c_password}
                  onChange={handleChange}
                  errors={state.errors.c_password}
                  onFocus={() => setConfirmPasswordInputInFocus(true)}
                  onBlur={() => setConfirmPasswordInputInFocus(false)}
                />
                {confirmPasswordInputInFocus &&
                  state.form.c_password.length > 0 &&
                  validateRule(
                    state.form.c_password === state.form.password,
                    "Confirm password should match the entered password"
                  )}
              </div>
              <div>
                <InputLabel>First name*</InputLabel>
                <TextInputField
                  fullWidth
                  name="first_name"
                  variant="outlined"
                  margin="dense"
                  value={state.form.first_name}
                  onChange={handleChange}
                  errors={state.errors.first_name}
                />
              </div>

              <div>
                <InputLabel>Last name*</InputLabel>
                <TextInputField
                  fullWidth
                  name="last_name"
                  variant="outlined"
                  margin="dense"
                  value={state.form.last_name}
                  onChange={handleChange}
                  errors={state.errors.last_name}
                />
              </div>

              <div>
                <InputLabel>Email</InputLabel>
                <TextInputField
                  fullWidth
                  name="email"
                  variant="outlined"
                  margin="dense"
                  value={state.form.email}
                  onChange={handleChange}
                  errors={state.errors.email}
                />
              </div>

              <div>
                <InputLabel>Gender*</InputLabel>
                <SelectField
                  name="gender"
                  variant="outlined"
                  margin="dense"
                  value={state.form.gender}
                  options={genderTypes}
                  onChange={handleChange}
                  errors={state.errors.gender}
                />
              </div>

              <div>
                <InputLabel>State*</InputLabel>
                {isStateLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="state"
                    variant="outlined"
                    margin="dense"
                    value={state.form.state}
                    options={states}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchDistricts(String(e.target.value)),
                    ]}
                    errors={state.errors.state}
                  />
                )}
              </div>

              <div>
                <InputLabel>District*</InputLabel>
                {isDistrictLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <SelectField
                    name="district"
                    variant="outlined"
                    margin="dense"
                    value={state.form.district}
                    options={districts}
                    optionValue="name"
                    onChange={(e) => [
                      handleChange(e),
                      fetchLocalBody(String(e.target.value)),
                    ]}
                    errors={state.errors.district}
                  />
                )}
              </div>

              {showLocalbody && (
                <div>
                  <InputLabel>Localbody</InputLabel>
                  {isLocalbodyLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SelectField
                      name="local_body"
                      variant="outlined"
                      margin="dense"
                      value={state.form.local_body}
                      options={localBody}
                      optionValue="name"
                      onChange={handleChange}
                      errors={state.errors.local_body}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
              <Button
                color="default"
                variant="contained"
                onClick={() => goBack()}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                fullWidth
                className="w-full md:w-auto"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                onClick={(e) => handleSubmit(e)}
                startIcon={
                  <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                }
              >
                {buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
