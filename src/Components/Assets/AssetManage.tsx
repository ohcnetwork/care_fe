import React, { useState, useCallback, useEffect, ReactElement } from "react";

import loadable from "@loadable/component";
import moment from "moment";
import { AssetData, AssetTransaction } from "./AssetTypes";
import * as Notification from "../../Utils/Notifications.js";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch } from "react-redux";
import { Typography } from "@material-ui/core";
import { getAsset, listAssetTransaction } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import QRCode from "qrcode.react";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface AssetManageProps {
  assetId: string;
}

const AssetManage = (props: AssetManageProps) => {
  const { assetId } = props;
  const [asset, setAsset] = useState<AssetData>();
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [transactions, setTransactions] = useState<AssetTransaction[]>([]);
  const [transactionDetails, setTransactionDetails] = useState<
    ReactElement | ReactElement[]
  >();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const [assetData, transactionsData]: any = await Promise.all([
        dispatch(getAsset(assetId)),
        dispatch(listAssetTransaction({ asset: assetId, limit, offset })),
      ]);
      if (!status.aborted) {
        setIsLoading(false);
        if (!assetData.data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAsset(assetData.data);
          setTransactions(transactionsData.data.results);
          setTotalCount(transactionsData.data.count);
        }
      }
    },
    [dispatch, assetId, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const PrintPreview = () => (
    <div className="">
      <div className="my-4 flex justify-end ">
        <button
          onClick={(_) => window.print()}
          className="btn btn-primary mr-2"
        >
          <i className="fas fa-print mr-2"></i> Print QR Code
        </button>
        <button
          onClick={(_) => setIsPrintMode(false)}
          className="btn btn-default"
        >
          <i className="fas fa-times mr-2"></i> Close
        </button>
      </div>
      <h2 className="text-center">Print Preview</h2>
      <div id="section-to-print" className="print flex justify-center">
        <QRCode size={200} value={asset?.id || ""} />
      </div>
    </div>
  );

  const working_status = (is_working: boolean | undefined) => {
    const bgColorClass = is_working ? "bg-green-500" : "bg-red-500";
    return (
      <span
        className={`${bgColorClass} text-white text-sm px-2 py-1 uppercase rounded-full`}
      >
        {!is_working && "Not "} Working
      </span>
    );
  };

  const status = (
    asset_status: "ACTIVE" | "TRANSFER_IN_PROGRESS" | undefined
  ) => {
    if (asset_status === "ACTIVE") {
      return (
        <span className="bg-green-500 text-white text-sm px-2 py-1 uppercase rounded-full">
          ACTIVE
        </span>
      );
    }
    return (
      <span className="bg-yellow-500 text-white text-sm px-2 py-1 uppercase rounded-full">
        TRANSFER IN PROGRESS
      </span>
    );
  };

  const populateTableRows = (txns: AssetTransaction[]) => {
    if (txns.length > 0) {
      setTransactionDetails(
        transactions.map((transaction: AssetTransaction) => (
          <tr>
            <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
              <span className="text-cool-gray-900 font-medium">
                {transaction.from_location.name}
              </span>
            </td>
            <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
              <span className="text-cool-gray-900 font-medium">
                {transaction.to_location.name}
              </span>
            </td>
            <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
              <span className="text-cool-gray-900 font-medium">
                {transaction.performed_by.first_name}{" "}
                {transaction.performed_by.last_name}
              </span>
            </td>
            <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
              <span className="text-cool-gray-900 font-medium">
                {moment(transaction.modified_date).format("lll")}
              </span>
            </td>
          </tr>
        ))
      );
    } else {
      setTransactionDetails(
        <tr>
          <td
            className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-cool-gray-500 text-center"
            colSpan={4}
          >
            <h5>No Transactions Found</h5>
          </td>
        </tr>
      );
    }
  };

  useEffect(() => {
    populateTableRows(transactions);
  }, [transactions]);

  if (isLoading) return <Loading />;
  if (isPrintMode) return <PrintPreview />;
  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={asset?.name || "Asset"}
        crumbsReplacements={{ [assetId]: { name: asset?.name } }}
      />
      <div className="bg-white rounded-lg md:p-6 p-3 shadow">
        <div className="md:flex justify-between">
          <div className="mb-2">
            <div className="text-xl font-semibold">{asset?.name}</div>
            <Typography>Location : {asset?.location_object.name}</Typography>
            <Typography>
              Facility : {asset?.location_object.facility.name}
            </Typography>
            <Typography>Serial Number : {asset?.serial_number}</Typography>
            <Typography>Status : {status(asset?.status)}</Typography>
            <Typography>
              Warranty Details : {asset?.warranty_details}
            </Typography>
            <Typography>Type : {asset?.asset_type}</Typography>
            <Typography>
              Working status : {working_status(asset?.is_working)}
            </Typography>
            <Typography>Vendor Name : {asset?.vendor_name}</Typography>
            <Typography>
              Customer Support Name : {asset?.support_name}
            </Typography>
            <Typography>
              Contact Phone Number : {asset?.support_phone}
            </Typography>
            <Typography>Contact Email : {asset?.support_email}</Typography>
          </div>
          <div className="flex flex-col">
            <div className="mb-1">
              <QRCode
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="Q"
                size={128}
                value={asset?.id || ""}
              />
              <button
                className="btn btn-primary mt-2 w-full"
                onClick={() => setIsPrintMode(true)}
              >
                Print QR
              </button>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/facility/${asset?.location_object.facility.id}/assets/${asset?.id}`
                )
              }
              id="update-asset"
              className="btn-primary btn"
            >
              <i className="fas fa-pencil-alt text-white mr-2"></i>
              Update Asset
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg md:p-6 p-3 shadow mt-2">
        <div className="text-xl font-semibold">Transaction History</div>
        <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-cool-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  Moved from
                </th>
                <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  Moved to
                </th>
                <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  Moved By
                </th>
                <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  Moved On
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-cool-gray-200">
              {transactionDetails}
            </tbody>
          </table>
        </div>
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManage;
