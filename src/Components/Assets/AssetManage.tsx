import { useState, useCallback, useEffect, ReactElement, lazy } from "react";
import {
  AssetClass,
  assetClassProps,
  AssetData,
  AssetTransaction,
} from "./AssetTypes";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch } from "react-redux";
import {
  deleteAsset,
  getAsset,
  listAssetTransaction,
} from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import QRCode from "qrcode.react";
import AssetWarrantyCard from "./AssetWarrantyCard";
import { formatDate, formatDateTime } from "../../Utils/utils";
import Chip from "../../CAREUI/display/Chip";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { UserRole, USER_TYPES } from "../../Common/constants";
import ConfirmDialog from "../Common/ConfirmDialog";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { useTranslation } from "react-i18next";
const PageTitle = lazy(() => import("../Common/PageTitle"));
const Loading = lazy(() => import("../Common/Loading"));
import * as Notification from "../../Utils/Notifications.js";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import Uptime from "../Common/Uptime";
import useAuthUser from "../../Common/hooks/useAuthUser";

interface AssetManageProps {
  assetId: string;
  facilityId: string;
}

const checkAuthority = (type: string, cutoff: string) => {
  const userAuthority = USER_TYPES.indexOf(type as UserRole);
  const cutoffAuthority = USER_TYPES.indexOf(cutoff as UserRole);
  return userAuthority >= cutoffAuthority;
};

const AssetManage = (props: AssetManageProps) => {
  const { t } = useTranslation();
  const { assetId, facilityId } = props;
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
  const dispatch = useDispatch<any>();
  const limit = 14;
  const authUser = useAuthUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const assetData = await dispatch(getAsset(assetId));
      if (!status.aborted) {
        setIsLoading(false);
        if (assetData?.data) {
          setAsset(assetData.data);

          const transactionFilter = assetData.qr_code_id
            ? { qr_code_id: assetData.qr_code_id }
            : { external_id: assetId };

          const transactionsData = await dispatch(
            listAssetTransaction({
              ...transactionFilter,
              limit,
              offset,
            })
          );
          if (transactionsData?.data) {
            setTransactions(transactionsData.data.results);
            setTotalCount(transactionsData.data.count);
          } else {
            Notification.Error({
              msg: "Error fetching transactions",
            });
          }
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
        <QRCode size={200} value={asset?.id ?? ""} />
      </div>
    </div>
  );
  const populateTableRows = (txns: AssetTransaction[]) => {
    if (txns.length > 0) {
      setTransactionDetails(
        transactions.map((transaction: AssetTransaction) => (
          <tr key={`transaction_id_${transaction.id}`}>
            <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
              <span className="font-medium text-gray-900">
                {transaction.from_location.name}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
              <span className="font-medium text-gray-900">
                {transaction.to_location.name}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
              <span className="font-medium text-gray-900">
                {transaction.performed_by.first_name}{" "}
                {transaction.performed_by.last_name}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-gray-500">
              <span className="font-medium text-gray-900">
                {formatDateTime(transaction.modified_date)}
              </span>
            </td>
          </tr>
        ))
      );
    } else {
      setTransactionDetails(
        <tr>
          <td
            className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-gray-500"
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
    assetClassProps.NONE;

  const detailBlock = (item: any) =>
    item.hide ? null : (
      <div className="flex grow-0 flex-col md:w-[200px]">
        <div className="flex-start flex items-center">
          <div className="w-8">
            <CareIcon className={`care-l-${item.icon} fill-gray-700 text-lg`} />
          </div>
          <div className="break-words text-gray-700">{item.label}</div>
        </div>
        <div className="ml-8 grow-0 break-words text-lg font-semibold">
          {item.content || "--"}
        </div>
      </div>
    );

  const downloadJSON = (data: AssetData) => {
    const a = document.createElement("a");
    const blob = new Blob([JSON.stringify([data])], {
      type: "application/json",
    });
    a.href = URL.createObjectURL(blob);
    a.download = `asset_${data.id}.json`;
    a.click();
  };

  const handleDownload = async () => {
    if (asset) downloadJSON(asset);
  };

  const handleDelete = async () => {
    if (asset) {
      const response = await dispatch(deleteAsset(asset.id));
      if (response && response.status === 204) {
        Notification.Success({
          msg: "Asset deleted successfully",
        });
        navigate("/assets");
      }
    }
  };

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title="Asset Details"
        crumbsReplacements={{
          [facilityId]: { name: asset?.location_object.facility.name },
          assets: { uri: `/assets?facility=${facilityId}` },
          [assetId]: {
            name: asset?.name,
          },
        }}
        backUrl="/assets"
      />
      <ConfirmDialog
        title="Delete Asset"
        description="Are you sure you want to delete this asset?"
        action="Confirm"
        variant="danger"
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="service-panel flex w-full rounded-lg bg-white md:rounded-xl">
          <div className="flex w-full flex-col justify-between gap-6 p-6 pt-4 md:p-8 md:pt-6">
            <div>
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="break-words text-2xl font-bold md:text-3xl">
                    {asset?.name}
                  </span>
                  <ButtonV2
                    onClick={handleDownload}
                    className="tooltip p-4"
                    variant="secondary"
                    ghost
                    circle
                  >
                    <CareIcon className="care-l-export text-lg" />
                    <span className="tooltip-text tooltip-bottom -translate-x-16">
                      Export as JSON
                    </span>
                  </ButtonV2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {asset?.status === "ACTIVE" ? (
                    <Chip text="Active" startIcon="l-check" />
                  ) : (
                    <Chip
                      variant="warning"
                      text="Transfer in progress"
                      startIcon="l-exclamation"
                    />
                  )}
                  {asset?.is_working ? (
                    <Chip text="Working" startIcon="l-check" />
                  ) : (
                    <Chip
                      variant="danger"
                      text="Not Working"
                      startIcon="l-times"
                    />
                  )}
                </div>
              </div>
              <span className="text-gray-700">{asset?.description}</span>
            </div>
            <div className="flex flex-col gap-6">
              {[
                {
                  label: asset?.location_object.facility.name,
                  icon: "location-pin-alt",
                  content: asset?.location_object.name,
                },
                {
                  label: "Asset Type",
                  icon: "apps",
                  content:
                    asset?.asset_type === "INTERNAL"
                      ? "Internal Asset"
                      : "External Asset",
                },
                {
                  label: "Asset Class",
                  icon: assetClassProp.icon,
                  content: assetClassProp.name,
                },
                {
                  label: "Asset QR Code ID",
                  icon: "qrcode-scan",
                  content: asset?.qr_code_id,
                },
                {
                  label: "Not working reason",
                  icon: "exclamation-circle",
                  content: asset?.not_working_reason,
                  hide: asset?.is_working,
                },
              ].map(detailBlock)}
            </div>
            <div className="flex flex-col gap-1 md:flex-row">
              <ButtonV2
                className="flex gap-2"
                onClick={() =>
                  navigate(
                    `/facility/${asset?.location_object.facility.id}/assets/${asset?.id}/update`
                  )
                }
                id="update-asset"
                data-testid="asset-update-button"
                authorizeFor={NonReadOnlyUsers}
              >
                <CareIcon className="care-l-pen mr-1 h-4" />
                {t("update")}
              </ButtonV2>
              {asset?.asset_class && (
                <ButtonV2
                  onClick={() =>
                    navigate(
                      `/facility/${asset?.location_object.facility.id}/assets/${asset?.id}/configure`
                    )
                  }
                  id="configure-asset"
                  authorizeFor={NonReadOnlyUsers}
                >
                  <CareIcon className="care-l-setting h-4" />
                  {t("configure")}
                </ButtonV2>
              )}
              {checkAuthority(authUser.user_type, "DistrictAdmin") && (
                <ButtonV2
                  authorizeFor={NonReadOnlyUsers}
                  onClick={() => setShowDeleteDialog(true)}
                  variant="danger"
                  data-testid="asset-delete-button"
                  className="inline-flex"
                >
                  <CareIcon className="care-l-trash h-4" />
                  <span className="md:hidden">{t("delete")}</span>
                </ButtonV2>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col justify-between gap-2 border-gray-300 p-6 md:border-l md:p-8">
            <div>
              <div className="mb-5 text-lg font-bold">Service Details</div>
              <div className="flex flex-col gap-6">
                {[
                  {
                    label: "Last serviced on",
                    icon: "wrench",
                    content:
                      asset?.last_serviced_on &&
                      formatDate(asset?.last_serviced_on),
                  },
                  {
                    label: "Notes",
                    icon: "notes",
                    content: asset?.notes,
                  },
                ].map(detailBlock)}
              </div>
            </div>

            <div className="flex flex-col justify-end break-words text-sm text-gray-600">
              {asset?.created_date && (
                <RecordMeta prefix={t("created")} time={asset?.created_date} />
              )}
              {asset?.modified_date && (
                <RecordMeta prefix={t("updated")} time={asset?.modified_date} />
              )}
            </div>
          </div>
        </div>
        {asset && (
          <div className="flex flex-col items-center justify-center gap-8 transition-all duration-200 ease-in md:flex-row lg:gap-4 xl:flex-col xl:gap-8">
            <AssetWarrantyCard asset={asset} />
          </div>
        )}
      </div>
      {asset?.id &&
        asset?.asset_class &&
        asset?.asset_class != AssetClass.NONE && <Uptime assetId={asset?.id} />}
      <div className="mb-4 mt-8 text-xl font-semibold">Transaction History</div>
      <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                Moved from
              </th>
              <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                Moved to
              </th>
              <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                Moved By
              </th>
              <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">
                Moved On
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
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
  );
};

export default AssetManage;
