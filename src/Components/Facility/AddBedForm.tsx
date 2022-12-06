import { Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  createFacilityBed,
  getAnyFacility,
  getFacilityAssetLocation,
  getFacilityBed,
  updateFacilityBed,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import {
  MultilineInputField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import { navigate } from "raviger";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface BedFormProps {
  facilityId: string;
  locationId: string;
  bedId?: string;
}

export const AddBedForm = (props: BedFormProps) => {
  const { facilityId, locationId, bedId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [bedType, setBedType] = useState<string>("");
  const [facilityName, setFacilityName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [bedName, setBedName] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    bedType: "",
  });

  const headerText = !bedId ? "Add Bed" : "Update Bed";
  const buttonText = !bedId ? "Add Bed" : "Update Bed";

  useEffect(() => {
    async function fetchFacilityLocationAndBed() {
      setIsLoading(true);
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));
        setFacilityName(res?.data?.name || "");
      }
      if (facilityId && locationId) {
        const res = await dispatchAction(
          getFacilityAssetLocation(facilityId, locationId)
        );
        setLocationName(res?.data?.name || "");
      }
      if (facilityId && locationId && bedId) {
        const res = await dispatchAction(
          getFacilityBed(facilityId, locationId, bedId)
        );
        setName(res?.data?.name || "");
        setBedName(res?.data?.name || "");
        setDescription(res?.data?.description || "");
        setBedType(res?.data?.bed_type || "");
      }
      setIsLoading(false);
    }
    fetchFacilityLocationAndBed();
  }, [dispatchAction, facilityId, locationId]);

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
      bedId
        ? updateFacilityBed(data, facilityId, bedId, locationId)
        : createFacilityBed(data, facilityId, locationId)
    );
    setIsLoading(false);
    if (res && (res.status === 201 || res.status === 200)) {
      const notificationMessage = bedId
        ? "Bed updated successfully"
        : "Bed created successfully";

      navigate(`/facility/${facilityId}/location/${locationId}/beds`, {
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
        backButtonCB={() => {
          navigate(`/facility/${facilityId}/location/${locationId}/beds`, {
            replace: true,
          });

          return 0;
        }}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [locationId]: {
            name: locationName,
            uri: `/facility/${facilityId}/location`,
          },
          ...(bedId && {
            [bedId]: {
              name: bedName,
              uri: `/facility/${facilityId}/location/${locationId}/beds`,
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
                  <InputLabel id="description">Description</InputLabel>
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

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <ButtonV2
                    variant="secondary"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/location/${locationId}/beds`,
                        { replace: true }
                      )
                    }
                  >
                    <CareIcon className="care-l-times-circle h-5" />
                    Cancel
                  </ButtonV2>
                  <ButtonV2 type="submit" onClick={(e) => handleSubmit(e)}>
                    <CareIcon className="care-l-check-circle h-5" />
                    {buttonText}
                  </ButtonV2>
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
