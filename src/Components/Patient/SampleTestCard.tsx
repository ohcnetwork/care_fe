import { CardContent } from "@material-ui/core";
import { navigate } from "raviger";
import React, { useState } from "react";
import { SampleTestModel } from "./models";
import { useDispatch, useSelector } from "react-redux";
import { SAMPLE_TEST_STATUS } from "../../Common/constants";
import { patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import UpdateStatusDialog from "./UpdateStatusDialog";
import _ from "lodash";
import { formatDate } from "../../Utils/utils";
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
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const userType: "Staff" | "DistrictAdmin" | "StateLabAdmin" =
    currentUser.data.user_type;

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
    <div className="block border rounded-lg bg-white shadow cursor-pointer hover:border-primary-500 text-black mt-4">
      <CardContent>
        <div
          onClick={(_e) =>
            navigate(
              `/facility/${facilityId}/patient/${patientId}/sample/${itemData.id}`
            )
          }
          className="grid gap-4 grid-cols-1 md:grid-cols-4 ml-2 mt-2"
        >
          <div>
            <div className="sm:col-span-1">
              <div className="text-sm leading-5 font-semibold text-zinc-400">
                Status{" "}
              </div>
              <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                {_.startCase(_.camelCase(itemData.status))}
              </div>
            </div>
          </div>
          <div>
            <div className="sm:col-span-1">
              <div className="text-sm leading-5 font-semibold text-zinc-400">
                Sample Type{" "}
              </div>
              <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                {itemData.sample_type !== "OTHER TYPE"
                  ? itemData.sample_type
                  : itemData.sample_type_other}
              </div>
            </div>
          </div>
          {itemData.fast_track && (
            <div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-semibold text-zinc-400">
                  Fast-Track{" "}
                </div>
                <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                  {itemData.fast_track}
                </div>
              </div>
            </div>
          )}
          <div>
            <div className="sm:col-span-1">
              <div className="text-sm leading-5 font-semibold text-zinc-400">
                Result{" "}
              </div>
              <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                {_.startCase(_.camelCase(itemData.result))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col md:flex-row justify-between gap-4 ml-2">
          <div>
            <div className="text-gray-700 text-sm mb-2">
              <span className="text-black font-medium">Date of Sample:</span>{" "}
              {itemData.date_of_sample
                ? formatDate(itemData.date_of_sample)
                : "Not Available"}
            </div>
            <div className="text-gray-700 text-sm">
              <span className="text-black font-medium">Date of Result:</span>{" "}
              {itemData.date_of_result
                ? formatDate(itemData.date_of_result)
                : "Not Available"}
            </div>
          </div>
        </div>
        <div className="flex flex-col mt-6 gap-2 ml-2">
          {
            <div className="text-sm text-gray-700 items-center flex flex-col md:flex-row">
              Created:{" "}
              <RelativeDateUserMention
                actionDate={itemData.created_date}
                user={itemData.created_by}
              />
            </div>
          }
          <div className="text-sm text-gray-700 items-center flex flex-col md:flex-row">
            Last Modified:{" "}
            <RelativeDateUserMention
              actionDate={itemData.modified_date}
              user={itemData.last_edited_by}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 md:flex-row justify-between mx-2">
          {itemData.status === "APPROVED" && (
            <ButtonV2
              onClick={(e) => {
                e.stopPropagation();
                handleApproval(4, itemData);
              }}
              className="bg-white hover:bg-gray-300 border border-gray-500 text-black"
            >
              Send to Collection Centre
            </ButtonV2>
          )}
          <ButtonV2
            onClick={() => showUpdateStatus(itemData)}
            className="bg-white hover:bg-gray-300 border border-gray-500 text-black"
            authorizeFor={NonReadOnlyUsers}
          >
            Update Sample Test Status
          </ButtonV2>
          <ButtonV2
            onClick={(_e) => navigate(`/sample/${itemData.id}`)}
            className="bg-white hover:bg-gray-300 border border-gray-500 text-black"
          >
            Sample Report
          </ButtonV2>
        </div>
      </CardContent>
      {statusDialog.show && (
        <UpdateStatusDialog
          sample={statusDialog.sample}
          handleOk={handleApproval1}
          handleCancel={dismissUpdateStatus}
          userType={userType}
        />
      )}
    </div>
  );
};
