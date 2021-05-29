import React, { useState, useCallback } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getResourceDetails, deleteResourceRecord } from "../../Redux/actions";
import { navigate, Link } from "raviger";
import Button from "@material-ui/core/Button";
import QRCode from "qrcode.react";
import { GENDER_TYPES, TEST_TYPE_CHOICES } from "../../Common/constants";
import moment from "moment";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import * as Notification from "../../Utils/Notifications.js";
import CommentSection from "./CommentSection";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ResourceDetails(props: { id: string }) {
  const dispatch: any = useDispatch();
  let initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);

  const [openDeleteResourceDialog, setOpenDeleteResourceDialog] =
    React.useState(false);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getResourceDetails({ id: props.id }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data);
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatch]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handleResourceDelete = async () => {
    setOpenDeleteResourceDialog(true);

    let res = await dispatch(deleteResourceRecord(props.id));
    if (res.status >= 200) {
      Notification.Success({
        msg: "Resource record has been deleted successfully.",
      });
    }

    navigate(`/resource`);
  };

  const showFacilityCard = (facilityData: any) => {
    return (
      <div className="border rounded-lg bg-white shadow h-full text-black mt-2 p-4">
        <div>
          <span className="font-semibold leading-relaxed mr-1">Name: </span>
          {facilityData?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            Facility type:{" "}
          </span>
          {facilityData?.facility_type?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">District: </span>
          {facilityData?.district_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            Local body:{" "}
          </span>
          {facilityData?.local_body_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">State: </span>
          {facilityData?.state_object?.name || "--"}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="mx-3 md:mx-8 mb-10">
        <div className="my-4 flex justify-between items-center">
          <PageTitle title={"Resource details"} />
        </div>
        {data.assigned_to_object && (
          <div className="relative rounded-lg shadow bg-green-200">
            <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
              <div className="pr-16 sm:text-center sm:px-16">
                <p className="font-bold text-green-800">
                  <span className="inline">
                    Assigned to: {data.assigned_to_object.first_name}{" "}
                    {data.assigned_to_object.last_name} -{" "}
                    {data.assigned_to_object.user_type}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="border rounded-lg bg-white shadow h-full text-black mt-4 p-4">
          <div className="flex justify-between">


            <div className="text-xl font-semibold">
              {data.title || "--"}
            </div>
            <div>
              <div className="mt-2">
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() =>
                    navigate(`/resource/${data.external_id}/update`)
                  }
                >
                  Update Status/Details
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            <div>
              <span className="font-semibold leading-relaxed">Status: </span>
              <span className="badge badge-pill badge-primary py-1 px-2">
                {data.status}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Category:{" "}
              </span>
              {data.category || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Subcategory:{" "}
              </span>
              {data.sub_category || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Required Quantity:{" "}
              </span>
              {data.requested_quantity || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact person at the facility:{" "}
              </span>
              {data.refering_facility_contact_name || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact person number:{" "}
              </span>
              {data.refering_facility_contact_number ? (
                <a href={`tel:${data.refering_facility_contact_number}`}>
                  {data.refering_facility_contact_number}
                </a>
              ) : (
                "--"
              )}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {" "}
                Is emergency:{" "}
              </span>
              <span className="badge badge-pill badge-danger py-1 px-2">
                {" "}
                {data.emergency ? "yes" : "no"}
              </span>
            </div>

            <div className="md:row-span-2 md:col-span-2">
              <div className="font-semibold leading-relaxed">Reason: </div>
              <div className="ml-2">{data.reason || "--"}</div>
            </div>
          </div>

          <div className="flex justify-end mt-4 hidden">
            <div>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => setOpenDeleteResourceDialog(true)}
              >
                Delete Record
              </Button>

              <Dialog
                open={openDeleteResourceDialog}
                onClose={() => setOpenDeleteResourceDialog(false)}
              >
                <DialogTitle id="alert-dialog-title">
                  Authorize resource delete
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Are you sure you want to delete this record?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setOpenDeleteResourceDialog(false)}
                    color="primary"
                  >
                    No
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleResourceDelete}
                    autoFocus
                  >
                    Yes
                  </Button>
                </DialogActions>
              </Dialog>
            </div>
          </div>
        </div>
        <h4 className="mt-8">Audit Log</h4>

        <div className="flex justify-between p-2 bg-white rounded-lg shadow text-center px-4 mt-2">
          <div className="w-1/2 border-r-2 truncate">
            <div className="text-sm leading-5 font-medium text-gray-500">
              Created
            </div>
            <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre">
              <div className="text-sm">
                {data?.created_by_object?.first_name}{" "}
                {data?.created_by_object?.last_name}
              </div>
              <div className="text-xs">
                {data.created_date && moment(data.created_date).format("lll")}
              </div>
            </div>
          </div>
          <div className="w-1/2 truncate">
            <div className="text-sm leading-5 font-medium text-gray-500">
              Last Edited
            </div>
            <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre">
              <div className="text-sm">
                {data?.last_edited_by_object?.first_name}{" "}
                {data?.last_edited_by_object?.last_name}
              </div>
              <div className="text-xs">
                {data.modified_date && moment(data.modified_date).format("lll")}
              </div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 pb-4">
          <div>
            <h4 className="mt-8">Orgin Facility</h4>

            {showFacilityCard(data.orgin_facility_object)}
          </div>
          <div>
            <h4 className="mt-8">Resource Approving facility</h4>

            {showFacilityCard(data.approving_facility_object)}
          </div>
          {data.assigned_facility_object && (
            <div>
              <h4 className="mt-8">Request Fulfilling Facility</h4>

              {showFacilityCard(data.assigned_facility_object)}
            </div>
          )}
        </div>
        <div className="mt-20 w-full">
          <h4 className="mb-4">Comments</h4>
          <CommentSection id={props.id} />
        </div>
      </div>
    </div>
  );
}
