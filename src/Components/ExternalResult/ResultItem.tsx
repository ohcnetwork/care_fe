import { useState, useCallback, lazy } from "react";

import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { externalResult, deleteExternalResult } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import Page from "../Common/components/Page";
import ConfirmDialog from "../Common/ConfirmDialog";

const Loading = lazy(() => import("../Common/Loading"));

export default function ResultItem(props: any) {
  const dispatch: any = useDispatch();
  const initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { t } = useTranslation();

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
        msg: t("record_has_been_deleted_successfully"),
      });
    } else {
      Notification.Error({
        msg:
          t("error_while_deleting_record") + ": " + (res?.data?.detail || ""),
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
    <Page title={t("result_details")} backUrl="/external_results">
      <ConfirmDialog
        title={t("confirm_delete")}
        description={t("are_you_sure_want_to_delete_this_record")}
        variant="danger"
        action={t("delete")}
        show={showDeleteAlert}
        onConfirm={() => handleDelete()}
        onClose={() => setShowDeleteAlert(false)}
      />
      <div className="mx-3 mb-10 mt-4 md:mx-8">
        <div className="flex flex-col justify-end gap-2 md:flex-row">
          <button
            className="btn-primary btn mr-2 w-full md:w-auto"
            onClick={() => navigate(`/external_results/${data.id}/update`)}
          >
            <i className="fas fa-pencil-alt mr-2 text-white"></i>
            {t("update_record")}
          </button>
          <button
            className="btn btn-danger w-full md:w-auto"
            onClick={() => setShowDeleteAlert(true)}
          >
            <i className="fas fa-trash mr-2 text-white"></i>
            {t("delete_record")}
          </button>
        </div>
        <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {data.name} - {data.age} {data.age_in} | {data.result}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
              {t("srf_id")}: {data.srf_id}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
              {t("care_external_results_id")}: {data.id}
            </p>
            {data.patient_created ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium capitalize leading-4 text-green-800">
                {t("patient_created")}
              </span>
            ) : null}
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("gender")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.gender}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("address")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
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
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("mobile_number")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.mobile_number}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  Repeat?
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.is_repeat ? t("yes") : t("no")}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("patient_status")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.patient_status}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("sample_type")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.sample_type}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("test_type")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.test_type}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("sample_collection_date")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.sample_collection_date || "-"}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("result_date")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.result_date || "-"}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("result")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.result}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("source")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.source}
                </dd>
              </div>

              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm font-medium leading-5 text-gray-500">
                  {t("patient_category")}
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:col-span-2 sm:mt-0">
                  {data.patient_category}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Page>
  );
}
