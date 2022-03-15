import React, { useCallback, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { Button, CircularProgress } from "@material-ui/core";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getAnyFacility,
  listFacilityBeds,
  updateFacilityBed,
} from "../../Redux/actions";
import { navigate } from "raviger";
import Pagination from "../Common/Pagination";
import { BedModel } from "./models";
import { ReactElement } from "react";
import {
  MultilineInputField,
  SelectField,
  TextInputField,
} from "../Common/HelperInputFields";
import * as Notification from "../../Utils/Notifications.js";
import classNames from "classnames";
import { LOCATION_BED_TYPES } from "../../Common/constants";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface BedManagementProps {
  facilityId: string;
  locationId: string;
}

interface BedRowProps {
  id: string;
  facilityId: string;
  name: string;
  description: string;
  bedType: string;
  triggerRerender: () => void;
  locationId: string;
}

const BedRow = (props: BedRowProps) => {
  let {
    id,
    facilityId,
    name,
    description,
    triggerRerender,
    locationId,
    bedType,
  } = props;

  const dispatchAction: any = useDispatch();
  const [isEditable, setIsEditable] = useState(false);
  const [nameField, setNameField] = useState(name);
  const [descField, setDescField] = useState(description);
  const [bedTypeField, setBedTypeField] = useState(bedType);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const res = await dispatchAction(
      updateFacilityBed(
        { name: nameField, description: descField, bed_type: bedTypeField },
        facilityId,
        id,
        locationId
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
    setBedTypeField(bedType);
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
          <p className="text-gray-900">{description}</p>
        )}
      </td>
      <td className="px-5 py-5 border-b border-gray-200 text-sm">
        {isEditable ? (
          <SelectField
            name="name"
            variant="outlined"
            margin="dense"
            type="text"
            value={bedTypeField}
            onChange={(e) => setBedTypeField(e.target.value)}
            options={LOCATION_BED_TYPES}
            optionValue="name"
          />
        ) : (
          <p className="text-gray-900">
            {LOCATION_BED_TYPES.find((item) => item.id === bedType).name.slice(
              0,
              25
            ) + (bedType.length > 25 ? "..." : "")}
          </p>
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
    </tr>
  );
};

export const BedManagement = (props: BedManagementProps) => {
  const { facilityId, locationId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  let bed: ReactElement | null = null;
  let BedList: ReactElement[] | ReactElement = [];
  const [beds, setBeds] = useState<BedModel[]>([]);
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
        listFacilityBeds({
          limit,
          offset,
          facility: facilityId,
          location: locationId,
        })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setBeds(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, rerender, facilityId, locationId] // eslint-disable-line react-hooks/exhaustive-deps
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

  if (beds && beds.length) {
    BedList = beds.map((bedItem: BedModel) => (
      <BedRow
        id={bedItem.id || ""}
        facilityId={facilityId || ""}
        name={bedItem.name || ""}
        description={bedItem.description || ""}
        bedType={bedItem.bed_type || ""}
        triggerRerender={triggerRerender}
        key={locationId || ""}
        locationId={locationId || ""}
      />
    ));
  } else if (beds && beds.length === 0) {
    BedList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <p className="text-gray-500 whitespace-no-wrap">
            No beds available in this location
          </p>
        </td>
      </tr>
    );
  }

  if (isLoading || !beds) {
    bed = <Loading />;
  } else if (beds) {
    bed = (
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
                  Bed Type
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody>{BedList}</tbody>
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
        title="Bed Management"
        hideBack={false}
        className="mx-3 md:mx-8"
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="container mx-auto px-4 py-4 md:my-8 sm:px-8">
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() =>
            navigate(`/facility/${facilityId}/location/${locationId}/beds/add`)
          }
        >
          Add Bed
        </Button>
        {bed}
      </div>
    </div>
  );
};
