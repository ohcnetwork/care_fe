import { navigate } from "raviger";
import { SyntheticEvent, lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import routes from "../../Redux/api";
import * as Notification from "../../Utils/Notifications.js";
import request from "../../Utils/request/request";
import useQuery from "../../Utils/request/useQuery";
import { AssetLocationType } from "../Assets/AssetTypes";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";

const Loading = lazy(() => import("../Common/Loading"));

interface LocationFormProps {
  facilityId: string;
  locationId?: string;
}

export const AddLocationForm = (props: LocationFormProps) => {
  const { facilityId, locationId } = props;
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [middlewareAddress, setMiddlewareAddress] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<AssetLocationType>(
    AssetLocationType.OTHER
  );
  const [errors, setErrors] = useState<{
    name: string;
    description: string;
    middlewareAddress: string;
    locationType: string;
  }>({
    name: "",
    description: "",
    middlewareAddress: "",
    locationType: "",
  });
  const headerText = !locationId ? "Add Location" : "Update Location";
  const buttonText = !locationId ? "Add Location" : "Update Location";

  const { data: facility } = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
  });

  const { data: location, loading } = useQuery(
    routes.getFacilityAssetLocation,
    {
      pathParams: {
        facility_external_id: facilityId,
        external_id: locationId || "",
      },
    }
  );

  useEffect(() => {
    setName(location?.name || "");
    setDescription(location?.description || "");
    setMiddlewareAddress(location?.middleware_address || "");
    setLocationType(location?.location_type || AssetLocationType.OTHER);
  }, [location]);

  const validateForm = () => {
    let formValid = true;
    const error = {
      name: "",
      description: "",
      middlewareAddress: "",
      locationType: "",
      duty_staff: "",
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
        /^(?!https?:\/\/)[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*\.[a-zA-Z]{2,}$/
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

    const bodyData = {
      name,
      description,
      middleware_address: middlewareAddress,
      location_type: locationType,
    };

    let response: Response | undefined;

    if (locationId) {
      const { res } = await request(routes.updateFacilityAssetLocation, {
        pathParams: {
          facility_external_id: facilityId,
          external_id: locationId,
        },
        body: bodyData,
      });
      response = res;
    } else {
      const { res } = await request(routes.createFacilityAssetLocation, {
        pathParams: { facility_external_id: facilityId },
        body: bodyData,
      });
      response = res;
    }
    if (response) {
      if (response.status === 201 || response.status === 200) {
        const notificationMessage = locationId
          ? "Location updated successfully"
          : "Location created successfully";

        Notification.Success({
          msg: notificationMessage,
        });

        navigate(`/facility/${facilityId}/location`, {
          replace: true,
        });
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Page
      title={headerText}
      backUrl={`/facility/${facilityId}/location`}
      crumbsReplacements={{
        [facilityId]: { name: facility?.name },
        ...(locationId && {
          [locationId]: {
            name: location?.name,
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
                  label={t("name")}
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
                  label={t("description")}
                  value={description}
                  onChange={(e) => setDescription(e.value)}
                  error={errors.description}
                />
              </div>
              <div>
                <SelectFormField
                  id="location-type"
                  name="location_type"
                  label={t("location_type")}
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
                  label={t("location_middleware_address")}
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
