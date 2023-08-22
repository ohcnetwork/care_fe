import { navigate } from "raviger";
import { useState } from "react";
import { SampleTestModel } from "./models";
import { useDispatch } from "react-redux";
import { SAMPLE_TEST_STATUS } from "../../Common/constants";
import { patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import UpdateStatusDialog from "./UpdateStatusDialog";
import _ from "lodash";
import { formatDateTime } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import RelativeDateUserMention from "../Common/RelativeDateUserMention";

interface SampleDetailsProps {
  facilityId: number;
  patientId: number;
  itemData: SampleTestModel;
  handleApproval: (status: number, sample: SampleTestModel) => void;
}

export const SampleTestCard = (props: SampleDetailsProps) => {
  const { itemData, handleApproval, facilityId, patientId } = props;
  const dispatch: any = useDispatch();

  const [statusDialog, setStatusDialog] = useState<{
    show: boolean;
    sample: SampleTestModel;
  }>({ show: false, sample: {} });

  const handleApproval1 = async (
    sample: SampleTestModel,
    status: number,
    result: number
  ) => {
    const sampleData: any = {
      id: sample.id,
      status,
      consultation: sample.consultation,
    };
    if (status === 7) {
      sampleData.result = result;
      sampleData.date_of_result = new Date().toISOString();
    }
    const statusName = SAMPLE_TEST_STATUS.find((i) => i.id === status)?.desc;

    const res = await dispatch(patchSample(sampleData, { id: sample.id }));
    if (res && (res.status === 201 || res.status === 200)) {
      window.location.reload();
      Notification.Success({
        msg: `Success - ${statusName}`,
      });
    }
    dismissUpdateStatus();
  };

  const showUpdateStatus = (sample: SampleTestModel) => {
    setStatusDialog({
      show: true,
      sample,
    });
  };

  const dismissUpdateStatus = () => {
    setStatusDialog({
      show: false,
      sample: {},
    });
  };

  return (
    <div
      className={`${
        itemData.result === "POSITIVE"
          ? "border-red-500 bg-red-100 hover:border-red-700"
          : itemData.result === "NEGATIVE"
          ? "border-primary-500 bg-primary-100 hover:border-primary-700"
          : "bg-white hover:border-primary-500"
      } mt-4 block cursor-pointer rounded-lg border bg-white p-4 text-black shadow`}
    >
      <div
        onClick={(_e) =>
          navigate(
            `/facility/${facilityId}/patient/${patientId}/sample/${itemData.id}`
          )
        }
        className="ml-2 mt-2 grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        <div>
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              Status{" "}
            </div>
            <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
              {_.startCase(_.camelCase(itemData.status))}
            </div>
          </div>
        </div>
        <div>
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              Sample Type{" "}
            </div>
            <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
              {itemData.sample_type !== "OTHER TYPE"
                ? itemData.sample_type
                : itemData.sample_type_other}
            </div>
          </div>
        </div>
        {itemData.fast_track && (
          <div>
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Fast-Track{" "}
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                {itemData.fast_track}
              </div>
            </div>
          </div>
        )}
        <div>
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              Result{" "}
            </div>
            <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
              {_.startCase(_.camelCase(itemData.result))}
            </div>
          </div>
        </div>
      </div>
      <div className="m-2 mt-4 flex flex-col justify-between gap-4 md:flex-row">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <div className="mb-2 text-sm text-gray-700">
              <span className="font-medium text-black">Date of Sample:</span>{" "}
              {itemData.date_of_sample
                ? formatDateTime(itemData.date_of_sample)
                : "Not Available"}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium text-black">Date of Result:</span>{" "}
              {itemData.date_of_result
                ? formatDateTime(itemData.date_of_result)
                : "Not Available"}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-center justify-end text-sm text-gray-700 md:flex-row">
            Created:{" "}
            <RelativeDateUserMention
              actionDate={itemData.created_date}
              user={itemData.created_by}
              tooltipPosition="left"
            />
          </div>
          <div className="flex flex-col items-center justify-end text-sm text-gray-700 md:flex-row">
            Last Modified:{" "}
            <RelativeDateUserMention
              actionDate={itemData.modified_date}
              user={itemData.last_edited_by}
              tooltipPosition="left"
            />
          </div>
        </div>
      </div>
      <div className="mx-2 mt-4 flex flex-col justify-between gap-2 md:flex-row">
        {itemData.status === "APPROVED" && (
          <ButtonV2
            onClick={(e) => {
              e.stopPropagation();
              handleApproval(4, itemData);
            }}
            className="border border-gray-500 bg-white text-black hover:bg-gray-300"
          >
            Send to Collection Centre
          </ButtonV2>
        )}
        <ButtonV2
          onClick={() => showUpdateStatus(itemData)}
          className="border border-gray-500 bg-white text-black hover:bg-gray-300"
          authorizeFor={NonReadOnlyUsers}
        >
          Update Sample Test Status
        </ButtonV2>
        <ButtonV2
          onClick={(_e) => navigate(`/sample/${itemData.id}`)}
          className="border border-gray-500 bg-white text-black hover:bg-gray-300"
        >
          Sample Report
        </ButtonV2>
      </div>
      {statusDialog.show && (
        <UpdateStatusDialog
          sample={statusDialog.sample}
          handleOk={handleApproval1}
          handleCancel={dismissUpdateStatus}
        />
      )}
    </div>
  );
};
