import { Card, CardContent, InputLabel } from "@material-ui/core";
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
import {
  MultilineInputField,
  TextInputField,
} from "../Common/HelperInputFields";
import { navigate } from "raviger";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
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
    if (res && (res.status === 201 || res.status === 200)) {
      const notificationMessage = locationId
        ? "Location updated successfully"
        : "Location created successfully";

      navigate(`/facility/${facilityId}/location`, {
        replace: true,
      });
      Notification.Success({
        msg: notificationMessage,
      });
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
      />
      <div className="mt-10">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1">
                <div>
                  <InputLabel id="name">Name *</InputLabel>
                  <TextInputField
                    name="name"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    errors=""
                  />
                </div>
                <div>
                  <InputLabel id="description">Description</InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="description"
                    variant="outlined"
                    margin="dense"
                    type="float"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    errors=""
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between mt-4">
                <ButtonV2
                  onClick={() =>
                    navigate(`/facility/${facilityId}/location`, {
                      replace: true,
                    })
                  }
                  variant="secondary"
                >
                  <CareIcon className="care-l-times-circle h-5" />
                  Cancel
                </ButtonV2>
                <ButtonV2 type="submit" onClick={(e) => handleSubmit(e)}>
                  <CareIcon className="care-l-check-circle h-5" />
                  {buttonText}
                </ButtonV2>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
