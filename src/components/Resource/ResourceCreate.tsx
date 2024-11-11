import { navigate } from "raviger";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useAppHistory from "@/hooks/useAppHistory";

import {
  OptionsType,
  RESOURCE_CATEGORY_CHOICES,
  RESOURCE_SUBCATEGORIES,
} from "@/common/constants";
import { phonePreg } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { parsePhoneNumber } from "@/Utils/utils";

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
  refering_facility_contact_number: "+91",
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
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

export default function ResourceCreate(props: resourceProps) {
  const { goBack } = useAppHistory();
  const { facilityId } = props;
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

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

  const { data: facilityData } = useQuery(routes.getAnyFacility, {
    prefetch: facilityId !== undefined,
    pathParams: { id: String(facilityId) },
  });

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      switch (field) {
        case "refering_facility_contact_number": {
          const phoneNumber = parsePhoneNumber(state.form[field]);
          if (!state.form[field]) {
            errors[field] = requiredFields[field].errorText;
            isInvalidForm = true;
          } else if (
            !phoneNumber ||
            !PhoneNumberValidator()(phoneNumber) === undefined ||
            !phonePreg(String(phoneNumber))
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

  const handleChange = (e: FieldChangeEvent<string | null>) => {
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

      const resourceData = {
        status: "PENDING",
        category: state.form.category,
        sub_category: state.form.sub_category,
        origin_facility: String(props.facilityId),
        approving_facility: (state.form.approving_facility || {}).id,
        assigned_facility: (state.form.assigned_facility || {}).id,
        emergency: state.form.emergency === "true",
        title: state.form.title,
        reason: state.form.reason,
        refering_facility_contact_name:
          state.form.refering_facility_contact_name,
        refering_facility_contact_number: parsePhoneNumber(
          state.form.refering_facility_contact_number,
        ),
        requested_quantity: state.form.requested_quantity || 0,
      };

      const { res, data } = await request(routes.createResource, {
        body: resourceData,
      });
      setIsLoading(false);

      if (res?.ok && data) {
        await dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Resource request created successfully",
        });

        navigate(`/resource/${data.id}`);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={t("create_resource_request")}
      crumbsReplacements={{
        [facilityId]: { name: facilityData?.name || "" },
        resource: { style: "pointer-events-none" },
      }}
      backUrl={`/facility/${facilityId}`}
    >
      <Card className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
          value={state.form.refering_facility_contact_number}
          onChange={handleFormFieldChange}
          error={state.errors.refering_facility_contact_number}
          types={["mobile", "landline"]}
        />

        <div>
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

        <RadioFormField
          label={t("is_this_an_emergency")}
          name="emergency"
          options={[true, false]}
          optionLabel={(o) => (o ? t("yes") : t("no"))}
          optionValue={(o) => String(o)}
          value={state.form.emergency}
          onChange={handleChange}
        />

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
          onChange={({ value }) => handleValueChange(value, "sub_category")}
        />

        <TextFormField
          label={t("request_title")}
          name="title"
          placeholder={t("request_title_placeholder")}
          value={state.form.title}
          onChange={handleChange}
          error={state.errors.title}
          required
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

        <div className="mt-4 flex flex-col justify-end gap-2 md:col-span-2 md:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit onClick={handleSubmit} />
        </div>
      </Card>
    </Page>
  );
}
