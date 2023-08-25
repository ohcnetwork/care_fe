import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateAssetService } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import ButtonV2 from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { AssetData, AssetService, AssetServiceEdit } from "./AssetTypes";
import dayjs from "dayjs";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import DateInputV2 from "../Common/DateInputV2";
import { FieldLabel } from "../Form/FormFields/FormField";
import { formatDate, formatDateTime } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
              <FieldLabel>Serviced On</FieldLabel>
              <DateInputV2
                name="serviced_on"
                className="mt-2"
                position="LEFT"
                value={new Date(form.serviced_on)}
                onChange={(date) => {
                  setForm({
                    ...form,
                    serviced_on: dayjs(date).format("YYYY-MM-DD"),
                  });
                }}
                max={new Date(props.service_record.created_date)}
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
        <div className="flex justify-end">
          <ButtonV2
            variant="primary"
            onClick={handleSubmit}
            className="mr-2"
            loading={isLoading}
          >
            {isLoading ? "Updating" : "Update"}
          </ButtonV2>
          <ButtonV2 variant="secondary" onClick={props.handleClose}>
            Cancel
          </ButtonV2>
        </div>
      </div>
    </DialogModal>
  );
};
