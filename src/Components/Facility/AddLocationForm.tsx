import { useState, useEffect, lazy, SyntheticEvent } from "react";
import { useDispatch } from "react-redux";
import {
  createFacilityAssetLocation,
  getAnyFacility,
  getFacilityAssetLocation,
  updateFacilityAssetLocation,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import { Submit, Cancel } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import Page from "../Common/components/Page";

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
  const [description, setDescription] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [errors, setErrors] = useState<any>({
    name: "",
    description: "",
  });
  const headerText = !locationId ? "Add Location" : "Update Location";
  const buttonText = !locationId ? "Add Location" : "Update Location";

  useEffect(() => {
    async function fetchFacilityName() {
      setIsLoading(true);
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      }
      if (locationId) {
        const res = await dispatchAction(
          getFacilityAssetLocation(facilityId, locationId)
        );

        setName(res?.data?.name || "");
        setLocationName(res?.data?.name || "");
        setDescription(res?.data?.description || "");
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
    };

    if (name.trim().length === 0) {
      error.name = "Name is required";
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

        navigate(`/facility/${facilityId}/location`, {
          replace: true,
        });
        Notification.Success({
          msg: notificationMessage,
        });
      } else if (res.status === 400) {
        Object.keys(res.data).forEach((key) => {
          setErrors((prevState: any) => ({
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
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
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
