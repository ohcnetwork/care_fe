import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateAssetService } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { AssetData, AssetService, AssetServiceEdit } from "./AssetTypes";
import dayjs from "dayjs";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { formatDate, formatDateTime } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DateFormField from "../Form/FormFields/DateFormField";

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
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [editRecord, setEditRecord] = useState<AssetServiceEdit>();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      serviced_on: form.serviced_on,
      note: form.note,
    };

    const res = await dispatchAction(
      updateAssetService(props.asset?.id ?? "", props.service_record.id, data)
    );
    setIsLoading(false);
    if (res?.data) {
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
        title="Edit History"
      >
        <div>
          <div className="mb-4">
            <p className="text-md mt-1 text-gray-500">
              Update record for asset
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
                  className="my-2 flex cursor-pointer justify-between rounded-lg border border-gray-300 p-4 py-2 transition-colors duration-200 hover:bg-gray-100"
                >
                  <div className="grow">
                    <p className="text-sm font-medium text-gray-500">
                      {isLast ? "Created" : "Edited"} On
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDateTime(edit.edited_on)}
                    </p>
                  </div>
                  <div className="grow">
                    <p className="text-sm font-medium text-gray-500">
                      {isLast ? "Created" : "Edited"} By
                    </p>
                    <p className="text-sm text-gray-900">
                      {edit.edited_by.username}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <CareIcon icon="l-eye" className="text-lg" />
                  </div>
                </div>
              );
            })}
          {editRecord && (
            <div className="mb-4 rounded-lg border border-gray-300 p-4 py-2">
              <div className="my-2 flex justify-between">
                <div className="grow">
                  <p className="text-sm font-medium text-gray-500">Edited On</p>
                  <p className="text-gray-900">
                    {formatDateTime(editRecord.edited_on)}
                  </p>
                </div>
                <div className="grow">
                  <p className="text-sm font-medium text-gray-500">Edited By</p>
                  <p className="text-gray-900">
                    {editRecord.edited_by.username}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col justify-between">
                <div className="grow">
                  <p className="text-sm font-medium text-gray-500">
                    Serviced On
                  </p>
                  <p className="text-gray-900">
                    {formatDate(editRecord.serviced_on)}
                  </p>
                </div>
                <div className="mt-4 grow">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-gray-900">{editRecord.note || "-"}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <ButtonV2
              variant="secondary"
              onClick={() => {
                editRecord ? setEditRecord(undefined) : props.handleClose();
              }}
            >
              {editRecord ? "Back" : "Close"}
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
      title="Update Asset Service Record"
    >
      <div>
        <div className="mb-4">
          <p className="text-md mt-1 text-gray-500">
            Update record for asset
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
                // eslint-disable-next-line i18next/no-literal-string
                label="Serviced On"
                name="serviced_on"
                className="mt-2"
                position="LEFT"
                value={new Date(form.serviced_on)}
                onChange={(date) => {
                  if (
                    dayjs(date.value).format("YYYY-MM-DD") >
                    new Date(
                      props.service_record.created_date
                    ).toLocaleDateString("en-ca")
                  ) {
                    Notification.Error({
                      msg: `Service date can't be after ${dayjs(
                        props.service_record.created_date
                      ).format("DD/MM/YYYY")} (Creation date)`,
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
                label="Notes"
                placeholder="Eg. Details on functionality, service, etc."
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
            label={`${isLoading ? "Updating" : "Update"}`}
            onClick={handleSubmit}
            loading={isLoading}
          />
          <Cancel onClick={props.handleClose} />
        </div>
      </div>
    </DialogModal>
  );
};
