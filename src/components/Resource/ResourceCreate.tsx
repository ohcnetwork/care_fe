import { useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

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

import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";
import { phonePreg } from "@/common/validation";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { parsePhoneNumber } from "@/Utils/utils";
import { CreateResourceRequest } from "@/types/resourceRequest/resourceRequest";

interface resourceProps {
  facilityId: number;
}

const initForm: Partial<CreateResourceRequest> = {
  category: "",
  assigned_facility: undefined,
  emergency: false,
  title: "",
  reason: "",
  referring_facility_contact_name: "",
  referring_facility_contact_number: "+91",
  related_patient: undefined,
  priority: 1,
};

const requiredFields: any = {
  category: {
    errorText: "Category",
  },
  sub_category: {
    errorText: "Subcategory",
  },
  assigned_facility: {
    errorText: "Name of the facility",
  },
  referring_facility_contact_name: {
    errorText: "Name of contact of the referring facility",
  },
  referring_facility_contact_number: {
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
  const [{ related_patient }] = useQueryParams();

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

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: () =>
      query(routes.getAnyFacility, {
        pathParams: { id: String(facilityId) },
      }),
    enabled: !!facilityId,
  });

  const validateForm = () => {
    const errors = { ...initError };
    let isInvalidForm = false;
    Object.keys(requiredFields).forEach((field) => {
      switch (field) {
        case "referring_facility_contact_number": {
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

      const resourceData: CreateResourceRequest = {
        status: "PENDING",
        category: state.form.category,
        origin_facility: String(props.facilityId),
        assigned_facility: (state.form.assigned_facility || {}).id,
        approving_facility: null,
        emergency: state.form.emergency === "true",
        title: state.form.title,
        reason: state.form.reason,
        referring_facility_contact_name:
          state.form.referring_facility_contact_name,
        referring_facility_contact_number:
          parsePhoneNumber(state.form.referring_facility_contact_number) ?? "",
        related_patient: related_patient,
        priority: state.form.priority,
      };

      const { res, data } = await request(routes.createResource, {
        body: resourceData,
      });
      setIsLoading(false);

      if (res?.ok && data) {
        await dispatch({ type: "set_form", form: initForm });
        toast.success(t("resource_created_successfully"));
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
        {related_patient && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <CareIcon icon="l-user" className="text-lg text-blue-700" />
              <span className="text-sm text-blue-700">
                Linked Patient:{" "}
                <span className="font-medium">{related_patient}</span>
              </span>
            </div>
          </div>
        )}

        <div>
          <FieldLabel required>{t("organization_for_care_support")}</FieldLabel>
          <FacilitySelect
            multiple={false}
            name="assigned_facility"
            selected={state.form.assigned_facility}
            setSelected={(value: any) =>
              handleValueChange(value, "assigned_facility")
            }
            errors={state.errors.assigned_facility}
          />
        </div>
        <span className="pt-4 px-4 bg-red-200/50 rounded-lg">
          <RadioFormField
            label={t("is_this_an_emergency")}
            name="emergency"
            options={[true, false]}
            optionLabel={(o) => (o ? t("yes") : t("no"))}
            optionValue={(o) => String(o)}
            value={state.form.emergency}
            onChange={handleChange}
          />
        </span>

        <SelectFormField
          label={t("category")}
          name="category"
          required
          value={state.form.category}
          options={RESOURCE_CATEGORY_CHOICES}
          optionLabel={(option: { text: string; id: string }) => option.text}
          optionValue={(option: { text: string; id: string }) => option.id}
          onChange={({ value }) => handleValueChange(value, "category")}
        />
        <div className="md:col-span-2">
          <TextFormField
            label={t("request_title")}
            name="title"
            placeholder={t("request_title_placeholder")}
            value={state.form.title}
            onChange={handleChange}
            error={state.errors.title}
            required
          />
        </div>

        <div className="md:col-span-2">
          <TextAreaFormField
            label={t("request_reason")}
            name="reason"
            rows={5}
            required
            placeholder={t("request_reason_placeholder")}
            value={state.form.reason}
            onChange={handleChange}
            error={state.errors.reason}
          />
        </div>

        <TextFormField
          required
          label={t("contact_person")}
          name="referring_facility_contact_name"
          value={state.form.referring_facility_contact_name}
          onChange={handleChange}
          error={state.errors.referring_facility_contact_name}
        />
        <PhoneNumberFormField
          label={t("contact_phone")}
          name="referring_facility_contact_number"
          required
          value={state.form.referring_facility_contact_number}
          onChange={handleFormFieldChange}
          error={state.errors.referring_facility_contact_number}
          types={["mobile", "landline"]}
        />

        <div className="mt-4 flex flex-col justify-end gap-2 md:col-span-2 md:flex-row">
          <Button type="button" variant="outline" onClick={() => goBack()}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="primary" onClick={handleSubmit}>
            {t("submit")}
          </Button>
        </div>
      </Card>
    </Page>
  );
}
