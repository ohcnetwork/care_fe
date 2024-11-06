import { navigate } from "raviger";
import { SyntheticEvent, useState } from "react";

import { AssetLocationType } from "@/components/Assets/AssetTypes";
import { Cancel, Submit } from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

interface Props {
  facilityId: string;
  locationId?: string;
}

export const AddLocationForm = ({ facilityId, locationId }: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [middlewareAddress, setMiddlewareAddress] = useState("");
  const [description, setDescription] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState("");
  const [errors, setErrors] = useState<any>({
    name: "",
    description: "",
    middlewareAddress: "",
    locationType: "",
  });
  const headerText = !locationId ? "Add Location" : "Update Location";
  const buttonText = !locationId ? "Add Location" : "Update Location";

  const facilityQuery = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
    prefetch: !locationId,
    onResponse: ({ data }) => {
      data?.name && setFacilityName(data.name);
    },
  });

  const locationQuery = useQuery(routes.getFacilityAssetLocation, {
    pathParams: {
      facility_external_id: facilityId,
      external_id: locationId!,
    },
    prefetch: !!locationId,
    onResponse: ({ data }) => {
      if (!data) return;
      setFacilityName(data.facility?.name ?? "");
      setName(data.name);
      setLocationName(data.name);
      setDescription(data.description);
      setLocationType(data.location_type);
      setMiddlewareAddress(data.middleware_address ?? "");
    },
  });

  const validateForm = () => {
    let formValid = true;
    const error = {
      name: "",
      description: "",
      middlewareAddress: "",
      locationType: "",
    };

    if (name.trim().length === 0) {
      error.name = "Name is required";
      formValid = false;
    }

    if (locationType.trim().length === 0) {
      error.locationType = "Location Type is required";
      formValid = false;
    }

    if (
      middlewareAddress &&
      middlewareAddress.match(
        /^(?!https?:\/\/)[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*\.[a-zA-Z]{2,}$/,
      ) === null
    ) {
      error.middlewareAddress = "Invalid Middleware Address";
      formValid = false;
    }

    setErrors(error);
    return formValid;
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const data = {
      name,
      description,
      middleware_address: middlewareAddress,
      location_type: locationType as AssetLocationType,
    };

    const { res, error } = await (locationId
      ? request(routes.updateFacilityAssetLocation, {
          body: data,
          pathParams: {
            facility_external_id: facilityId,
            external_id: locationId,
          },
        })
      : request(routes.createFacilityAssetLocation, {
          body: data,
          pathParams: { facility_external_id: facilityId },
        }));

    setIsLoading(false);

    if (res?.ok) {
      navigate(`/facility/${facilityId}/location`, { replace: true });
      Notification.Success({
        msg: locationId
          ? "Location updated successfully"
          : "Location created successfully",
      });
      return;
    }

    if (error) {
      setErrors(error);
    }
  };

  if (isLoading || locationQuery.loading || facilityQuery.loading) {
    return <Loading />;
  }

  return (
    <Page
      title={headerText}
      backUrl={`/facility/${facilityId}/location`}
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        ...(locationId && {
          [locationId]: {
            name: locationName,
            uri: `/facility/${facilityId}/location`,
          },
        }),
      }}
    >
      <div className="mt-10">
        <div className="cui-card">
          <form onSubmit={handleSubmit}>
            <div className="mt-2 grid grid-cols-1 gap-4">
              <div>
                <TextFormField
                  name="name"
                  type="text"
                  label="Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.value)}
                  error={errors.name}
                />
              </div>
              <div>
                <TextAreaFormField
                  rows={5}
                  name="description"
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.value)}
                  error={errors.description}
                />
              </div>
              <div>
                <SelectFormField
                  id="location-type"
                  name="location_type"
                  label="Location Type"
                  options={[
                    { title: "ICU", value: AssetLocationType.ICU },
                    {
                      title: "WARD",
                      value: AssetLocationType.WARD,
                    },
                    { title: "OTHER", value: AssetLocationType.OTHER },
                  ]}
                  optionLabel={({ title }) => title}
                  optionValue={({ value }) => value}
                  value={locationType}
                  required
                  onChange={({ value }) => setLocationType(value)}
                  error={errors.locationType}
                />
              </div>
              <div>
                <TextFormField
                  id="location-middleware-address"
                  name="Location Middleware Address"
                  type="text"
                  label="Location Middleware Address"
                  value={middlewareAddress}
                  onChange={(e) => setMiddlewareAddress(e.value)}
                  error={errors.middlewareAddress}
                />
              </div>
            </div>
            <div className="cui-form-button-group mt-4">
              <Cancel
                onClick={() =>
                  navigate(`/facility/${facilityId}/location`, {
                    replace: true,
                  })
                }
              />
              <Submit onClick={handleSubmit} label={buttonText} />
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
};
