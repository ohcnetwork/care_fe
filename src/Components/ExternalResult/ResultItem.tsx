import React, { useState, useCallback } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { externalResult, deleteExternalResult } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import AlertDialog from "../Common/AlertDialog";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ResultItem(props: any) {
  const dispatch: any = useDispatch();
  const initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(externalResult({ id: props.id }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data);
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatch]
  );

  const handleDelete = async () => {
    const res = await dispatch(deleteExternalResult(props.id));
    if (res?.status === 204) {
      Notification.Success({
        msg: "Record has been deleted successfully.",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting record: " + (res?.data?.detail || ""),
      });
    }

    setShowDeleteAlert(false);
    navigate("/external_results");
  };

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <PageTitle title={"Result details"} className="px-6 mb-2" />

      {showDeleteAlert && (
        <AlertDialog
          title="Confirm Delete"
          message={"Are you sure want to delete this record?"}
          primaryButton={{ text: "DELETE", color: "secondary" }}
          handleClose={() => handleDelete()}
          handleCancel={() => setShowDeleteAlert(false)}
        />
      )}

      <div className="mx-3 md:mx-8 mb-10 mt-4">
        <div className="flex flex-col md:flex-row gap-2 justify-end">
          <button
            id="update"
            className="btn-primary btn mr-2 w-full md:w-auto"
            onClick={() => navigate(`/external_results/${data.id}/update`)}
          >
            <i className="fas fa-pencil-alt text-white mr-2"></i>
            Update Record
          </button>
          <button
            id="delete"
            className="btn btn-danger w-full md:w-auto"
            onClick={() => setShowDeleteAlert(true)}
          >
            <i className="fas fa-trash text-white mr-2"></i>
            Delete Record
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {data.name} - {data.age} {data.age_in} | {data.result}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
              SRF ID: {data.srf_id}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
              Care external results ID: {data.id}
            </p>
            {data.patient_created ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 bg-green-100 text-green-800 capitalize">
                Patient Created
              </span>
            ) : null}
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Gender
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.gender}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Address
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.address}

                  {data.ward_object && (
                    <div className="mt-1">
                      Ward: {data.ward_object.number} {data.ward_object.name}
                    </div>
                  )}
                  {data.local_body_object && (
                    <div className="mt-1">{data.local_body_object.name}</div>
                  )}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Mobile Number
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.mobile_number}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Repeat?
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.is_repeat ? "Yes" : "No"}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Patient Status
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.patient_status}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Sample Type
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.sample_type}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Test Type
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.test_type}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Sample collection date
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.sample_collection_date || "-"}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Result Date
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.result_date || "-"}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Result
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.result}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Source
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.source}
                </dd>
              </div>

              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Patient Category
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.patient_category}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
