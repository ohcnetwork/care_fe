import { useState, useEffect, ReactElement } from "react";
import {
  AssetClass,
  assetClassProps,
  AssetData,
  AssetService,
  AssetTransaction,
} from "./AssetTypes";
import Pagination from "@/components/Common/Pagination";
import { navigate } from "raviger";
import QRCode from "qrcode.react";
import AssetWarrantyCard from "./AssetWarrantyCard";
import { formatDate, formatDateTime, formatName } from "../../Utils/utils";
import Chip from "../../CAREUI/display/Chip";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import { UserRole, USER_TYPES } from "@/common/constants";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { useTranslation } from "react-i18next";
import Loading from "@/components/Common/Loading";
import * as Notification from "../../Utils/Notifications";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import Uptime from "@/components/Common/Uptime";
import useAuthUser from "@/common/hooks/useAuthUser";
import dayjs from "dayjs";
import RelativeDateUserMention from "@/components/Common/RelativeDateUserMention";
import { AssetServiceEditModal } from "./AssetServiceEditModal";
import { warrantyAmcValidityChip } from "./AssetsList";
import Page from "@/components/Common/components/Page";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

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
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [transactionDetails, setTransactionDetails] = useState<
    ReactElement | ReactElement[]
  >();
  const [servicesDetails, setServiceDetails] = useState<
    ReactElement | ReactElement[]
  >();
  const limit = 14;
  const authUser = useAuthUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceEditData, setServiceEditData] = useState<
    AssetService & { open: boolean; viewOnly?: boolean }
  >();
  const [transactionFilter, setTransactionFilter] = useState<any>({});

  const { data: asset, loading } = useQuery(routes.getAsset, {
    pathParams: {
      external_id: assetId,
    },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setTransactionFilter(
          data.qr_code_id
            ? { qr_code_id: data.qr_code_id }
            : { external_id: assetId },
        );
      }
    },
  });

  const { data: transactions } = useQuery(routes.listAssetTransaction, {
    prefetch: !!asset,
    query: {
      ...transactionFilter,
      limit,
      offset,
    },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setTotalCount(data.count);
      }
    },
  });

  const { data: services, refetch: serviceRefetch } = useQuery(
    routes.listAssetService,
    {
      pathParams: {
        asset_external_id: assetId,
      },
    },
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const PrintPreview = () => (
    <div className="">
      <div className="my-4 flex justify-end">
        <button
          onClick={(_) => window.print()}
          className="btn btn-primary mr-2"
        >
          <CareIcon icon="l-print" className="mr-2 text-lg" />
          Print QR Code
        </button>
        <button
          onClick={(_) => setIsPrintMode(false)}
          className="btn btn-default"
        >
          <CareIcon icon="l-times" className="mr-2 text-lg" /> Close
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
        transactions?.results.map((transaction: AssetTransaction) => (
          <tr key={`transaction_id_${transaction.id}`}>
            <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-secondary-500">
              <span className="font-medium text-secondary-900">
                {transaction.from_location.name}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500">
              <span className="font-medium text-secondary-900">
                {transaction.to_location.name}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500">
              <span className="font-medium text-secondary-900">
                {formatName(transaction.performed_by)}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm leading-5 text-secondary-500">
              <span className="font-medium text-secondary-900">
                {formatDateTime(transaction.modified_date)}
              </span>
            </td>
          </tr>
        )),
      );
    } else {
      setTransactionDetails(
        <tr>
          <td
            className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500"
            colSpan={4}
          >
            <h5>No Transactions Found</h5>
          </td>
        </tr>,
      );
    }
  };

  const populateServiceTableRows = (txns: AssetService[]) => {
    if (txns.length > 0) {
      setServiceDetails(
        services?.results.map((service: AssetService) => (
          <tr key={`service_id_${service.id}`}>
            <td className="whitespace-nowrap px-6 py-4 text-left text-sm leading-5 text-secondary-500">
              <span className="font-medium text-secondary-900">
                {dayjs(service.serviced_on).format("DD MMM YYYY")}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500">
              <span className="whitespace-break-spaces break-words font-medium text-secondary-900">
                {service.note || "--"}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500">
              <span className="font-medium text-secondary-900">
                {formatDate(service.created_date)}
              </span>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500">
              <span className="flex justify-center font-medium text-secondary-900">
                {service.edits?.length > 1 ? (
                  <RelativeDateUserMention
                    actionDate={service.edits?.[0]?.edited_on}
                    user={service.edits?.[0]?.edited_by}
                  />
                ) : (
                  "--"
                )}
              </span>
            </td>
            <td className="gap-4 whitespace-nowrap px-6 py-4 text-right text-sm leading-5">
              <ButtonV2
                id="edit-service-history"
                authorizeFor={NonReadOnlyUsers}
                onClick={() => {
                  setServiceEditData({ ...service, open: true });
                }}
                className="mr-2"
              >
                <CareIcon icon="l-pen" className="text-lg" />
              </ButtonV2>
              <ButtonV2
                id="view-service-history"
                authorizeFor={NonReadOnlyUsers}
                tooltip={service.edits?.length < 2 ? "No previous edits" : ""}
                tooltipClassName="tooltip-left"
                disabled={service.edits?.length < 2}
                onClick={() => {
                  setServiceEditData({
                    ...service,
                    open: true,
                    viewOnly: true,
                  });
                }}
              >
                <CareIcon icon="l-eye" className="text-lg" />
              </ButtonV2>
            </td>
          </tr>
        )),
      );
    } else {
      setServiceDetails(
        <tr>
          <td
            className="whitespace-nowrap px-6 py-4 text-center text-sm leading-5 text-secondary-500"
            colSpan={4}
          >
            <h5>No Service Logs Found</h5>
          </td>
        </tr>,
      );
    }
  };

  useEffect(() => {
    if (transactions) populateTableRows(transactions.results);
  }, [transactions]);

  useEffect(() => {
    if (services) populateServiceTableRows(services?.results);
  }, [services]);

  if (loading) return <Loading />;
  if (isPrintMode) return <PrintPreview />;

  const assetClassProp =
    (asset?.asset_class && assetClassProps[asset.asset_class]) ||
    assetClassProps.NONE;

  const detailBlock = (item: any) =>
    item.hide ? null : (
      <div className="flex grow-0 flex-col md:w-[200px]">
        <div className="flex-start flex items-center">
          <div className="w-8">
            <CareIcon icon={item.icon} className="fill-secondary-700 text-lg" />
          </div>
          <div className="break-words text-secondary-700">{item.label}</div>
        </div>
        <div
          className="ml-8 grow-0 break-words text-lg font-semibold"
          id="asset-current-location"
        >
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
      await request(routes.deleteAsset, {
        pathParams: {
          external_id: asset.id,
        },
        onResponse: () => {
          Notification.Success({
            msg: "Asset deleted successfully",
          });
          navigate("/assets");
        },
      });
    }
  };

  return (
    <Page
      title="Asset Details"
      crumbsReplacements={{
        [facilityId]: { name: asset?.location_object.facility?.name },
        assets: { uri: `/assets?facility=${facilityId}` },
        [assetId]: {
          name: asset?.name,
        },
      }}
      backUrl="/assets"
      options={
        <ButtonV2
          onClick={handleDownload}
          className="tooltip py-2"
          ghost
          border
        >
          <CareIcon icon="l-export" className="text-lg" />
          Export as JSON
        </ButtonV2>
      }
    >
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
                  <div className="tooltip tooltip-bottom">
                    <CareIcon
                      icon={assetClassProp.icon}
                      className="fill-secondary-700 text-3xl"
                    />
                    <span className="tooltip-text">{assetClassProp.name}</span>
                  </div>
                </div>
                <div className="mb-2 w-full text-secondary-700 sm:hidden">
                  {asset?.description}
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
                  {warrantyAmcValidityChip(
                    asset?.warranty_amc_end_of_validity as string,
                  )}
                  {asset?.latest_status === "Down" && (
                    <Chip
                      variant="danger"
                      startIcon="l-link-broken"
                      text={asset?.latest_status}
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 hidden text-secondary-700 sm:block">
                {asset?.description}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {[
                {
                  label: asset?.location_object.facility?.name,
                  icon: "l-location-pin-alt",
                  content: asset?.location_object.name,
                },
                {
                  label: "Asset QR Code ID",
                  icon: "l-qrcode-scan",
                  content: asset?.qr_code_id,
                },
                {
                  label: "Not working reason",
                  icon: "l-exclamation-circle",
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
                    `/facility/${asset?.location_object.facility?.id}/assets/${asset?.id}/update`,
                  )
                }
                id="update-asset"
                data-testid="asset-update-button"
                authorizeFor={NonReadOnlyUsers}
              >
                <CareIcon icon="l-pen" className="text-lg" />
                {t("update")}
              </ButtonV2>
              {asset?.asset_class &&
                (asset?.asset_class !== "ONVIF" ||
                  ["DistrictAdmin", "StateAdmin", "Doctor"].includes(
                    authUser.user_type,
                  )) && (
                  <ButtonV2
                    onClick={() =>
                      navigate(
                        `/facility/${asset?.location_object.facility?.id}/assets/${asset?.id}/configure`,
                      )
                    }
                    id="configure-asset"
                    data-testid="asset-configure-button"
                  >
                    <CareIcon icon="l-setting" className="text-lg" />
                    {t("configure")}
                  </ButtonV2>
                )}
              {checkAuthority(authUser.user_type, "DistrictAdmin") && (
                <ButtonV2
                  authorizeFor={NonReadOnlyUsers}
                  onClick={() => setShowDeleteDialog(true)}
                  variant="danger"
                  data-testid="asset-delete-button"
                >
                  <CareIcon icon="l-trash" className="text-lg" />
                  <span>{t("delete")}</span>
                </ButtonV2>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col justify-between gap-2 border-secondary-300 p-6 md:border-l md:p-8">
            <div>
              <div className="mb-5 text-lg font-bold">Service Details</div>
              <div className="flex flex-col gap-6">
                {[
                  {
                    label: "Last serviced on",
                    icon: "l-wrench",
                    content:
                      asset?.last_service?.serviced_on &&
                      formatDate(asset?.last_service?.serviced_on),
                  },
                  {
                    label: "Notes",
                    icon: "l-notes",
                    content: asset?.last_service?.note,
                  },
                ].map(detailBlock)}
              </div>
            </div>

            <div className="flex flex-col justify-end break-words text-sm text-secondary-600">
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
        asset?.asset_class != AssetClass.NONE && (
          <Uptime
            route={routes.listAssetAvailability}
            params={{ external_id: asset.id }}
            header={
              <div className="text-xl font-semibold">Availability History</div>
            }
            parentClassNames="mt-8 flex w-full flex-col bg-white p-4 shadow-sm sm:rounded-lg"
          />
        )}
      <div className="mb-4 mt-8 text-xl font-semibold">Service History</div>
      <div
        className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg"
        id="service-history"
      >
        <table className="min-w-full divide-y divide-secondary-200">
          <thead>
            <tr>
              <th className="bg-secondary-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Serviced on
              </th>
              <th className="bg-secondary-50 px-6 py-3 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Note
              </th>
              <th className="bg-secondary-50 px-6 py-3 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Created on
              </th>
              <th className="bg-secondary-50 px-6 py-3 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Last Updated
              </th>
              <th className="relative right-10 bg-secondary-50 px-6 py-3 text-right text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Edit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 bg-white">
            {servicesDetails}
          </tbody>
        </table>
      </div>
      <div className="mb-4 mt-8 text-xl font-semibold">Transaction History</div>
      <div
        className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg"
        id="transaction-history"
      >
        <table className="min-w-full divide-y divide-secondary-200">
          <thead>
            <tr>
              <th className="bg-secondary-50 px-6 py-3 text-left text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Moved from
              </th>
              <th className="bg-secondary-50 px-6 py-3 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Moved to
              </th>
              <th className="bg-secondary-50 px-6 py-3 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Moved By
              </th>
              <th className="relative right-5 bg-secondary-50 px-6 py-3 text-right text-xs font-medium uppercase leading-4 tracking-wider text-secondary-500">
                Moved On
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 bg-white">
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
      {serviceEditData && (
        <AssetServiceEditModal
          asset={asset}
          service_record={serviceEditData}
          handleClose={() =>
            setServiceEditData({ ...serviceEditData, open: false })
          }
          handleUpdate={() => serviceRefetch()}
          show={serviceEditData.open}
          viewOnly={serviceEditData.viewOnly}
        />
      )}
    </Page>
  );
};

export default AssetManage;
