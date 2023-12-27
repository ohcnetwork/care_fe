import { navigate } from "raviger";
import { SyntheticEvent, lazy, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  createFacilityAssetLocation,
  getAnyFacility,
  getFacilityAssetLocation,
  updateFacilityAssetLocation,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
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
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [middlewareAddress, setMiddlewareAddress] = useState("");
  const [description, setDescription] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState("");
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

  useEffect(() => {
    async function fetchFacilityName() {
      setIsLoading(true);
      if (facilityId) {
        const facility = await dispatchAction(getAnyFacility(facilityId));
        setFacilityName(facility?.data?.name || "");
      }
      if (locationId) {
        const res = await dispatchAction(
          getFacilityAssetLocation(facilityId, locationId)
        );

        setName(res?.data?.name || "");
        setLocationName(res?.data?.name || "");
        setDescription(res?.data?.description || "");
        setLocationType(res?.data?.location_type || "");
        setMiddlewareAddress(res?.data?.middleware_address || "");
      }
      setIsLoading(false);
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId, locationId]);

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

    setIsLoading(true);
    const data = {
      name,
      description,
      middleware_address: middlewareAddress,
      location_type: locationType,
    };

    const res = await dispatchAction(
      locationId
        ? updateFacilityAssetLocation(data, facilityId, locationId)
        : createFacilityAssetLocation(data, facilityId)
    );
    setIsLoading(false);
    if (res) {
      if (res.status === 201 || res.status === 200) {
        const notificationMessage = locationId
          ? "Location updated successfully"
          : "Location created successfully";

        Notification.Success({
          msg: notificationMessage,
        });

        navigate(`/facility/${facilityId}/location`, {
          replace: true,
        });
      } else if (res.status === 400) {
        Object.keys(res.data).forEach((key) => {
          setErrors((prevState) => ({
            ...prevState,
            [key]: res.data[key],
          }));
        });
      }
    }
  };

  if (isLoading) {
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
