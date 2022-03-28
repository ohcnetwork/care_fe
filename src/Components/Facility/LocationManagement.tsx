import React, { useCallback, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { Button, CircularProgress } from "@material-ui/core";
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
import classNames from "classnames";
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

  const handleSave = async () => {
    setIsLoading(true);
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
            errors=""
          />
        ) : (
          <p className="text-gray-900">
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
          <p className="text-gray-900 lowercase">{description}</p>
        )}
      </td>
      <td className="px-5 py-5 border-b border-gray-200 text-sm">
        {isEditable ? (
          <div className="flex space-x-2">
            <Button
              color={isLoading ? "default" : "primary"}
              variant="contained"
              type="submit"
              size="small"
              style={{ marginLeft: "auto" }}
              onClick={handleSave}
            >
              <CircularProgress
                size={20}
                className={classNames("absolute z-10", { hidden: !isLoading })}
              />
              <p> SAVE </p>
            </Button>
            <Button
              color="secondary"
              variant="contained"
              type="submit"
              size="small"
              style={{ marginLeft: "auto" }}
              onClick={handleCancel}
            >
              CANCEL
            </Button>
          </div>
        ) : (
          <Button
            color="inherit"
            variant="contained"
            type="submit"
            size="small"
            style={{
              marginLeft: "auto",
              backgroundColor: "#24a0ed",
              color: "white",
            }}
            onClick={() => setIsEditable(true)}
          >
            EDIT
          </Button>
        )}
      </td>
      <td>
        {!isEditable && (
          <Button
            color="inherit"
            variant="contained"
            type="submit"
            size="small"
            style={{
              marginLeft: "auto",
              backgroundColor: "#4A2310",
              color: "white",
            }}
            onClick={() =>
              navigate(`/facility/${facilityId}/location/${id}/beds`)
            }
          >
            Manage Beds
          </Button>
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
        description={locationItem.description || ""}
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
          <p className="text-gray-500 whitespace-no-wrap">
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
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => navigate(`/facility/${facilityId}/location/add`)}
        >
          Add Location
        </Button>
        {location}
      </div>
    </div>
  );
};
