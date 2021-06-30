import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createFacilityAssetLocation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import {
  MultilineInputField,
  TextInputField,
} from "../Common/HelperInputFields";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const goBack = () => {
  window.history.go(-1);
};

interface LocationFormProps {
  facilityId: string;
}

export const AddLocationForm = (props: LocationFormProps) => {
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      name,
      description,
    };

    const res = await dispatchAction(
      createFacilityAssetLocation(data, facilityId)
    );
    setIsLoading(false);
    if (res && res.status === 201) {
      Notification.Success({
        msg: "Location created successfully",
      });
    }
    goBack();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2">
      <PageTitle title="Add Location" />
      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <InputLabel id="name">Name</InputLabel>
                  <TextInputField
                    name="name"
                    variant="outlined"
                    margin="dense"
                    type="text"
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
              <div className="flex justify-between mt-4">
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
                  style={{ marginLeft: "auto" }}
                  startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                  onClick={(e) => handleSubmit(e)}
                >
                  Add Location
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
