import { useState, useCallback, useEffect, ReactElement } from "react";

import loadable from "@loadable/component";
import moment from "moment";
import { assetClassProps, AssetData, AssetTransaction } from "./AssetTypes";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch } from "react-redux";
import { getAsset, listAssetTransaction } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import QRCode from "qrcode.react";
import AssetWarrantyCard from "./AssetWarrantyCard";
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
        className={`font-medium tracking-wider py-1 px-3 uppercase rounded-full text-sm ${className}`}
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

  const assetClassProp =
    (asset?.asset_class && assetClassProps[asset.asset_class]) ||
    assetClassProps.None;

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title="Asset Details"
        crumbsReplacements={{ [assetId]: { name: asset?.name } }}
      />
      <div className="my-8 bg-white rounded-lg md:rounded-xl md:p-8 p-6 max-w-6xl mx-auto">
        <div className="mb-4 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 justify-between w-full">
            <span className="text-2xl md:text-3xl font-semibold break-words">
              {asset?.name}
            </span>
            <div className=" flex flex-wrap gap-2">
              {status(asset?.status)}
              {workingStatus(asset?.is_working)}
            </div>
          </div>
          <span className="text-gray-700">{asset?.description}</span>
        </div>

        <div className="flex flex-col justify-between">
          <div className="m-2 sm:m-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 md:gap-x-16 w-full mb-12">
            {/* Location Detail */}
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-8">
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
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-8">
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

            {/* Asset Class */}
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-12">
              <span className="text-gray-600 text-xl">
                {assetClassProp.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-gray-700">Asset Class</span>
                <span className="font-medium text-lg text-gray-900">
                  {assetClassProp.name}
                </span>
              </div>
            </div>

            {/* Not working reason */}
            {asset?.is_working === false && (
              <div className="flex flex-row items-center gap-4 mb-6 md:mb-12">
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

            <span className="font-medium text-gray-800 mb-4 col-span-1 md:col-span-2 xl:col-span-3">
              Service Details
            </span>

            {/* Last Serviced On */}
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-12">
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
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-12">
              <i className="fas fa-sticky-note text-xl text-gray-600" />
              <div className="flex flex-col">
                <span className="text-gray-700">Notes</span>
                <span className="text-gray-900">{asset?.notes || "--"}</span>
              </div>
            </div>
          </div>
          {asset && (
            <div className="flex gap-8 lg:gap-4 xl:gap-8 items-center justify-center flex-col lg:flex-row transition-all duration-200 ease-in">
              <AssetWarrantyCard asset={asset} view="front" />
              <AssetWarrantyCard asset={asset} view="back" />
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row mt-8 gap-1">
          <button
            onClick={() =>
              navigate(
                `/facility/${asset?.location_object.facility.id}/assets/${asset?.id}`
              )
            }
            id="update-asset"
            className="primary-button"
          >
            <i className="fas fa-pencil-alt text-white mr-4" />
            Update
          </button>
          {asset?.asset_class && (
            <button
              onClick={() => navigate(`/assets/${asset?.id}/configure`)}
              id="configure-asset"
              className="primary-button"
            >
              <i className="fas fa-cog text-white mr-4"></i>
              Configure
            </button>
          )}
        </div>
        <div className="flex md:flex-row flex-col gap-2 justify-between pt-4 -mb-4">
          <div className="flex flex-col text-xs text-gray-700 font-base leading-relaxed">
            <div>
              <span className="text-gray-900">Created: </span>
              {moment(asset?.created_date).format("lll")}
            </div>
          </div>
          <div className="flex flex-col text-xs md:text-right text-gray-700 font-base leading-relaxed">
            <div>
              <span className="text-gray-900">Last Modified: </span>
              {moment(asset?.modified_date).format("lll")}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg md:p-6 p-3 mt-2 max-w-6xl mx-auto">
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
