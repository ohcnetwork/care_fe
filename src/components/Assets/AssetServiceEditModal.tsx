import dayjs from "dayjs";
import { t } from "i18next";
import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AssetData,
  AssetService,
  AssetServiceEdit,
} from "@/components/Assets/AssetTypes";
import ButtonV2, { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDate, formatDateTime } from "@/Utils/utils";

export const AssetServiceEditModal = (props: {
  asset?: AssetData;
  service_record: AssetService;
  handleClose: () => void;
  handleUpdate: () => void;
  viewOnly?: boolean;
  show: boolean;
}) => {
  const [form, setForm] = useState({
    serviced_on: props.service_record?.serviced_on,
    note: props.service_record?.note,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editRecord, setEditRecord] = useState<AssetServiceEdit>();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const body = {
      serviced_on: form.serviced_on,
      note: form.note,
    };
    const { data } = await request(routes.updateAssetService, {
      pathParams: {
        asset_external_id: props.asset?.id ?? "",
        external_id: props.service_record.id,
      },
      body: body,
    });
    setIsLoading(false);
    if (data) {
      Notification.Success({
        msg: "Asset service record updated successfully",
      });
      props.handleUpdate();
      props.handleClose();
    }
  };

  useEffect(() => {
    setForm({
      serviced_on: props.service_record?.serviced_on,
      note: props.service_record?.note,
    });
  }, [props.service_record]);

  if (props.viewOnly) {
    return (
      <DialogModal
        show={props.show}
        onClose={props.handleClose}
        title={t("edit_history")}
      >
        <div>
          <div className="mb-4">
            <p className="text-md mt-1 text-secondary-500">
              {t("update_record_for_asset")}
              <strong> {props.asset?.name}</strong>
            </p>
          </div>
          {!editRecord &&
            props.service_record?.edits?.map((edit, index) => {
              const isLast = index === props.service_record?.edits?.length - 1;
              return (
                <div
                  key={index}
                  onClick={() => {
                    setEditRecord(edit);
                  }}
                  className="my-2 flex cursor-pointer justify-between rounded-lg border border-secondary-300 p-4 py-2 transition-colors duration-200 hover:bg-secondary-100"
                >
                  <div className="grow">
                    <p className="text-sm font-medium text-secondary-500">
                      {isLast ? "Created" : "Edited"} On
                    </p>
                    <p className="text-sm text-secondary-900">
                      {formatDateTime(edit.edited_on)}
                    </p>
                  </div>
                  <div className="grow">
                    <p className="text-sm font-medium text-secondary-500">
                      {isLast ? "Created" : "Edited"} By
                    </p>
                    <p className="text-sm text-secondary-900">
                      {edit.edited_by.username}
                    </p>
                  </div>
                  <div
                    className="flex items-center justify-center"
                    id="view-asset-edit-history"
                  >
                    <CareIcon icon="l-eye" className="text-lg" />
                  </div>
                </div>
              );
            })}
          {editRecord && (
            <div className="mb-4 rounded-lg border border-secondary-300 p-4 py-2">
              <div className="my-2 flex justify-between">
                <div className="grow">
                  <p className="text-sm font-medium text-secondary-500">
                    {t("edited_on")}
                  </p>
                  <p className="text-secondary-900">
                    {formatDateTime(editRecord.edited_on)}
                  </p>
                </div>
                <div className="grow">
                  <p className="text-sm font-medium text-secondary-500">
                    {t("edited_by")}
                  </p>
                  <p className="text-secondary-900">
                    {editRecord.edited_by.username}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col justify-between">
                <div className="grow">
                  <p className="text-sm font-medium text-secondary-500">
                    {t("serviced_on")}
                  </p>
                  <p
                    className="text-secondary-900"
                    id="edit-history-asset-servicedon"
                  >
                    {formatDate(editRecord.serviced_on)}
                  </p>
                </div>
                <div className="mt-4 grow">
                  <p className="text-sm font-medium text-secondary-500">
                    {t("notes")}
                  </p>
                  <p
                    className="text-secondary-900"
                    id="edit-history-asset-note"
                  >
                    {editRecord.note || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <ButtonV2
              id="view-history-back-button"
              variant="secondary"
              onClick={() => {
                editRecord ? setEditRecord(undefined) : props.handleClose();
              }}
            >
              {editRecord ? t("back") : t("close")}
            </ButtonV2>
          </div>
        </div>
      </DialogModal>
    );
  }

  return (
    <DialogModal
      show={props.show}
      onClose={props.handleClose}
      title={t("update_asset_service_record")}
    >
      <div>
        <div className="mb-4">
          <p className="text-md mt-1 text-secondary-500">
            {t("update_record_for_asset")}
            <strong> {props.asset?.name}</strong>
          </p>
        </div>
        <div className="mb-4">
          <div className="flex flex-col gap-6">
            <div
              className="col-span-6 sm:col-span-3"
              data-testid="asset-last-serviced-on-input"
            >
              <DateFormField
                label={t("serviced_on")}
                name="serviced_on"
                className="mt-2"
                value={new Date(form.serviced_on)}
                max={new Date(props.service_record.created_date)}
                onChange={(date) => {
                  if (
                    dayjs(date.value).format("YYYY-MM-DD") >
                    new Date(
                      props.service_record.created_date,
                    ).toLocaleDateString("en-ca")
                  ) {
                    Notification.Error({
                      msg: `Service date can't be after ${formatDate(
                        props.service_record.created_date,
                      )} (Creation date)`,
                    });
                  } else {
                    setForm({
                      ...form,
                      serviced_on: dayjs(date.value).format("YYYY-MM-DD"),
                    });
                  }
                }}
              />
            </div>

            <div className="col-span-6" data-testid="asset-notes-input">
              <TextAreaFormField
                name="notes"
                rows={5}
                label={t("notes")}
                placeholder={t("eg_details_on_functionality_service_etc")}
                value={form.note}
                onChange={(e) => {
                  setForm({ ...form, note: e.value });
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-2 md:flex-row">
          <Submit
            label={`${isLoading ? t("updating") : t("update")}`}
            onClick={handleSubmit}
            loading={isLoading}
          />
          <Cancel onClick={props.handleClose} />
        </div>
      </div>
    </DialogModal>
  );
};
