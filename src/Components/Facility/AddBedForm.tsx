import Card from "../../CAREUI/display/Card";

import { useState, useEffect, lazy, SyntheticEvent } from "react";
import { useDispatch } from "react-redux";
import {
  createFacilityBed,
  getAnyFacility,
  getFacilityAssetLocation,
  getFacilityBed,
  updateFacilityBed,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import { navigate } from "raviger";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import Page from "../Common/components/Page";
const Loading = lazy(() => import("../Common/Loading"));

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
  const [multipleBeds, setMultipleBeds] = useState(false);
  const [numberOfBeds, setNumberOfBeds] = useState(1); //default = 1
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    bedType: "",
    numberOfBeds: "",
  });

  const headerText = !bedId ? "Add Bed" : "Update Bed";
  const buttonText = !bedId ? "Add Bed(s)" : "Update Bed";

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
        setNumberOfBeds(res?.data?.number_of_beds || "");
      }
      setIsLoading(false);
    }
    fetchFacilityLocationAndBed();
  }, [dispatchAction, facilityId, locationId]);

  const validateInputs = (data: {
    name: string;
    description: string;
    bed_type: string;
    number_of_beds: number;
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
    if (multipleBeds === false) {
      setNumberOfBeds(1);
    }
    if (data.number_of_beds < 1) {
      isValid = false;
      setErrors((prev) => ({
        ...prev,
        numberOfBeds: "Please enter a number larger than 0.",
      }));

      if (data.number_of_beds > 100) {
        isValid = false;
        setErrors((prev) => ({
          ...prev,
          numberOfBeds: "Please enter a number smaller than or equal to 100.",
        }));
      }
    }

    return isValid;
  };

  const handleCancel = () =>
    navigate(`/facility/${facilityId}/location/${locationId}/beds`, {
      replace: true,
    });

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    const data = {
      name,
      description,
      bed_type: bedType,
      number_of_beds: numberOfBeds,
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
        : "Bed(s) created successfully";

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
    <div className="mx-auto max-w-3xl px-2 pb-2">
      <Page
        title={headerText}
        backUrl={`/facility/${facilityId}/location/${locationId}/beds`}
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
      >
        <Card className="mt-10 lg:p-6">
          <form onSubmit={(e) => handleSubmit(e)}>
            <TextFormField
              name="name"
              type="text"
              label="Name"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.value)}
              error={errors.name}
            />
            <TextAreaFormField
              rows={5}
              label="Description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.value)}
              error={errors.description}
            />

            <SelectFormField
              id="bed-type"
              className="w-full"
              name="bed_type"
              label="Bed Type"
              required
              options={LOCATION_BED_TYPES}
              optionLabel={(option) => option.name}
              optionValue={(option) => option.id}
              value={bedType}
              onChange={(e) => setBedType(e.value)}
              error={errors.bedType}
            />

            {!bedId && (
              <>
                <CheckBoxFormField
                  label="Do you want to make multiple beds?"
                  onChange={() => {
                    setMultipleBeds(!multipleBeds);
                    if (!multipleBeds) setNumberOfBeds(1);
                  }}
                  name={"multipleBeds"}
                />
                <TextFormField
                  name="number_of_beds"
                  disabled={!multipleBeds}
                  label="Number of beds"
                  type="number"
                  value={numberOfBeds.toString()}
                  min={1}
                  max={100}
                  onChange={(e) => setNumberOfBeds(Number(e.value))}
                />
              </>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Cancel onClick={handleCancel} />
              <Submit onClick={handleSubmit} label={buttonText} />
            </div>
          </form>
        </Card>
      </Page>
    </div>
  );
};
