import Card from "../../CAREUI/display/Card";
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
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import { navigate } from "raviger";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import Page from "../Common/components/Page";
const Loading = loadable(() => import("../Common/Loading"));

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

  const handleCancel = () =>
    navigate(`/facility/${facilityId}/location/${locationId}/beds`, {
      replace: true,
    });

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
        <div className="mt-10">
          <Card>
            <form onSubmit={(e) => handleSubmit(e)}>
              <div className="md:p-4">
                <div className="mt-2 grid gap-4 grid-cols-1">
                  <div>
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
                  </div>
                  <div>
                    <TextAreaFormField
                      rows={5}
                      label="Description"
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.value)}
                      error={errors.description}
                    />
                  </div>
                  <div>
                    <SelectFormField
                      id="bed-type"
                      name="bed_type"
                      label="Bed Type"
                      required
                      options={LOCATION_BED_TYPES}
                      optionValue={(bedType) => bedType.id}
                      optionLabel={(bed) => bed.name}
                      value={bedType}
                      onChange={({ value }) => {
                        setBedType(value);
                      }}
                      error={errors.bedType}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Cancel onClick={handleCancel} />
                    <Submit onClick={handleSubmit} label={buttonText} />
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </Page>
    </div>
  );
};
