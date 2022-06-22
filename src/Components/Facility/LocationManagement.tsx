import React, { useCallback, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  listFacilityAssetLocation,
  updateFacilityAssetLocation,
  getAnyFacility,
} from "../../Redux/actions";
import { navigate } from "raviger";
import Pagination from "../Common/Pagination";
import { LocationModel } from "./models";
import { ReactElement } from "react";
import {
  MultilineInputField,
  TextInputField,
} from "../Common/HelperInputFields";
import * as Notification from "../../Utils/Notifications.js";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface LocationManagementProps {
  facilityId: string;
}

interface LocationRowProps {
  id: string;
  facilityId: string;
  name: string;
  description: string;
  triggerRerender: () => void;
}

const LocationRow = (props: LocationRowProps) => {
  let { id, facilityId, name, description, triggerRerender } = props;

  const dispatchAction: any = useDispatch();
  const [isEditable, setIsEditable] = useState(false);
  const [nameField, setNameField] = useState(name);
  const [descField, setDescField] = useState(description);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const validateForm = () => {
    if (nameField.trim().length === 0) {
      setErrMsg("Name is required");
      return false;
    }
    setErrMsg("");
    return true;
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (validateForm()) {
      const res = await dispatchAction(
        updateFacilityAssetLocation(
          { name: nameField, description: descField },
          facilityId,
          id
        )
      );
      setIsLoading(false);

      if (res && res.status === 200) {
        Notification.Success({
          msg: "Location updated successfully",
        });
      } else {
        Notification.Error({
          msg: "Location update failed",
        });
      }
      setIsEditable(false);
      triggerRerender();
      // window.location.reload();
    } else {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNameField(name);
    setDescField(description);
    setIsEditable(false);
  };

  return (
    <tr key={id}>
      <td className="px-5 py-5 border-b border-gray-200 text-sm">
        {isEditable ? (
          <TextInputField
            name="name"
            variant="outlined"
            margin="dense"
            type="text"
            value={nameField}
            onChange={(e) => setNameField(e.target.value)}
            errors={errMsg}
          />
        ) : (
          <p className="text-base text-gray-900">
            {name.slice(0, 25) + (name.length > 25 ? "..." : "")}
          </p>
        )}
      </td>
      <td className="px-5 py-5 border-b border-gray-200 text-sm">
        {isEditable ? (
          <MultilineInputField
            rows={2}
            name="description"
            variant="outlined"
            margin="dense"
            type="float"
            value={descField}
            onChange={(e) => setDescField(e.target.value)}
            errors=""
          />
        ) : (
          <p className=" text-base text-gray-900 lowercase">{description}</p>
        )}
      </td>
      <td className="px-5 py-5 border-b border-gray-200 text-sm">
        {isEditable ? (
          <div className="flex space-x-2">
            {isLoading ? (
              <button className="btn btn-primary">
                <span>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
                SAVING...
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSave}>
                SAVE
              </button>
            )}
            <button
              type="submit"
              onClick={handleCancel}
              className="btn btn-danger"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            type="submit"
            onClick={() => setIsEditable(true)}
            className="btn btn-primary"
          >
            <i
              className="fas fa-pencil-alt text-white mr-2"
              aria-hidden="true"
            ></i>
            EDIT
          </button>
        )}
      </td>
      <td>
        {!isEditable && (
          <button
            type="submit"
            className="btn btn-primary"
            onClick={() =>
              navigate(`/facility/${facilityId}/location/${id}/beds`)
            }
          >
            <i className="fa-solid fa-bed text-white mr-2"></i>MANAGE BEDS
          </button>
        )}
      </td>
    </tr>
  );
};

export const LocationManagement = (props: LocationManagementProps) => {
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  let location: ReactElement | null = null;
  let locationsList: ReactElement[] | ReactElement = [];
  const [locations, setLocations] = useState<LocationModel[]>([]);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rerender, setRerender] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const limit = 14;

  const triggerRerender = () => {
    setRerender(!rerender);
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        listFacilityAssetLocation(
          { limit, offset },
          { facility_external_id: facilityId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setLocations(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, rerender]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

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

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  if (locations && locations.length) {
    locationsList = locations.map((locationItem: LocationModel) => (
      <LocationRow
        id={locationItem.id || ""}
        facilityId={facilityId || ""}
        name={locationItem.name || ""}
        description={locationItem.description || "--"}
        triggerRerender={triggerRerender}
      />
    ));
  } else if (locations && locations.length === 0) {
    locationsList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <p className="text-gray-500 whitespace-nowrap">
            No locations available
          </p>
        </td>
      </tr>
    );
  }

  if (isLoading || !locations) {
    location = <Loading />;
  } else if (locations) {
    location = (
      <>
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Description
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Manage
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Beds
                </th>
              </tr>
            </thead>
            <tbody>{locationsList}</tbody>
          </table>
        </div>
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <PageTitle
        title="Location Management"
        hideBack={false}
        className="mx-3 md:mx-8"
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="container mx-auto px-4 py-4 md:my-8 sm:px-8">
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/facility/${facilityId}/location/add`)}
        >
          <i className="fas fa-map-marker-alt text-white mr-2"></i>ADD LOCATION
        </button>
        {location}
      </div>
    </div>
  );
};
