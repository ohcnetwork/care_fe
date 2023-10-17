import QrReader from "react-qr-reader";
import * as Notification from "../../Utils/Notifications.js";
import { listAssets } from "../../Redux/actions";
import { assetClassProps, AssetData } from "./AssetTypes";
import { useState, useEffect, lazy } from "react";
import { Link, navigate } from "raviger";
import AssetFilter from "./AssetFilter";
import { parseQueryParams } from "../../Utils/primitives";
import Chip from "../../CAREUI/display/Chip";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import { FacilityModel } from "../Facility/models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useIsAuthorized } from "../../Common/hooks/useIsAuthorized";
import AuthorizeFor, { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import ButtonV2 from "../Common/components/ButtonV2";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import ExportMenu from "../Common/Export";
import CountBlock from "../../CAREUI/display/Count";
import AssetImportModal from "./AssetImportModal";
import Page from "../Common/components/Page";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import { useTranslation } from "react-i18next";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

const Loading = lazy(() => import("../Common/Loading"));

const AssetsList = () => {
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({
    limit: 18,
  });
  const [assets, setAssets] = useState([{} as AssetData]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [facility, setFacility] = useState<FacilityModel>();
  const [asset_type, setAssetType] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [facilityName, setFacilityName] = useState<string>();
  const [asset_class, setAssetClass] = useState<string>();
  const [importAssetModalOpen, setImportAssetModalOpen] = useState(false);
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const [showFacilityDialog, setShowFacilityDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const params = {
    limit: resultsPerPage,
    page: qParams.page,
    offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    search_text: qParams.search || "",
    facility: qParams.facility || "",
    asset_type: qParams.asset_type || "",
    asset_class: qParams.asset_class || "",
    location: qParams.facility ? qParams.location || "" : "",
    status: qParams.status || "",
  };

  useQuery(routes.listAssets, {
    query: params,
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setAssets(data.results);
        setTotalCount(data.count);
      }
    },
  });

  useQuery(routes.getAnyFacility, {
    pathParams: { id: qParams.facility },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setFacility(data);
        setSelectedFacility(data);
        setFacilityName(data.name);
      }
    },
    prefetch: !!qParams.facility,
  });

  useEffect(() => {
    setAssetType(qParams.asset_type);
  }, [qParams.asset_type]);

  useEffect(() => {
    setStatus(qParams.status);
  }, [qParams.status]);

  useEffect(() => {
    setAssetClass(qParams.asset_class);
  }, [qParams.asset_class]);

  const { data: location } = useQuery(routes.getFacilityAssetLocation, {
    pathParams: {
      facility_external_id: String(qParams.facility),
      external_id: String(qParams.location),
    },
    prefetch: !!(qParams.facility && qParams.location),
  });

  const getAssetIdFromQR = async (assetUrl: string) => {
    try {
      setIsLoading(true);
      setIsScannerActive(false);
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        const { data } = await request(routes.listAssets, {
          query: { qr_code_id: assetId },
        });
        return data?.results[0].id;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const checkValidAssetId = async (assetId: string) => {
    const { data: assetData } = await request(routes.getAsset, {
      pathParams: { id: assetId },
    });
    try {
      if (assetData) {
        navigate(
          `/facility/${assetData.location_object.facility.id}/assets/${assetId}`
        );
      }
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      Notification.Error({
        msg: "Invalid QR code scanned !!!",
      });
    }
  };

  const authorizedForImportExport = useIsAuthorized(
    AuthorizeFor(["DistrictAdmin", "StateAdmin"])
  );

  if (isScannerActive)
    return (
      <div className="mx-auto my-2 flex w-full flex-col items-end justify-start md:w-1/2">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <i className="fas fa-times mr-2"></i> Close Scanner
        </button>
        <QrReader
          delay={300}
          onScan={async (value: string | null) => {
            if (value) {
              const assetId = await getAssetIdFromQR(value);
              checkValidAssetId(assetId ?? value);
            }
          }}
          onError={(e) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
        <h2 className="self-center text-center text-lg">Scan Asset QR!</h2>
      </div>
    );

  let manageAssets = null;
  if (assetsExist) {
    manageAssets = (
      <div className="grid grid-cols-1 gap-2 md:-mx-8 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset: AssetData) => (
          <Link
            key={asset.id}
            href={`/facility/${asset?.location_object.facility.id}/assets/${asset.id}`}
            className="text-inherit"
            data-testid="created-asset-list"
          >
            <div
              key={asset.id}
              className="border-1 w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-white p-5 shadow hover:border-primary-500"
            >
              <div className="md:flex">
                <p className="flex break-words text-xl font-medium capitalize">
                  <span className="mr-2 text-primary-500">
                    <CareIcon
                      className={`care-l-${
                        (
                          (asset.asset_class &&
                            assetClassProps[asset.asset_class]) ||
                          assetClassProps.NONE
                        ).icon
                      } text-2xl`}
                    />
                  </span>
                  <p
                    className="w-48 truncate"
                    data-testid="created-asset-list-name"
                  >
                    {asset.name}
                  </p>
                </p>
              </div>
              <p className="text-sm font-normal">
                <span className="text-sm font-medium">
                  <CareIcon className="care-l-location-point mr-1 text-primary-500" />
                  {asset?.location_object?.name}
                </span>
                <span className="ml-2 text-sm font-medium">
                  <CareIcon className="care-l-hospital mr-1 text-primary-500" />
                  {asset?.location_object?.facility?.name}
                </span>
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {asset.is_working ? (
                  <Chip startIcon="l-cog" text="Working" />
                ) : (
                  <Chip variant="danger" startIcon="l-cog" text="Not Working" />
                )}
                {warrantyAmcValidityChip(asset.warranty_amc_end_of_validity)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  } else {
    manageAssets = (
      <div className="col-span-3 w-full rounded-lg bg-white p-2 py-8 pt-4 text-center">
        <p className="text-2xl font-bold text-gray-600">No Assets Found</p>
      </div>
    );
  }

  return (
    <Page
      title="Assets"
      breadcrumbs={false}
      hideBack
      options={
        <>
          {authorizedForImportExport && (
            <div className="tooltip" data-testid="import-asset-button">
              <ExportMenu
                label={importAssetModalOpen ? "Importing..." : "Import/Export"}
                exportItems={[
                  {
                    label: "Import Assets",
                    options: {
                      icon: (
                        <CareIcon className="care-l-import import-assets-button" />
                      ),
                      onClick: () => setImportAssetModalOpen(true),
                    },
                  },
                  {
                    label: "Export Assets (JSON)",
                    action: () =>
                      authorizedForImportExport &&
                      listAssets({
                        ...qParams,
                        json: true,
                        limit: totalCount,
                      }),
                    type: "json",
                    filePrefix: `assets_${facility?.name ?? "all"}`,
                    options: {
                      icon: <CareIcon className="care-l-export" />,
                      disabled: totalCount === 0 || !authorizedForImportExport,
                      id: "export-json-option",
                    },
                  },
                  {
                    label: "Export Assets (CSV)",
                    action: () =>
                      authorizedForImportExport &&
                      listAssets({
                        ...qParams,
                        csv: true,
                        limit: totalCount,
                      }),
                    type: "csv",
                    filePrefix: `assets_${facility?.name ?? "all"}`,
                    options: {
                      icon: <CareIcon className="care-l-export" />,
                      disabled: totalCount === 0 || !authorizedForImportExport,
                      id: "export-csv-option",
                    },
                  },
                ]}
              />
            </div>
          )}
        </>
      }
    >
      <div className="mt-5 gap-3 space-y-2 lg:flex">
        <CountBlock
          text="Total Assets"
          count={totalCount}
          loading={isLoading}
          icon="l-monitor-heart-rate"
          className="flex-1"
        />
        <div className="flex-1">
          <SearchInput
            name="search"
            value={qParams.search}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder="Search by name/serial no./QR code ID"
          />
        </div>
        <div className="flex flex-col items-start justify-start gap-2 lg:ml-2">
          <div className="flex w-full flex-col gap-2 md:flex-row lg:w-auto">
            <div className="w-full">
              <AdvancedFilterButton
                onClick={() => advancedFilter.setShow(true)}
              />
            </div>
            <ButtonV2
              className="w-full py-[11px]"
              onClick={() => setIsScannerActive(true)}
            >
              <i className="fas fa-search mr-1"></i> Scan Asset QR
            </ButtonV2>
          </div>
          <div
            className="flex w-full flex-col md:flex-row"
            data-testid="create-asset-buttom"
          >
            <ButtonV2
              authorizeFor={NonReadOnlyUsers}
              className="inline-flex w-full items-center justify-center"
              onClick={() => {
                if (qParams.facility) {
                  navigate(`/facility/${qParams.facility}/assets/new`);
                } else {
                  setShowFacilityDialog(true);
                }
              }}
            >
              <CareIcon className="care-l-plus-circle text-lg" />
              <span>{t("create_asset")}</span>
            </ButtonV2>
          </div>
        </div>
      </div>
      <AssetFilter {...advancedFilter} key={window.location.search} />
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <FilterBadges
            badges={({ badge, value }) => [
              value("Facility", "facility", facilityName ?? ""),
              badge("Name/Serial No./QR ID", "search"),
              value("Asset Type", "asset_type", asset_type ?? ""),
              value("Asset Class", "asset_class", asset_class ?? ""),
              value("Status", "status", status?.replace(/_/g, " ") ?? ""),
              value("Location", "location", location?.name ?? ""),
              value(
                "Warranty AMC End Of Validity Before",
                "warranty_amc_end_of_validity_before",
                qParams.warranty_amc_end_of_validity_before ?? ""
              ),
              value(
                "Warranty AMC End Of Validity After",
                "warranty_amc_end_of_validity_after",
                qParams.warranty_amc_end_of_validity_after ?? ""
              ),
            ]}
          />
          <div className="grow">
            <div className="py-8 md:px-5">
              {manageAssets}
              <Pagination totalCount={totalCount} />
            </div>
          </div>
        </>
      )}
      {typeof facility === "undefined" && (
        <FacilitiesSelectDialogue
          show={importAssetModalOpen}
          setSelected={(e) => setFacility(e)}
          selectedFacility={
            facility ?? {
              name: "",
            }
          }
          handleOk={() => {
            return undefined;
          }}
          handleCancel={() => {
            return setImportAssetModalOpen(false);
          }}
        />
      )}
      {facility && (
        <AssetImportModal
          open={importAssetModalOpen}
          onClose={() => {
            setImportAssetModalOpen(false);
            setFacility((f) => {
              if (!qParams.facility) {
                return undefined;
              }
              return f;
            });
          }}
          facility={facility}
        />
      )}
      <FacilitiesSelectDialogue
        show={showFacilityDialog}
        setSelected={(e) => setSelectedFacility(e)}
        selectedFacility={selectedFacility}
        handleOk={() => navigate(`facility/${selectedFacility.id}/assets/new`)}
        handleCancel={() => {
          setShowFacilityDialog(false);
          setSelectedFacility({ name: "" });
        }}
      />
    </Page>
  );
};

export const warrantyAmcValidityChip = (
  warranty_amc_end_of_validity: string
) => {
  if (warranty_amc_end_of_validity === "" || !warranty_amc_end_of_validity)
    return;
  const today = new Date();
  const warrantyAmcEndDate = new Date(warranty_amc_end_of_validity);

  const days = Math.ceil(
    Math.abs(Number(warrantyAmcEndDate) - Number(today)) / (1000 * 60 * 60 * 24)
  );

  if (warrantyAmcEndDate < today) {
    return (
      <Chip
        id="warranty-amc-expired-red"
        variant="danger"
        startIcon="l-times-circle"
        text="AMC/Warranty Expired"
      />
    );
  } else if (days <= 30) {
    return (
      <Chip
        id="warranty-amc-expiring-soon-orange"
        variant="custom"
        className="border-orange-300 bg-orange-100 text-orange-900"
        startIcon="l-exclamation-circle"
        text="AMC/Warranty Expiring Soon"
      />
    );
  } else if (days <= 90) {
    return (
      <Chip
        id="warranty-amc-expiring-soon-yellow"
        variant="warning"
        startIcon="l-exclamation-triangle"
        text="AMC/Warranty Expiring Soon"
      />
    );
  }
};

export default AssetsList;
