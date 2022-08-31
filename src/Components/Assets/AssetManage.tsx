import React, { useState, useCallback, useEffect, ReactElement } from "react";

import loadable from "@loadable/component";
import moment from "moment";
import { AssetData, AssetTransaction } from "./AssetTypes";
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
        if (assetData && assetData.data) {
          setAsset(assetData.data);
          setTransactions(transactionsData.data.results);
          setTotalCount(transactionsData.data.count);
        } else {
          navigate("/not-found");
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

  const badge = (label: string, className: string) => {
    return (
      <span
        className={`font-medium tracking-wider py-1 px-3 uppercase rounded-full shadow text-sm ${className}`}
      >
        {label}
      </span>
    );
  };

  const workingStatus = (is_working: boolean | undefined) =>
    is_working
      ? badge("Working", "border border-green-500 text-primary-500 bg-white")
      : badge("Not Working", "animate-pulse bg-red-500 text-white");

  const status = (status: "ACTIVE" | "TRANSFER_IN_PROGRESS" | undefined) =>
    status === "ACTIVE"
      ? badge("Active", "border border-green-500 text-primary-500 bg-white")
      : badge("Transfer in progress", "animate-pulse bg-yellow-500 text-white");

  const warrantyCard = (asset?: AssetData) => {
    return (
      <div className="flex flex-wrap gap-8 my-3 mx-6">
        {/* Front Side */}
        <div className="rounded-2xl shadow-xl hover:shadow-2xl bg-fuchsia-700 hover:scale-[1.01] hover:bg-fuchsia-600 text-white p-6 w-96 h-56 transition-all">
          <div className="flex justify-end px-2">
            {asset?.manufacturer ? (
              <i className="font-bold text-2xl">{asset?.manufacturer}</i>
            ) : (
              <i className="text-2xl text-fuchsia-400">Manufacturer Unknown</i>
            )}
          </div>
          <div className="flex justify-center pt-6 flex-col">
            <span
              className={`uppercase tracking-widest font-bold text-xl ${
                !asset?.serial_number && "text-fuchsia-400"
              }`}
            >
              {asset?.serial_number || "--"}
            </span>
            <span className="tracking-wide text-sm">SERIAL NUMBER</span>
          </div>
          <div className="flex justify-between pt-6">
            <div className=" flex flex-col justify-start">
              <span
                className={`uppercase tracking-widest font-bold text-xl ${
                  !asset?.warranty_amc_end_of_validity && "text-fuchsia-400"
                }`}
              >
                {(asset?.warranty_amc_end_of_validity &&
                  moment(asset?.warranty_amc_end_of_validity).format(
                    "DD/MM/YY"
                  )) ||
                  "--"}
              </span>
              <span className="tracking-wide text-sm">EXPIRY</span>
            </div>
            <div className=" flex flex-col items-end">
              <span
                className={`tracking-wide font-bold text-lg ${
                  !asset?.serial_number && "text-fuchsia-400"
                }`}
              >
                {asset?.vendor_name || "--"}
              </span>
              <span className="tracking-wide text-sm mr-2">VENDOR</span>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="rounded-2xl shadow-xl hover:shadow-2xl bg-fuchsia-700 hover:scale-[1.01] hover:bg-fuchsia-600 text-white p-6 w-96 h-56 transition-all">
          <div className="flex flex-col px-2 items-center">
            <span className="tracking-wide text-sm mb-6 justify-center">
              CUSTOMER SUPPORT DETAILS
            </span>
            {/* Support Name */}
            {asset?.support_name && (
              <span className="tracking-wide font-bold text-lg mb-2">
                {asset?.support_name}
              </span>
            )}
            {/* Support Phone */}
            {asset?.support_phone ? (
              <a
                href={`tel:${asset?.support_phone}`}
                className="group flex items-center justify-between text-white rounded hover:bg-fuchsia-500 py-2 px-3 transition-all"
              >
                <span className="tracking-wide font-medium text-fuchsia-50">
                  {asset?.support_phone}
                </span>
                <div className="ml-3 text-fuchsia-300 group-hover:text-fuchsia-100 transition-all">
                  <span className="text-sm">CALL</span>
                  <i className="fas fa-phone-alt ml-2" />
                </div>
              </a>
            ) : (
              <span className="tracking-wide text-sm text-fuchsia-400">
                No Support Number Provided
              </span>
            )}
            {/* Support Email */}
            {asset?.support_email ? (
              <a
                href={`mailto:${asset?.support_email}`}
                className="group flex items-center justify-between text-white rounded hover:bg-fuchsia-500 py-2 px-3 transition-all"
              >
                <span className="tracking-wide font-medium text-fuchsia-50">
                  {asset?.support_email}
                </span>
                <div className="ml-3 text-fuchsia-300 group-hover:text-fuchsia-100 transition-all">
                  <span className="text-sm">MAIL</span>
                  <i className="fas fa-envelope ml-2" />
                </div>
              </a>
            ) : (
              <span className="tracking-wide text-sm text-fuchsia-400">
                No Support Email Provided
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const populateTableRows = (txns: AssetTransaction[]) => {
    if (txns.length > 0) {
      setTransactionDetails(
        transactions.map((transaction: AssetTransaction) => (
          <tr key={`transaction_id_${transaction.id}`}>
            <td className="px-6 py-4 text-left whitespace-nowrap text-sm leading-5 text-gray-500">
              <span className="text-gray-900 font-medium">
                {transaction.from_location.name}
              </span>
            </td>
            <td className="px-6 py-4 text-left whitespace-nowrap text-sm leading-5 text-gray-500">
              <span className="text-gray-900 font-medium">
                {transaction.to_location.name}
              </span>
            </td>
            <td className="px-6 py-4 text-left whitespace-nowrap text-sm leading-5 text-gray-500">
              <span className="text-gray-900 font-medium">
                {transaction.performed_by.first_name}{" "}
                {transaction.performed_by.last_name}
              </span>
            </td>
            <td className="px-6 py-4 text-left whitespace-nowrap text-sm leading-5 text-gray-500">
              <span className="text-gray-900 font-medium">
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
            className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-gray-500 text-center"
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

  const renderDetail = (key: string, value: any) => {
    return (
      <Typography className="flex flex-col">
        <span className="font-bold">{key}</span>
        <span>{value || "--"}</span>
      </Typography>
    );
  };

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title="Asset Details"
        crumbsReplacements={{ [assetId]: { name: asset?.name } }}
      />
      <div className="bg-white rounded-lg md:rounded-xl md:p-8 p-6 shadow">
        <div className="mb-4 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl md:text-3xl font-semibold break-words">
              {asset?.name}
            </span>
            <div className="flex-1" />
            {status(asset?.status)}
            {workingStatus(asset?.is_working)}
          </div>
          <span className="text-gray-700">{asset?.description}</span>
        </div>

        <div className="md:flex justify-between">
          <div className="m-2 sm:m-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Location Detail */}
              <div className="flex flex-row items-center gap-4">
                <i className="fas fa-map-marker-alt text-xl text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-gray-700">
                    {asset?.location_object.facility.name}
                  </span>
                  <span className="font-medium text-lg text-gray-900">
                    {asset?.location_object.name}
                  </span>
                </div>
              </div>

              {/* Asset Type */}
              <div className="flex flex-row items-center gap-4">
                <i className="fas fa-cubes text-xl text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-gray-700">Asset Type</span>
                  <span className="font-medium text-lg text-gray-900">
                    {asset?.asset_type === "INTERNAL"
                      ? "Internal Asset"
                      : "External Asset"}
                  </span>
                </div>
              </div>

              {/* Not working reason */}
              {asset?.is_working === false && (
                <div className="flex flex-row items-center gap-4">
                  {/* description icon */}
                  <i className="fas fa-exclamation-circle text-xl text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-gray-700">Not working reason</span>
                    <span className="text-gray-900">
                      {asset?.not_working_reason || "--"}
                    </span>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-3">
                <span className="text-gray-700 md:col-span-2 lg:col-span-3 mb-2">
                  Service Details
                </span>
                {/* Last Serviced On */}
                <div className="flex flex-row items-center gap-4">
                  <i className="fas fa-tools text-xl text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-gray-700">Last serviced on</span>
                    <span className="font-medium text-lg text-gray-900">
                      {asset?.last_serviced_on
                        ? moment(asset?.last_serviced_on).format("MMM DD, YYYY")
                        : "--"}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-row items-center gap-4 lg:col-span-2">
                  <i className="fas fa-sticky-note text-xl text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-gray-700">Notes</span>
                    <span className="text-gray-900">
                      {asset?.notes || "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {warrantyCard(asset)}
        </div>
        <div className="flex mt-2 gap-1">
          <button
            onClick={() =>
              navigate(
                `/facility/${asset?.location_object.facility.id}/assets/${asset?.id}`
              )
            }
            id="update-asset"
            className="btn-primary"
          >
            <i className="fas fa-pencil-alt text-white mr-4"></i>
            Update
          </button>
          {asset?.asset_class && (
            <button
              onClick={() => navigate(`/assets/${asset?.id}/configure`)}
              id="configure-asset"
              className="btn-primary"
            >
              <i className="fas fa-cog text-white mr-4"></i>
              Configure
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg md:p-6 p-3 shadow mt-2">
        <div className="text-xl font-semibold">Transaction History</div>
        <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Moved from
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Moved to
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Moved By
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Moved On
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
