import React, { useState, useCallback } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { classNames } from "../../Utils/utils";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getResourceDetails, deleteResourceRecord } from "../../Redux/actions";
import { navigate } from "raviger";
import Button from "@material-ui/core/Button";
import { KeralaLogo } from "../../Common/constants";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import * as Notification from "../../Utils/Notifications.js";
import CommentSection from "./CommentSection";
import { formatDate } from "../../Utils/utils";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ResourceDetails(props: { id: string }) {
  const dispatch: any = useDispatch();
  const initialData: any = {};
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
        } else {
          navigate("/not-found");
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

    const res = await dispatch(deleteResourceRecord(props.id));
    if (res?.status === 204) {
      Notification.Success({
        msg: "Resource record has been deleted successfully.",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting Resource: " + (res?.data?.detail || ""),
      });
    }

    navigate("/resource");
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

  const ApprovalLetter = (data: any) => {
    return (
      <div id="section-to-print" className="print bg-white">
        <div className="flex justify-center">
          <img
            src={`${process.env.PUBLIC_URL}/${KeralaLogo}`}
            alt="kerala-logo"
          />
        </div>
        <div className="mx-20 p-4">
          <div className="font-bold text-xl text-center mt-6">
            APPROVAL LETTER
          </div>
          <div className="text-right mt-6">
            <span className="font-semibold leading-relaxed">
              {" "}
              Date and Time:{" "}
            </span>
            {formatDate(data.created_date)}
          </div>
          <div className="text-right mt-2">
            <span className="font-semibold leading-relaxed"> Unique Id: </span>
            {data.id}
          </div>

          <div className="mt-4">
            <div>To,</div>
          </div>
          <div className="mt-2">
            <div className="p-4 pt-0">
              <div>{data.orgin_facility_object?.name || "--"}</div>
              <div>
                {data.orgin_facility_object?.facility_type?.name || "--"}
              </div>
              <div>
                {data.orgin_facility_object?.district_object?.name || "--"}
              </div>
              <div>
                {data.orgin_facility_object?.local_body_object?.name || "--"}
              </div>
              <div>
                {data.orgin_facility_object?.state_object?.name || "--"}
              </div>
            </div>
            {data.status === "REJECTED" ||
            data.status === "PENDING" ||
            data.status === "ON HOLD" ? (
              <div className="mt-4">
                <span className="leading-relaxed">
                  The request for resource (details below) placed by yourself is{" "}
                </span>
                <text className="font-semibold">{data.status}</text>
              </div>
            ) : data.status === "APPROVED" ? (
              <div className="mt-4">
                <span className="leading-relaxed">
                  The request for resource (details below) placed by yourself is{" "}
                </span>
                <text className="font-semibold">{data.status}</text>
              </div>
            ) : (
              <div className="mt-4">
                <span className="leading-relaxed">
                  The request for resource (details below) placed by yourself is{" "}
                </span>
                <text className="font-semibold">APPROVED</text>
                <span className="leading-relaxed">
                  and the status of request is{" "}
                </span>
                <text className="font-semibold">{data.status}</text>
              </div>
            )}
            <div className="mt-4">
              <span className="font-semibold leading-relaxed">
                Title of Request:{" "}
              </span>
              {data.title || "--"}
            </div>
            <div className="mt-1">
              <span className="font-semibold leading-relaxed">
                Description of Request:{" "}
              </span>
              {data.reason || "--"}
            </div>
            <div className="mt-4">
              <span className="font-semibold leading-relaxed">
                Quantity Requested:{" "}
              </span>
              {data.requested_quantity}
            </div>
            <div className="mt-2">
              <span className="font-semibold leading-relaxed">
                QUANTITY APPROVED:{" "}
              </span>
              {data.assigned_quantity}
            </div>
          </div>
          {data.assigned_facility_object ? (
            <div className="mt-4">
              The request will be fulfilled by{" "}
              {data.assigned_facility_object.facility_type?.name}, District{" "}
              {data.assigned_facility_object.district_type?.name}, LSG
              {data.assigned_facility_object.local_body_object?.name},
              {data.assigned_facility_object.state_object?.name}
            </div>
          ) : null}
          <div className="flex mt-10">
            <div>
              <div className="font-semibold">APPROVED BY</div>
              <div className="mt-3">
                <div>
                  <div>{data.approving_facility_object?.name || "--"}</div>
                  <div className="mt-2">
                    {data.approving_facility_object?.facility_type?.name ||
                      "--"}
                  </div>
                  <div className="mt-2">
                    {data.approving_facility_object?.district_object?.name ||
                      "--"}
                  </div>
                  <div className="mt-2">
                    {data.approving_facility_object?.local_body_object?.name ||
                      "--"}
                  </div>
                  <div className="mt-2">
                    {data.approving_facility_object?.state_object?.name || "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      {isPrintMode ? (
        <div className="my-4">
          <div className="my-4 flex justify-end ">
            <button
              onClick={(_) => window.print()}
              className="btn btn-primary mr-2"
            >
              <i className="fas fa-print mr-2"></i> Print Approval Letter
            </button>
            <button
              onClick={(_) => setIsPrintMode(false)}
              className="btn btn-default"
            >
              <i className="fas fa-times mr-2"></i> Close
            </button>
          </div>
          {ApprovalLetter(data)}
        </div>
      ) : (
        <div className="mx-3 md:mx-8 mb-10">
          <div className="my-4 flex flex-col items-start md:flex-row md:justify-between md:items-center">
            <PageTitle
              title={"Resource details"}
              crumbsReplacements={{ [props.id]: { name: data.title } }}
            />
            <div>
              <button
                onClick={(_) => setIsPrintMode(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-file-alt mr-2"></i> Approval Letter
              </button>
            </div>
          </div>
          {data.assigned_to_object && (
            <div className="relative rounded-lg shadow bg-primary-200">
              <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
                <div className="pr-16 sm:text-center sm:px-16">
                  <p className="font-bold text-primary-800">
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
            <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
              <div className="text-xl font-semibold">{data.title || "--"}</div>
              <div>
                <div className="mt-4 sm:mt-2">
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
                  Approved Quantity:{" "}
                </span>
                {data.assigned_quantity}
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
            <div className="w-1/2 border-r-2 px-1">
              <div className="text-sm leading-5 font-medium text-black">
                Created
              </div>
              <div className="mt-1 text-sm leading-5 text-gray-900">
                <div className="text-sm">
                  {data?.created_by_object?.first_name}{" "}
                  {data?.created_by_object?.last_name}
                </div>
                <div className="text-xs">
                  {data.created_date && formatDate(data.created_date)}
                </div>
              </div>
            </div>
            <div className="w-1/2 px-1">
              <div className="text-sm leading-5 font-medium text-black">
                Last Edited
              </div>
              <div className="mt-1 text-sm leading-5 text-gray-900">
                <div className="text-sm">
                  {data?.last_edited_by_object?.first_name}{" "}
                  {data?.last_edited_by_object?.last_name}
                </div>
                <div className="text-xs">
                  {data.modified_date && formatDate(data.modified_date)}
                </div>
              </div>
            </div>
          </div>
          <div
            className={classNames(
              "grid grid-cols-1 mt-8 gap-x-6 gap-y-12",
              data.assigned_facility_object
                ? "lg:grid-cols-3"
                : "lg:grid-cols-2"
            )}
          >
            <div>
              <h4>Origin Facility</h4>

              {showFacilityCard(data.orgin_facility_object)}
            </div>
            <div>
              <h4>Resource Approving Facility</h4>

              {showFacilityCard(data.approving_facility_object)}
            </div>
            {data.assigned_facility_object && (
              <div>
                <h4>Request Fulfilling Facility</h4>

                {showFacilityCard(data.assigned_facility_object)}
              </div>
            )}
          </div>
          <div className="mt-20 w-full">
            <h4 className="mb-4">Comments</h4>
            <CommentSection id={props.id} />
          </div>
        </div>
      )}
    </div>
  );
}
