import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import AssetFilter from "@/components/Assets/AssetFilter";
import AssetImportModal from "@/components/Assets/AssetImportModal";
import { AssetData, assetClassProps } from "@/components/Assets/AssetTypes";
import ExportMenu from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import FacilitiesSelectDialogue from "@/components/ExternalResult/FacilitiesSelectDialogue";
import { FacilityModel } from "@/components/Facility/models";

import useFilters from "@/hooks/useFilters";
import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import AuthorizeFor, { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import { parseQueryParams } from "@/Utils/primitives";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import SearchByMultipleFields from "../Common/SearchByMultipleFields";
import { Button } from "../ui/button";

const AssetsList = () => {
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
    clearSearch,
  } = useFilters({
    limit: 18,
    cacheBlacklist: ["search"],
  });
  const [assets, setAssets] = useState([{} as AssetData]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [facility, setFacility] = useState<FacilityModel>();
  const [status, setStatus] = useState<string>();
  const [asset_class, setAssetClass] = useState<string>();
  const [importAssetModalOpen, setImportAssetModalOpen] = useState(false);
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const [showFacilityDialog, setShowFacilityDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>();
  const params = {
    limit: resultsPerPage,
    page: qParams.page,
    offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    search_text: qParams.search || "",
    facility: qParams.facility || "",
    asset_class: qParams.asset_class || "",
    location: qParams.facility ? qParams.location || "" : "",
    status: qParams.status || "",
    warranty_amc_end_of_validity_before:
      qParams.warranty_amc_end_of_validity_before || "",
    warranty_amc_end_of_validity_after:
      qParams.warranty_amc_end_of_validity_after || "",
  };

  const { refetch: assetsFetch, loading } = useTanStackQueryInstead(
    routes.listAssets,
    {
      query: params,
      onResponse: ({ res, data }) => {
        if (res?.status === 200 && data) {
          setAssets(data.results);
          setTotalCount(data.count);
        }
      },
    },
  );

  const { data: facilityObject } = useTanStackQueryInstead(
    routes.getAnyFacility,
    {
      pathParams: { id: qParams.facility },
      onResponse: ({ res, data }) => {
        if (res?.status === 200 && data) {
          setFacility(data);
          setSelectedFacility(data);
        }
      },
      prefetch: !!qParams.facility,
    },
  );

  useEffect(() => {
    setStatus(qParams.status);
  }, [qParams.status]);

  useEffect(() => {
    setAssetClass(qParams.asset_class);
  }, [qParams.asset_class]);

  const { data: locationObject } = useTanStackQueryInstead(
    routes.getFacilityAssetLocation,
    {
      pathParams: {
        facility_external_id: String(qParams.facility),
        external_id: String(qParams.location),
      },
      prefetch: !!(qParams.facility && qParams.location),
    },
  );

  function isValidURL(url: string) {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  const accessAssetIdFromQR = async (assetURL: string) => {
    try {
      setIsLoading(true);
      setIsScannerActive(false);
      if (!isValidURL(assetURL)) {
        setIsLoading(false);
        Notification.Error({
          msg: t("invalid_asset_id_msg"),
        });
        return;
      }
      const params = parseQueryParams(assetURL);
      // QR Maybe searchParams "asset" or "assetQR"
      // If no params found, then use assetText
      const assetId = params.asset || params.assetQR;

      if (assetId) {
        const { data } = await request(routes.listAssetQR, {
          pathParams: { qr_code_id: assetId },
        });
        if (!data) {
          setIsLoading(false);
          Notification.Error({
            msg: t("invalid_asset_id_msg"),
          });
          return;
        }
        const { data: assetData } = await request(routes.listAssets, {
          query: { qr_code_id: assetId, limit: 1 },
        });
        if (assetData?.results.length === 1) {
          navigate(
            `/facility/${assetData.results[0].location_object.facility?.id}/assets/${assetData.results[0].id}`,
          );
        } else {
          setIsLoading(false);
          Notification.Error({
            msg: t("asset_not_found_msg"),
          });
        }
      } else {
        setIsLoading(false);
        Notification.Error({
          msg: t("invalid_asset_id_msg"),
        });
      }
    } catch (err) {
      Notification.Error({
        msg: t("invalid_asset_id_msg"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authorizedForImportExport = useIsAuthorized(
    AuthorizeFor(["DistrictAdmin", "StateAdmin"]),
  );

  if (isScannerActive)
    return (
      <div className="mx-auto my-2 flex w-full flex-col items-end justify-start md:w-1/2">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <CareIcon icon="l-times" className="mr-1 text-lg" />
          {t("close_scanner")}
        </button>
        <Scanner
          onScan={(detectedCodes: IDetectedBarcode[]) => {
            if (detectedCodes.length > 0) {
              const text = detectedCodes[0].rawValue;
              if (text) {
                accessAssetIdFromQR(text);
              }
            }
          }}
          onError={(e: unknown) => {
            const errorMessage =
              e instanceof Error ? e.message : "Unknown error";
            Notification.Error({
              msg: errorMessage,
            });
          }}
          scanDelay={3000}
        />
        <h2 className="self-center text-center text-lg">
          {t("scan_asset_qr")}
        </h2>
      </div>
    );

  let manageAssets = null;
  if (loading) {
    manageAssets = (
      <div className="col-span-3 w-full py-8 text-center">
        <Loading />
      </div>
    );
  } else if (assetsExist) {
    manageAssets = (
      <div className="grid grid-cols-1 gap-2 md:-mx-8 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset: AssetData) => (
          <Link
            key={asset.id}
            href={`/facility/${asset?.location_object.facility?.id}/assets/${asset.id}`}
            className="h-full text-inherit"
            data-testid="created-asset-list"
          >
            <div
              key={asset.id}
              className="border-1 h-full w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-white p-5 shadow hover:border-primary-500"
            >
              <div className="md:flex">
                <p className="flex break-words text-xl font-medium capitalize">
                  <span className="mr-2 text-primary-500">
                    <CareIcon
                      icon={
                        (
                          (asset.asset_class &&
                            assetClassProps[asset.asset_class]) ||
                          assetClassProps.NONE
                        ).icon
                      }
                      className="text-2xl"
                    />
                  </span>
                  <div className="tooltip w-48">
                    <p
                      className="truncate"
                      data-testid="created-asset-list-name"
                    >
                      {asset.name}
                    </p>
                    {asset.name.length > 20 && (
                      <span className="tooltip-text tooltip-top -translate-x-1/2">
                        {asset.name}
                      </span>
                    )}
                  </div>
                </p>
              </div>
              <p className="text-sm font-normal">
                <span className="text-sm font-medium">
                  <CareIcon
                    icon="l-location-point"
                    className="mr-1 text-primary-500"
                  />
                  {asset?.location_object?.name}
                </span>
                <span className="ml-2 text-sm font-medium">
                  <CareIcon
                    icon="l-hospital"
                    className="mr-1 text-primary-500"
                  />
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
                {asset?.latest_status === "Down" && (
                  <Chip
                    variant="danger"
                    startIcon="l-link-broken"
                    text={asset?.latest_status}
                  />
                )}{" "}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  } else {
    manageAssets = (
      <div className="col-span-3 w-full rounded-lg bg-white p-2 py-8 pt-4 text-center">
        <p className="text-2xl font-bold text-secondary-600">No Assets Found</p>
      </div>
    );
  }

  return (
    <Page
      title="Assets"
      breadcrumbs={false}
      hideBack
      options={
        <div className="flex flex-wrap items-center gap-3">
          <div className="mb-2 flex w-full flex-col items-center gap-3 lg:mb-0 lg:w-fit lg:flex-row lg:gap-5">
            <div className="w-full lg:w-fit">
              <Button
                variant="primary"
                size="lg"
                className="w-full p-[10px] md:w-auto"
                onClick={() => setIsScannerActive(true)}
              >
                <CareIcon icon="l-search" className="text-base mr-2" />
                Scan Asset QR
              </Button>
            </div>

            <div className="w-full lg:w-fit">
              <Button
                variant="primary"
                size="lg"
                id="create-asset-button"
                disabled={!NonReadOnlyUsers}
                className="w-full p-[10px] md:w-auto"
                onClick={() => {
                  if (qParams.facility) {
                    navigate(`/facility/${qParams.facility}/assets/new`);
                  } else {
                    setShowFacilityDialog(true);
                  }
                }}
              >
                <CareIcon icon="l-plus-circle" className="text-lg mr-2" />
                <span>{t("create_asset")}</span>
              </Button>
            </div>
          </div>

          {/* Advanced Filter Button */}
          <div className="w-full md:w-auto">
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>

          {/* Import/Export Menu */}
          {authorizedForImportExport && (
            <div
              className="tooltip w-full md:w-auto"
              data-testid="import-asset-button"
            >
              <ExportMenu
                label={importAssetModalOpen ? "Importing..." : "Import/Export"}
                exportItems={[
                  {
                    label: "Import Assets",
                    options: {
                      icon: (
                        <CareIcon
                          icon="l-import"
                          className="import-assets-button"
                        />
                      ),
                      onClick: () => setImportAssetModalOpen(true),
                    },
                  },
                  {
                    label: "Export Assets (JSON)",
                    action: async () => {
                      const { data } = await request(routes.listAssets, {
                        query: { ...qParams, json: true, limit: totalCount },
                      });
                      return data ?? null;
                    },
                    type: "json",
                    filePrefix: `assets_${facility?.name ?? "all"}`,
                    options: {
                      icon: <CareIcon icon="l-export" />,
                      disabled: totalCount === 0 || !authorizedForImportExport,
                      id: "export-json-option",
                    },
                  },
                  {
                    label: "Export Assets (CSV)",
                    action: async () => {
                      const { data } = await request(routes.listAssets, {
                        query: { ...qParams, csv: true, limit: totalCount },
                      });
                      return data ?? null;
                    },
                    type: "csv",
                    filePrefix: `assets_${facility?.name ?? "all"}`,
                    options: {
                      icon: <CareIcon icon="l-export" />,
                      disabled: totalCount === 0 || !authorizedForImportExport,
                      id: "export-csv-option",
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
      }
    >
      <div className="mt-4 gap-4 lg:gap-16 flex flex-col lg:flex-row lg:items-center">
        <CountBlock
          text="Total Assets"
          count={totalCount}
          loading={loading}
          icon="d-folder"
          className=""
        />
        <SearchByMultipleFields
          id="asset-search"
          options={[
            {
              key: "Name/ Serial no./ QR code ID",
              label: "name/serial no./QR code ID",
              type: "text" as const,
              placeholder: "Search by name/serial no./QR code ID",
              value: qParams.search || "",
              shortcutKey: "f",
            },
          ]}
          className="w-full"
          onSearch={(key, value) => updateQuery({ search: value })}
          clearSearch={clearSearch}
        />
      </div>

      <AssetFilter {...advancedFilter} key={window.location.search} />
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <FilterBadges
            badges={({ badge, value }) => [
              value(
                "Facility",
                "facility",
                qParams.facility && facilityObject?.name,
              ),
              badge("Name/Serial No./QR ID", "search"),
              value("Asset Class", "asset_class", asset_class ?? ""),
              value("Status", "status", status?.replace(/_/g, " ") ?? ""),
              value(
                "Location",
                "location",
                qParams.location && locationObject?.name,
              ),
              value(
                "Warranty AMC End Of Validity Before",
                "warranty_amc_end_of_validity_before",
                qParams.warranty_amc_end_of_validity_before ?? "",
              ),
              value(
                "Warranty AMC End Of Validity After",
                "warranty_amc_end_of_validity_after",
                qParams.warranty_amc_end_of_validity_after ?? "",
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
      {facility == null && (
        <FacilitiesSelectDialogue
          show={importAssetModalOpen}
          setSelected={(e) => setFacility(e)}
          selectedFacility={selectedFacility}
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
          onUpdate={assetsFetch}
          facility={facility}
        />
      )}
      <FacilitiesSelectDialogue
        show={showFacilityDialog}
        setSelected={(e) => setSelectedFacility(e)}
        selectedFacility={selectedFacility}
        handleOk={() => {
          if (selectedFacility) {
            navigate(`facility/${selectedFacility.id}/assets/new`);
          } else {
            Notification.Warn({ msg: "No facility selected" });
          }
        }}
        handleCancel={() => {
          setShowFacilityDialog(false);
          setSelectedFacility(undefined);
        }}
      />
    </Page>
  );
};

export const warrantyAmcValidityChip = (
  warranty_amc_end_of_validity: string,
) => {
  if (warranty_amc_end_of_validity === "" || !warranty_amc_end_of_validity)
    return;
  const today = new Date();
  const warrantyAmcEndDate = new Date(warranty_amc_end_of_validity);

  const days = Math.ceil(
    Math.abs(Number(warrantyAmcEndDate) - Number(today)) /
      (1000 * 60 * 60 * 24),
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
