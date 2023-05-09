import { useReducer, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { FacilitySelect } from "../Common/FacilitySelect";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import {
  OptionsType,
  RESOURCE_CATEGORY_CHOICES,
  RESOURCE_SUBCATEGORIES,
} from "../../Common/constants";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Card, CardContent } from "@material-ui/core";
import { phonePreg } from "../../Common/validation";

import { createResource, getAnyFacility } from "../../Redux/actions";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { useTranslation } from "react-i18next";
import TextFormField from "../Form/FormFields/TextFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import RadioFormField from "../Form/FormFields/RadioFormField";
import { FieldLabel } from "../Form/FormFields/FormField";

const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface resourceProps {
  facilityId: number;
}

const initForm: any = {
  category: "OXYGEN",
  sub_category: 1000,
  approving_facility: null,
  assigned_facility: null,
  emergency: "false",
  title: "",
  reason: "",
  refering_facility_contact_name: "",
  refering_facility_contact_number: "",
  required_quantity: null,
};

const requiredFields: any = {
  category: {
    errorText: "Category",
  },
  sub_category: {
    errorText: "Subcategory",
  },
  approving_facility: {
    errorText: "Name of the referring facility",
  },
  refering_facility_contact_name: {
    errorText: "Name of contact of the referring facility",
  },
  refering_facility_contact_number: {
    errorText: "Phone number of contact of the referring facility",
    invalidText: "Please enter valid phone number",
  },
  title: {
    errorText: "Title for resource request is mandatory",
    invalidText: "Please enter title for resource request",
  },
  reason: {
    errorText: "Description of resource request is mandatory",
    invalidText: "Please enter Description of resource request",
  },
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

export default function ResourceCreate(props: resourceProps) {
  const { goBack } = useAppHistory();
  const { facilityId } = props;
  const { t } = useTranslation();

  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");

  const resourceFormReducer = (state = initialState, action: any) => {
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

  const [state, dispatch] = useReducer(resourceFormReducer, initialState);

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      switch (field) {
        case "refering_facility_contact_number": {
          const phoneNumber = parsePhoneNumberFromString(state.form[field]);
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          } else if (
            !phoneNumber?.isPossible() ||
            !phonePreg(String(phoneNumber?.number))
          ) {
            errors[field] = requiredFields[field].invalidText;
            isInvalidForm = true;
          }
          return;
        }
        default:
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          }
      }
    });

    dispatch({ type: "set_error", errors });
    return !isInvalidForm;
  };

  const handleChange = (e: FieldChangeEvent<string>) => {
    const form = { ...state.form };
    const { name, value } = e;
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    form[name] = value;
    dispatch({ type: "set_form", form });
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [event.name]: event.value },
    });
  };

  const handleSubmit = async () => {
    const validForm = validateForm();

    if (validForm) {
      setIsLoading(true);

      const data = {
        status: "PENDING",
        category: state.form.category,
        sub_category: state.form.sub_category,
        orgin_facility: props.facilityId,
        approving_facility: (state.form.approving_facility || {}).id,
        assigned_facility: (state.form.assigned_facility || {}).id,
        emergency: state.form.emergency === "true",
        title: state.form.title,
        reason: state.form.reason,
        refering_facility_contact_name:
          state.form.refering_facility_contact_name,
        refering_facility_contact_number: parsePhoneNumberFromString(
          state.form.refering_facility_contact_number
        )?.format("E.164"),
        requested_quantity: state.form.requested_quantity || 0,
      };

      const res = await dispatchAction(createResource(data));
      setIsLoading(false);

      if (res && res.data && (res.status == 201 || res.status == 200)) {
        await dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Resource request created successfully",
        });

        navigate(`/resource/${res.data.id}`);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={t("create_resource_request")}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          resource: { style: "pointer-events-none" },
        }}
        backUrl={`/facility/${facilityId}`}
      />
      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <TextFormField
                required
                label={t("contact_person")}
                name="refering_facility_contact_name"
                value={state.form.refering_facility_contact_name}
                onChange={handleChange}
                error={state.errors.refering_facility_contact_name}
              />
              <PhoneNumberFormField
                label={t("contact_phone")}
                name="refering_facility_contact_number"
                required
                onlyIndia
                value={state.form.refering_facility_contact_number}
                onChange={handleFormFieldChange}
                error={state.errors.refering_facility_contact_number}
              />

              <div className="md:col-span-2">
                <FieldLabel required>{t("approving_facility")}</FieldLabel>
                <FacilitySelect
                  multiple={false}
                  facilityType={1500}
                  name="approving_facility"
                  selected={state.form.approving_facility}
                  setSelected={(value: any) =>
                    handleValueChange(value, "approving_facility")
                  }
                  errors={state.errors.approving_facility}
                />
              </div>

              <SelectFormField
                label={t("category")}
                name="category"
                required
                value={state.form.category}
                options={RESOURCE_CATEGORY_CHOICES}
                optionLabel={(option: string) => option}
                optionValue={(option: string) => option}
                onChange={({ value }) => handleValueChange(value, "category")}
              />
              <SelectFormField
                label={t("sub_category")}
                name="sub_category"
                required
                value={state.form.sub_category}
                options={RESOURCE_SUBCATEGORIES}
                optionLabel={(option: OptionsType) => option.text}
                optionValue={(option: OptionsType) => option.id}
                onChange={({ value }) =>
                  handleValueChange(value, "sub_category")
                }
              />

              <TextFormField
                label={t("request_title")}
                name="title"
                placeholder={t("request_title_placeholder")}
                value={state.form.title}
                onChange={handleChange}
                error={state.errors.title}
              />

              <TextFormField
                label={t("required_quantity")}
                name="requested_quantity"
                value={state.form.required_quantity}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <TextAreaFormField
                  label={t("request_description")}
                  name="reason"
                  rows={5}
                  required
                  placeholder={t("request_description_placeholder")}
                  value={state.form.reason}
                  onChange={handleChange}
                  error={state.errors.reason}
                />
              </div>

              <RadioFormField
                label={t("is_this_an_emergency")}
                name="emergency"
                options={[true, false]}
                optionDisplay={(o) => (o ? t("yes") : t("no"))}
                optionValue={(o) => String(o)}
                value={state.form.emergency}
                onChange={handleChange}
              />

              <div className="md:col-span-2 flex flex-col md:flex-row gap-2 justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={handleSubmit} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
