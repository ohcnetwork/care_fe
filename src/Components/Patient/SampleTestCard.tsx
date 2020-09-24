import { Button, CardContent } from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import React, { useState } from "react";
import { SampleTestModel } from "./models";
import { useDispatch, useSelector } from "react-redux";
import { SAMPLE_TEST_STATUS } from "../../Common/constants";
import { patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import UpdateStatusDialog from "./UpdateStatusDialog";

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
    let sampleData: any = {
      id: sample.id,
      status,
      consultation: sample.consultation,
    };
    if (status === 7) {
      sampleData.result = result;
    }
    const statusName = SAMPLE_TEST_STATUS.find((i) => i.id === status)?.desc;
    const res = await dispatch(patchSample(sample.id, sampleData));
    if (res && (res.status === 201 || res.status === 200)) {
      window.location.reload(false);
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
    <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4">
      <CardContent>
        <div
          onClick={(e) =>
            navigate(
              `/facility/${facilityId}/patient/${patientId}/sample/${itemData.id}`
            )
          }
          className="grid gap-4 grid-cols-1 md:grid-cols-2"
        >
          <div>
            <span className="text-gray-700">Status: </span>
            {itemData.status}
          </div>
          <div>
            <span className="text-gray-700">Result: </span>
            {itemData.result}
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-700">Sample Type: </span>
            {itemData.sample_type !== "OTHER TYPE"
              ? itemData.sample_type
              : itemData.sample_type_other}
          </div>
          {itemData.fast_track && (
            <div className="md:col-span-2">
              <span className="text-gray-700">Fast-Track:</span>{" "}
              {itemData.fast_track}
            </div>
          )}
          {itemData.date_of_result && (
            <div>
              <span className="text-gray-700">Tested on :</span>{" "}
              {moment(itemData.date_of_result).format("lll")}
            </div>
          )}
          {itemData.date_of_result && (
            <div>
              <span className="text-gray-700">Result on:</span>{" "}
              {moment(itemData.date_of_result).format("lll")}
            </div>
          )}
        </div>
        {itemData.status === "APPROVED" && (
          <div className="mt-4">
            <Button
              style={{ color: "green" }}
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handleApproval(4, itemData);
              }}
            >
              Sent to Collection Centre
            </Button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap justify-between w-full">
          <button
            onClick={(e) =>
              navigate(
                `/patient/${itemData.patient}/test_sample/${itemData.id}/icmr_sample`
              )
            }
            className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
          >
            View Sample Report
          </button>
          <button
            onClick={(e) => showUpdateStatus(itemData)}
            className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
          >
            UPDATE SAMPLE TEST STATUS
          </button>
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
