import { navigate } from "raviger";
import { SyntheticEvent, lazy, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  createFacilityAssetLocation,
  getAnyFacility,
  getFacilityAssetLocation,
  getFacilityUsers,
  updateFacilityAssetLocation,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import { MultiSelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { UserAssignedModel } from "../Users/models";

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
  const [doctorList, setDoctorList] = useState<UserAssignedModel[]>([]);
  const [staffList, setStaffList] = useState<UserAssignedModel[]>([]);
  const [doctors, setDoctors] = useState<UserAssignedModel[]>([]);
  const [staff, setStaff] = useState<UserAssignedModel[]>([]);
  const [errors, setErrors] = useState<{
    name: string;
    description: string;
    middlewareAddress: string;
  }>({
    name: "",
    description: "",
    middlewareAddress: "",
  });
  const headerText = !locationId ? "Add Location" : "Update Location";
  const buttonText = !locationId ? "Add Location" : "Update Location";

  useEffect(() => {
    async function fetchFacilityName() {
      setIsLoading(true);
      if (facilityId) {
        const facility = await dispatchAction(getAnyFacility(facilityId));
        const doctor = await dispatchAction(
          getFacilityUsers(facilityId, {
            user_type: "Doctor",
            home_facility: facilityId,
          })
        );
        const staff = await dispatchAction(
          getFacilityUsers(facilityId, {
            user_type: "Staff",
          })
        );
        setFacilityName(facility?.data?.name || "");
        setDoctorList(doctor?.data?.results || []);
        setStaffList(staff?.data?.results || []);
      }
      if (locationId) {
        const res = await dispatchAction(
          getFacilityAssetLocation(facilityId, locationId)
        );

        setName(res?.data?.name || "");
        setLocationName(res?.data?.name || "");
        setDescription(res?.data?.description || "");
        setMiddlewareAddress(res?.data?.middleware_address || "");
        setDoctors(
          res?.data?.duty_staff_objects
            .filter((doc: UserAssignedModel) => doc.user_type === "Doctor")
            .map((doc: UserAssignedModel) => doc.id) || []
        );
        setStaff(
          res?.data?.duty_staff_objects
            .filter((s: UserAssignedModel) => s.user_type === "Staff")
            .map((s: UserAssignedModel) => s.id) || []
        );
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
    };

    if (name.trim().length === 0) {
      error.name = "Name is required";
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
      duty_staff: [...doctors, ...staff],
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
              <div className="flex flex-row items-center">
                <label className="text-lg font-bold text-gray-900">
                  General Details
                </label>
                <hr className="ml-6 flex-1 border border-gray-400" />
              </div>
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
                <TextFormField
                  name="Location Middleware Address"
                  type="text"
                  label="Location Middleware Address"
                  value={middlewareAddress}
                  onChange={(e) => setMiddlewareAddress(e.value)}
                  error={errors.middlewareAddress}
                />
              </div>
              <div className="flex flex-row items-center">
                <label className="text-lg font-bold text-gray-900">
                  Duty Staff
                </label>
                <hr className="ml-6 flex-1 border border-gray-400" />
              </div>
              <div>
                <MultiSelectFormField
                  name="doctors"
                  label="Doctors"
                  onChange={(e) => setDoctors(e.value)}
                  options={doctorList}
                  value={doctors}
                  optionLabel={(option: any) =>
                    `${option.first_name} ${option.last_name}`
                  }
                  optionValue={(option: any) => option.id}
                />
              </div>
              <div>
                <MultiSelectFormField
                  name="staff"
                  label="Staff"
                  onChange={(e) => setStaff(e.value)}
                  options={staffList}
                  value={staff}
                  optionLabel={(option: any) =>
                    `${option.first_name} ${option.last_name}`
                  }
                  optionValue={(option: any) => option.id}
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
