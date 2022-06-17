import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
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
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const goBack = () => {
  window.history.go(-1);
};

interface LocationFormProps {
  facilityId: string;
  locationId?: string;
}

export const AddLocationForm = (props: LocationFormProps) => {
  const { facilityId, locationId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [facilityName, setFacilityName] = useState("");

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
      if (locationId) {
        navigate(`/facility/${facilityId}/location`);
        Notification.Success({
          msg: "Location updated successfully",
        });
      } else {
        navigate(`/facility/${facilityId}/location/${res.data.id}/beds/add`);
        Notification.Success({
          msg: "Location created successfully",
        });
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2">
      <PageTitle
        title={headerText}
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
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
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={goBack}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                  onClick={(e) => handleSubmit(e)}
                >
                  {buttonText}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
