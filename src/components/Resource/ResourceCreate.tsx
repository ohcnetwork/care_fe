import { navigate, useQueryParams } from "raviger";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import {
  PhoneNumberValidator,
  RequiredFieldValidator,
} from "@/components/Form/FieldValidators";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import useAppHistory from "@/hooks/useAppHistory";

import {
  OptionsType,
  RESOURCE_CATEGORY_CHOICES,
  RESOURCE_CHOICES,
  RESOURCE_SUBCATEGORIES,
} from "@/common/constants";
import { phonePreg } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { parsePhoneNumber } from "@/Utils/utils";

import CircularProgress from "../Common/CircularProgress";
import UserAutocomplete from "../Common/UserAutocompleteFormField";
import { ResourceModel } from "../Facility/models";
import Form from "../Form/Form";

interface resourceProps {
  facilityId?: number;
  resourceId?: string;
}

type ResourceData = Partial<
  Omit<
    ResourceModel,
    | "status"
    | "requested_quantity"
    | "assigned_quantity"
    | "emergency"
    | "sub_category"
  >
> & {
  sub_category: number;
  status: string;
  requested_quantity: string;
  assigned_quantity: string;
  emergency: string;
};

const initForm: ResourceData = {
  status: "PENDING",
  category: "OXYGEN",
  sub_category: 1000,
  approving_facility_object: null,
  assigned_facility_object: null,
  emergency: "false",
  title: "",
  reason: "",
  refering_facility_contact_name: "",
  refering_facility_contact_number: "+91",
  assigned_to_object: null,
  requested_quantity: "",
  assigned_quantity: "",
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
  const { facilityId, resourceId } = props;
  const { t } = useTranslation();
  const [qParams, _] = useQueryParams();
  const [isLoading, setIsLoading] = useState(false);
  const [initialResourceData, setInitialResouceData] =
    useState<ResourceData>(initForm);
  const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

  const requiredFields: any = {
    category: {
      errorText: t("category"),
    },
    sub_category: {
      errorText: t("sub_category"),
    },
    approving_facility_object: {
      errorText: t("approving_facility_error"),
    },
    refering_facility_contact_name: {
      errorText: t("referring_facility_contact_name_error"),
    },
    refering_facility_contact_number: {
      errorText: t("referring_facility_contact_number_error"),
      invalidText: t("referring_facility_contact_number_invalid"),
    },
    title: {
      errorText: t("title_error"),
      invalidText: t("title_invalid"),
    },
    reason: {
      errorText: t("reason_error"),
      invalidText: t("reason_invalid"),
    },
    requested_quantity: {
      errorText: t("requested_quantity_error"),
    },
    assigned_quantity: {
      errorText: t("assigned_quantity_error"),
    },
  };

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
    pathParams: { id: String(facilityId) },
    prefetch: !!facilityId,
  });

  const resourceQuery = useQuery(routes.getResourceDetails, {
    pathParams: {
      id: resourceId!,
    },
    prefetch: !!resourceId,
    onResponse: ({ data: resource }) => {
      if (!resource) return;

      setInitialResouceData({
        ...resource,
        sub_category:
          Number(
            RESOURCE_SUBCATEGORIES.find(
              (item) => item.text === resource.sub_category,
            )?.id,
          ) ?? 1000,
        emergency: resource.emergency ? "true" : "false",
        requested_quantity: resource.requested_quantity.toString(),
        assigned_quantity: resource.assigned_quantity.toString(),
        status: qParams.status || resource.status,
      });
      dispatch({ type: "set_form", form: resource });

      setIsLoading(false);
    },
  });

  const { loading: assignedUserLoading } = useQuery(routes.userList, {
    prefetch: !!resourceId,
  });

  const ResourceFormValidator = (
    form: ResourceData,
  ): Partial<Record<keyof ResourceData, string>> => {
    const errors: Partial<Record<keyof ResourceData, string>> = {};

    Object.entries(requiredFields).forEach(([field, config]) => {
      const { errorText, invalidText }: any = config;

      switch (field) {
        case "refering_facility_contact_number": {
          if (resourceId) break;
          const phoneNumber = parsePhoneNumber(form[field] ?? "");
          if (!form[field as keyof ResourceData]) {
            errors[field as keyof ResourceData] = errorText;
          } else if (
            !phoneNumber ||
            !PhoneNumberValidator()(phoneNumber) === undefined ||
            !phonePreg(String(phoneNumber))
          ) {
            errors[field as keyof ResourceData] = invalidText;
          }
          break;
        }
        case "requested_quantity":
        case "assigned_quantity": {
          if (!resourceId && field === "assigned_quantity") break;
          const value = form[field as keyof ResourceData];
          const minVal = field === "assigned_quantity" ? 0 : 1;
          if (!value || parseFloat(String(value)) < minVal) {
            errors[field as keyof ResourceData] = errorText;
          }
          break;
        }
        case "approving_facility_object":
          if (!form[field]?.name) {
            errors[field as keyof ResourceData] = errorText;
          }
          break;
        default:
          if (!form[field as keyof ResourceData]) {
            errors[field as keyof ResourceData] = errorText;
          }
          break;
      }
    });
    dispatch({ type: "set_error", errors });
    return errors;
  };

  const handleSubmit = async (form: ResourceData) => {
    setIsLoading(true);

    const resourceData = {
      status: form.status || "PENDING",
      category: form.category,
      sub_category: form.sub_category?.toString(),
      origin_facility:
        form.origin_facility_object?.id || String(props.facilityId),
      approving_facility: (form.approving_facility_object || {}).id,
      assigned_facility: (form.assigned_facility_object || {}).id,
      emergency: form.emergency === "true",
      title: form.title,
      reason: form.reason,
      refering_facility_contact_name: form.refering_facility_contact_name,
      refering_facility_contact_number: parsePhoneNumber(
        form.refering_facility_contact_number ?? "",
      ),
      requested_quantity: parseFloat(form.requested_quantity || "1"),
      assigned_quantity: parseFloat(form.assigned_quantity || "0"),
      assigned_to_object: form.assigned_to_object,
      assigned_to: form.assigned_to_object?.id.toString() ?? undefined,
    };

    if (resourceId) {
      const { res, data } = await request(routes.updateResource, {
        pathParams: { id: resourceId },
        body: resourceData,
      });

      if (res && res.status == 200 && data) {
        dispatch({ type: "set_form", form: data });
        Notification.Success({
          msg: "Resource request updated successfully",
        });

        navigate(`/resource/${resourceId}`);
      }
      setIsLoading(false);
    } else {
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

  if (isLoading || resourceQuery.loading) {
    return <Loading />;
  }

  return (
    <Page
      title={
        resourceId ? t("update_resource_request") : t("create_resource_request")
      }
      crumbsReplacements={{
        ...(resourceId
          ? { [resourceId]: { name: initialResourceData?.title } }
          : { [String(facilityId)]: { name: facilityData?.name || "" } }),
        resource: { style: "pointer-events-none" },
      }}
      backUrl={
        resourceId ? `/resource/${resourceId}` : `/facility/${facilityId}`
      }
    >
      <Form<ResourceData>
        disabled={isLoading}
        defaults={initialResourceData}
        onCancel={goBack}
        className="rounded transition-all sm:rounded-xl bg-white mt-2"
        onSubmit={handleSubmit}
        validate={ResourceFormValidator}
      >
        {(field) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Create Flow */}
            {!resourceId && (
              <>
                <TextFormField
                  {...field(
                    "refering_facility_contact_name",
                    RequiredFieldValidator(
                      t("referring_facility_contact_name_error"),
                    ),
                  )}
                  label={t("contact_person")}
                  required
                />
                <PhoneNumberFormField
                  {...field(
                    "refering_facility_contact_number",
                    RequiredFieldValidator(
                      t("referring_facility_contact_number_error"),
                    ),
                  )}
                  label={t("contact_phone")}
                  types={["mobile", "landline"]}
                  required
                />

                <div>
                  <FieldLabel required>{t("approving_facility")}</FieldLabel>
                  <FacilitySelect
                    multiple={false}
                    facilityType={1500}
                    selected={field("approving_facility_object").value}
                    setSelected={(selected: any) => {
                      field("approving_facility_object").onChange({
                        name: "approving_facility_object",
                        value: selected,
                      });
                    }}
                    {...field(
                      "approving_facility_object",
                      RequiredFieldValidator(t("approving_facility_error")),
                    )}
                    errors={state.errors.approving_facility_object}
                  />
                </div>
                <RadioFormField
                  label={t("is_this_an_emergency")}
                  options={[true, false]}
                  optionLabel={(o) => (o ? t("yes") : t("no"))}
                  optionValue={(o) => String(o)}
                  {...field("emergency")}
                />

                <SelectFormField
                  {...field("category", RequiredFieldValidator(t("category")))}
                  label={t("category")}
                  value={field("category").value}
                  options={RESOURCE_CATEGORY_CHOICES}
                  optionLabel={(option: string) => option}
                  optionValue={(option: string) => option}
                  required
                />
                <SelectFormField
                  {...field(
                    "sub_category",
                    RequiredFieldValidator(t("sub_category")),
                  )}
                  label={t("sub_category")}
                  required
                  value={field("sub_category").value}
                  options={RESOURCE_SUBCATEGORIES}
                  optionLabel={(option: OptionsType) => option.text}
                  optionValue={(option: OptionsType) => option.id}
                />

                <TextFormField
                  {...field("title", RequiredFieldValidator(t("title_error")))}
                  label={t("request_title")}
                  placeholder={t("request_title_placeholder")}
                  required
                />
                <TextFormField
                  {...field(
                    "requested_quantity",
                    RequiredFieldValidator(t("requested_quantity_error")),
                  )}
                  label={t("required_quantity")}
                  type="number"
                  min={1}
                />
                <div className="md:col-span-2">
                  <TextAreaFormField
                    {...field(
                      "reason",
                      RequiredFieldValidator(t("reason_error")),
                    )}
                    label={t("request_description")}
                    rows={5}
                    placeholder={t("request_description_placeholder")}
                    required
                  />
                </div>
              </>
            )}

            {/* Update Flow */}
            {resourceId && (
              <>
                <SelectFormField
                  label="Status"
                  options={resourceStatusOptions}
                  optionLabel={(option) => option}
                  {...field("status")}
                />
                {assignedUserLoading ? (
                  <CircularProgress />
                ) : (
                  <UserAutocomplete
                    label="Assigned To"
                    {...field("assigned_to_object")}
                  />
                )}

                <div>
                  <FieldLabel required>{t("approving_facility")}</FieldLabel>
                  <FacilitySelect
                    multiple={false}
                    facilityType={1500}
                    selected={field("approving_facility_object").value}
                    setSelected={(selected: any) => {
                      field("approving_facility_object").onChange({
                        name: "approving_facility_object",
                        value: selected,
                      });
                    }}
                    {...field(
                      "approving_facility_object",
                      RequiredFieldValidator(t("approving_facility_error")),
                    )}
                    errors={state.errors.approving_facility_object}
                  />
                </div>
                <div>
                  <FieldLabel>{t("assign_facility_label")}</FieldLabel>
                  <FacilitySelect
                    multiple={false}
                    facilityType={1510}
                    {...field("assigned_facility_object")}
                    selected={field("assigned_facility_object").value}
                    setSelected={(selected: any) => {
                      field("assigned_facility_object").onChange({
                        name: "assigned_facility_object",
                        value: selected,
                      });
                    }}
                    errors={state.errors.assigned_facility_object}
                  />
                </div>

                <TextFormField
                  {...field(
                    "requested_quantity",
                    RequiredFieldValidator(t("requested_quantity_error")),
                  )}
                  label={t("required_quantity")}
                  type="number"
                  min={1}
                />
                <TextFormField
                  {...field(
                    "assigned_quantity",
                    RequiredFieldValidator(t("assigned_quantity_error")),
                  )}
                  type="number"
                  min={0}
                  label="Approved Quantity"
                  disabled={field("status").value !== "PENDING"}
                />

                <TextFormField
                  {...field("title", RequiredFieldValidator(t("title_error")))}
                  label={t("request_title")}
                  placeholder={t("request_title_placeholder")}
                  required
                />
                <RadioFormField
                  label={t("is_this_an_emergency")}
                  options={[true, false]}
                  optionLabel={(o) => (o ? t("yes") : t("no"))}
                  optionValue={(o) => String(o)}
                  {...field("emergency")}
                />
                <div className="md:col-span-2">
                  <TextAreaFormField
                    {...field(
                      "reason",
                      RequiredFieldValidator(t("reason_error")),
                    )}
                    label={t("request_description")}
                    rows={5}
                    placeholder={t("request_description_placeholder")}
                    required
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Form>
    </Page>
  );
}
