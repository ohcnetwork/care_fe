import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createFacilityBed, getAnyFacility } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import {
  MultilineInputField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { LOCATION_BED_TYPES } from "../../Common/constants";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const goBack = () => {
  window.history.go(-1);
};

interface BedFormProps {
  facilityId: string;
  locationId: string;
}

export const AddBedForm = (props: BedFormProps) => {
  const { facilityId, locationId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [bedType, setBedType] = useState<string>("");
  const [facilityName, setFacilityName] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    bedType: "",
  });

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  const validateInputs = (data: {
    name: string;
    description: string;
    bed_type: string;
  }) => {
    let isValid = true;
    if (!data.name) {
      isValid = false;
      setErrors((prev) => ({ ...prev, name: "Please enter a name" }));
    }
    if (!data.description) {
      isValid = false;
      setErrors((prev) => ({
        ...prev,
        description: "Please enter a description",
      }));
    }
    if (!data.bed_type) {
      isValid = false;
      setErrors((prev) => ({ ...prev, bedType: "Please select a bed type" }));
    }

    return isValid;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const data = {
      name,
      description,
      bed_type: bedType,
    };

    if (!validateInputs(data)) return;

    setIsLoading(true);

    const res = await dispatchAction(
      createFacilityBed(data, facilityId, locationId)
    );
    setIsLoading(false);
    if (res && res.status === 201) {
      Notification.Success({
        msg: "Bed created successfully",
      });
    }
    goBack();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2">
      <PageTitle
        title="Add Bed"
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <InputLabel id="name">Name*</InputLabel>
                  <TextInputField
                    name="name"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    errors={errors.name}
                  />
                </div>
                <div>
                  <InputLabel id="description">Description*</InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="description"
                    variant="outlined"
                    margin="dense"
                    type="float"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    errors={errors.description}
                  />
                </div>
              </div>
              <div>
                <InputLabel id="bedType">Bed Type*</InputLabel>
                <SelectField
                  id="bed-type"
                  fullWidth
                  name="bed_type"
                  placeholder=""
                  variant="outlined"
                  margin="dense"
                  options={[
                    {
                      id: "",
                      name: "Select",
                    },
                    ...LOCATION_BED_TYPES,
                  ]}
                  optionValue="name"
                  value={bedType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBedType(e.target.value)
                  }
                  errors={errors.bedType}
                />
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
                  Add Bed
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
