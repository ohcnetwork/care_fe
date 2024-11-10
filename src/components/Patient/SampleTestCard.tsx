import { camelCase, startCase } from "lodash-es";
import { navigate } from "raviger";
import { useState } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import RelativeDateUserMention from "@/components/Common/RelativeDateUserMention";
import UpdateStatusDialog from "@/components/Patient/UpdateStatusDialog";
import { SampleTestModel } from "@/components/Patient/models";

import { SAMPLE_TEST_STATUS } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

interface SampleDetailsProps {
  facilityId: number;
  patientId: number;
  itemData: SampleTestModel;
  refetch: () => void;
  handleApproval: (status: number, sample: SampleTestModel) => void;
}

export const SampleTestCard = (props: SampleDetailsProps) => {
  const { itemData, handleApproval, facilityId, patientId, refetch } = props;

  const [statusDialog, setStatusDialog] = useState<{
    show: boolean;
    sample: SampleTestModel;
  }>({ show: false, sample: {} });

  const handleApproval1 = async (
    sample: SampleTestModel,
    status: number,
    result: number,
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
    await request(routes.patchSample, {
      pathParams: {
        id: sample.id!,
      },
      body: sampleData,
      onResponse: ({ res }) => {
        if (res?.ok) {
          refetch();
          Notification.Success({
            msg: `Success - ${statusName}`,
          });
        }
        dismissUpdateStatus();
      },
    });
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
            `/facility/${facilityId}/patient/${patientId}/sample/${itemData.id}`,
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
              {startCase(camelCase(itemData.status))}
            </div>
          </div>
        </div>
        <div>
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              Sample Type{" "}
            </div>
            <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium capitalize leading-5">
              {itemData.sample_type?.toLowerCase()}
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
              {startCase(camelCase(itemData.result))}
            </div>
          </div>
        </div>
      </div>
      <div className="m-2 mt-4 flex flex-col justify-between md:flex-row lg:gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <div className="mb-2 text-sm text-secondary-700">
              <span className="font-medium text-black">Date of Sample:</span>{" "}
              {itemData.date_of_sample
                ? formatDateTime(itemData.date_of_sample)
                : "Not Available"}
            </div>
            <div className="text-sm text-secondary-700">
              <span className="font-medium text-black">Date of Result:</span>{" "}
              {itemData.date_of_result
                ? formatDateTime(itemData.date_of_result)
                : "Not Available"}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col flex-nowrap items-center justify-end text-sm text-secondary-700 md:flex-col md:items-start md:justify-start lg:flex-row lg:items-center">
            <div className="font-medium text-black">Created: </div>

            <RelativeDateUserMention
              actionDate={itemData.created_date}
              user={itemData.created_by}
              tooltipPosition="left"
            />
          </div>
          <div className="flex flex-col items-center justify-end text-sm text-secondary-700 md:flex-col md:items-start lg:flex-row lg:items-center">
            <div className="font-medium text-black">Last Modified: </div>
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
            className="border border-secondary-500 bg-white text-black hover:bg-secondary-300"
          >
            Send to Collection Centre
          </ButtonV2>
        )}
        <ButtonV2
          onClick={() => showUpdateStatus(itemData)}
          className="border border-secondary-500 bg-white text-black hover:bg-secondary-300"
          authorizeFor={NonReadOnlyUsers}
        >
          Update Sample Test Status
        </ButtonV2>
        <ButtonV2
          onClick={(_e) => navigate(`/sample/${itemData.id}`)}
          className="border border-secondary-500 bg-white text-black hover:bg-secondary-300"
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
