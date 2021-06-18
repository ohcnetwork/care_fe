import React, { useState, useCallback, useReducer } from "react";
import { InputLabel, Button } from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails, updateUserDetails } from "../../Redux/actions";
import {
  PhoneNumberField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { validateEmailAddress, phonePreg } from "../../Common/validation";
import * as Notification from "../../Utils/Notifications.js";
import { checkIfLatestBundle } from "../../Utils/build-meta-info";
import LanguageSelector from "../../Components/Common/LanguageSelector";

const initForm: any = {
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  email: "",
  phoneNumber: "",
  altPhoneNumber: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const editFormReducer = (states = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...states,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...states,
        errors: action.errors,
      };
    }
    default:
      return states;
  }
};
export default function UserProfile() {
  const [states, dispatch] = useReducer(editFormReducer, initialState);

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const username = currentUser.data.username;

  const [showEdit, setShowEdit] = React.useState<boolean | false>(false);
  const [updateBtnText, setUpdateBtnText] = React.useState<string>("Update");

  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();

  const initialDetails: any = [{}];
  const [details, setDetails] = useState(initialDetails);

  const genderTypes = [
    {
      id: 0,
      text: "Select",
    },
    ...GENDER_TYPES,
  ];

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getUserDetails(username));
      if (!status.aborted) {
        if (res && res.data) {
          setDetails(res.data);
          const formData: any = {
            firstName: res.data.first_name,
            lastName: res.data.last_name,
            age: res.data.age,
            gender: genderTypes.filter((el) => {
              return el.text === res.data.gender;
            })[0].id,
            email: res.data.email,
            phoneNumber: res.data.phone_number,
            altPhoneNumber: res.data.alt_phone_number,
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

  const handleChangeInput = (e: any) => {
    let form = { ...states.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const validateForm = () => {
    let errors = { ...initError };
    let invalidForm = false;
    Object.keys(states.form).forEach((field, i) => {
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
          }
          return;
        case "phoneNumber":
          const phoneNumber = parsePhoneNumberFromString(
            states.form[field],
            "IN"
          );

          let is_valid: boolean = false;
          if (phoneNumber) {
            is_valid = phoneNumber.isValid();
          }

          if (!states.form[field] || !is_valid) {
            errors[field] = "Please enter valid phone number";
            invalidForm = true;
          }
          return;
        case "altPhoneNumber":
          let alt_is_valid: boolean = false;
          if (states.form[field]) {
            const altPhoneNumber = parsePhoneNumberFromString(
              states.form[field],
              "IN"
            );
            if (altPhoneNumber) {
              alt_is_valid = altPhoneNumber.isValid();
            }
          }

          if (!states.form[field] || !alt_is_valid) {
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
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleValueChange = (phoneNo: any, name: string) => {
    if (phoneNo && parsePhoneNumberFromString(phoneNo)?.isPossible()) {
      const form = { ...states.form };
      form[name] = phoneNo;
      dispatch({ type: "set_form", form });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const data = {
        username: username,
        first_name: states.form.firstName,
        last_name: states.form.lastName,
        email: states.form.email,
        phone_number: parsePhoneNumberFromString(
          states.form.phoneNumber
        )?.format("E.164"),
        alt_phone_number: parsePhoneNumberFromString(
          states.form.altPhoneNumber
        )?.format("E.164"),
        gender: Number(states.form.gender),
        age: states.form.age,
      };
      const res = await dispatchAction(updateUserDetails(username, data));
      setIsLoading(false);
      if (res && res.data) {
        Notification.Success({
          msg: "Details updated successfully",
        });
        setDetails({
          ...details,
          first_name: states.form.firstName,
          last_name: states.form.lastName,
          age: states.form.age,
          gender: genderTypes.filter((el) => {
            return el.id === Number(states.form.gender);
          })[0].text,
          email: states.form.email,
          phone_number: states.form.phoneNumber,
          alt_phone_number: states.form.altPhoneNumber,
        });
        setShowEdit(false);
      }
    }
  };

  const checkForNewBuildVersion = async () => {
    let [isLatestBundle, newVersion] = await checkIfLatestBundle();

    if (!isLatestBundle) {
      setUpdateBtnText("updating...");
      localStorage.setItem("build_meta_version", newVersion);

      if ("caches" in window) {
        // Service worker cache should be cleared with caches.delete()
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }

          window.location.reload(true);
        });
      }
    } else {
      setUpdateBtnText("You already have the latest version!");

      setTimeout(() => setUpdateBtnText("Update"), 1000);
    }
  };

  return (
    <div>
      <div className="md:p-20 p-10">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Personal Information
              </h3>
              <p className="mt-1 text-sm leading-5 text-gray-600">
                Local Body, District and State are Non Editable Settings.
              </p>
              <button
                onClick={(_) => setShowEdit(!showEdit)}
                type="button"
                className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:shadow-outline-primary focus:border-primary-700 active:bg-primary-700 mt-4"
              >
                {showEdit ? "Cancel" : "Edit User Profile"}
              </button>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            {!showEdit && (
              <div className="px-4 py-5 sm:px-6 bg-white shadow overflow-hidden  sm:rounded-lg m-2 rounded-lg">
                <dl className="grid grid-cols-1 col-gap-4 row-gap-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Username
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.username || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Contact No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.phone_number || "-"}
                    </dd>
                  </div>

                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Whatsapp No
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.alt_phone_number || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.email || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      First Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.first_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Last Name
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.last_name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Age
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.age || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Verification Status
                    </dt>
                    {details.verified && (
                      <dd className="mt-1 badge badge-pill badge-primary text-sm leading-5 text-gray-900">
                        Verified
                      </dd>
                    )}
                    {!details.verified && (
                      <dd className="mt-1 text-sm leading-5 text-gray-900">
                        Not Verified
                      </dd>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Access Level
                    </dt>
                    <dd className="mt-1 badge badge-pill badge-primary text-sm leading-5 text-gray-900">
                      {details.user_type || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.gender || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      Local Body
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.local_body_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
                      District
                    </dt>
                    <dd className="mt-1 text-sm leading-5 text-gray-900">
                      {details.district_object?.name || "-"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm leading-5 font-medium text-gray-500">
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
              <form action="#" method="POST">
                <div className="shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 bg-white sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium leading-5 text-gray-700"
                        >
                          First name
                        </label>
                        <TextInputField
                          name="firstName"
                          variant="outlined"
                          margin="dense"
                          type="text"
                          className="mt-1 form-input block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                          value={states.form.firstName}
                          onChange={handleChangeInput}
                          errors={states.errors.firstName}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium leading-5 text-gray-700"
                        >
                          Last name
                        </label>
                        <TextInputField
                          name="lastName"
                          variant="outlined"
                          margin="dense"
                          className="mt-1 form-input block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                          type="text"
                          value={states.form.lastName}
                          onChange={handleChangeInput}
                          errors={states.errors.lastName}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="age"
                          className="block text-sm font-medium leading-5 text-gray-700"
                        >
                          Age
                        </label>
                        <TextInputField
                          name="age"
                          className="mt-1 form-input block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                          variant="outlined"
                          margin="dense"
                          value={states.form.age}
                          onChange={handleChangeInput}
                          errors={states.errors.age}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="gender"
                          className="block text-sm font-medium leading-5 text-gray-700"
                        >
                          Gender
                        </label>
                        <SelectField
                          name="gender"
                          variant="outlined"
                          margin="dense"
                          value={states.form.gender}
                          options={genderTypes}
                          onChange={handleChangeInput}
                          errors={states.errors.gender}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <PhoneNumberField
                          label="Phone Number*"
                          value={states.form.phoneNumber}
                          onChange={(value: any) => {
                            handleValueChange(value, "phoneNumber");
                          }}
                          errors={states.errors.phoneNumber}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <PhoneNumberField
                          label="Whatsapp Number*"
                          value={states.form.altPhoneNumber}
                          onChange={(value: any) => {
                            handleValueChange(value, "altPhoneNumber");
                          }}
                          errors={states.errors.altPhoneNumber}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <InputLabel id="email-label">Email*</InputLabel>
                        <TextInputField
                          name="email"
                          variant="outlined"
                          margin="dense"
                          type="text"
                          value={states.form.email}
                          onChange={handleChangeInput}
                          errors={states.errors.email}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <Button
                      color="primary"
                      variant="contained"
                      type="submit"
                      style={{ marginLeft: "auto" }}
                      startIcon={
                        <CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>
                      }
                      onClick={(e) => handleSubmit(e)}
                    >
                      {" "}
                      UPDATE{" "}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="md:grid md:grid-cols-3 md:gap-6 mt-6">
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

        <div className="mt-10">
          <div className="text-lg font-medium leading-6 text-gray-900">
            Check for software updates
            <p className="mt-1 text-sm leading-5 text-gray-600">
              Click the update button to see if you have the latest "care"
              version.
            </p>
          </div>
          <button
            className="bg-white text-sm hover:bg-gray-100 text-gray-800 py-2 px-4 border border-gray-400 rounded shadow text-center outline-none mt-3"
            onClick={() => checkForNewBuildVersion()}
          >
            {updateBtnText}
          </button>
        </div>
      </div>
    </div>
  );
}
