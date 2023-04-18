import { Card, CardContent } from "@material-ui/core";
import loadable from "@loadable/component";
import React, { useState, useEffect } from "react";
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
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    setErrors({
      name: "",
      description: "",
    });
    e.preventDefault();
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
    <div className="px-2 pb-2 max-w-3xl mx-auto">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          ...(locationId && {
            [locationId]: {
              name: locationName,
              uri: `/facility/${facilityId}/location`,
            },
          }),
        }}
        backUrl={`/facility/${facilityId}/location`}
      />
      <div className="mt-10">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between mt-4">
                <Cancel
                  onClick={() =>
                    navigate(`/facility/${facilityId}/location`, {
                      replace: true,
                    })
                  }
                />
                <Submit onClick={handleSubmit} label={buttonText} />
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
