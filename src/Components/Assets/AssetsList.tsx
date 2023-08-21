import { useDispatch } from "react-redux";
import QrReader from "react-qr-reader";
import { statusType, useAbortableEffect } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications.js";
import {
  getAnyFacility,
  listAssets,
  getFacilityAssetLocation,
  getAsset,
} from "../../Redux/actions";
import { assetClassProps, AssetData } from "./AssetTypes";
import { useState, useCallback, useEffect, lazy } from "react";
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
  const [locationName, setLocationName] = useState<string>();
  const [importAssetModalOpen, setImportAssetModalOpen] = useState(false);
  const dispatch: any = useDispatch();
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const [showFacilityDialog, setShowFacilityDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
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
      const { data } = await dispatch(listAssets(params));
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAssets(data.results);
          setTotalCount(data.count);
          if (qParams.facility) {
            const fetchFacility = await dispatch(
              getAnyFacility(qParams.facility)
            );
            setSelectedFacility(fetchFacility.data as FacilityModel);
          }
        }
      }
    },
    [
      resultsPerPage,
      qParams.page,
      qParams.search,
      qParams.facility,
      qParams.asset_type,
      qParams.asset_class,
      qParams.location,
      qParams.status,
      dispatch,
    ]
  );

  useEffect(() => {
    setAssetType(qParams.asset_type);
  }, [qParams.asset_type]);

  useEffect(() => {
    setStatus(qParams.status);
  }, [qParams.status]);

  useEffect(() => {
    setAssetClass(qParams.asset_class);
  }, [qParams.asset_class]);

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );
  useEffect(() => {
    async function fetchFacilityName() {
      if (!qParams.facility) return setFacilityName("");
      const res = await dispatch(getAnyFacility(qParams.facility, "facility"));
      setFacilityName(res?.data?.name);
    }
    fetchFacilityName();
  }, [dispatch, qParams.facility]);

  const fetchFacility = useCallback(
    async (status: statusType) => {
      if (!qParams.facility) return setFacility(undefined);
      setIsLoading(true);
      const res = await dispatch(getAnyFacility(qParams.facility));
      if (!status.aborted) {
        setFacility(res?.data);
        setIsLoading(false);
      }
    },
    [dispatch, qParams.facility]
  );
  const fetchLocationName = useCallback(
    async (status: statusType) => {
      if (!qParams.location || !qParams.facility)
        return setLocationName(undefined);
      setIsLoading(true);
      const res = await dispatch(
        getFacilityAssetLocation(qParams.facility, qParams.location)
      );
      if (!status.aborted) {
        setLocationName(res?.data?.name);
        setIsLoading(false);
      }
    },
    [dispatch, qParams.facility, qParams.location]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchFacility(status);
      fetchLocationName(status);
    },
    [fetchFacility, fetchLocationName]
  );

  const getAssetIdFromQR = async (assetUrl: string) => {
    try {
      setIsLoading(true);
      setIsScannerActive(false);
      const params = parseQueryParams(assetUrl);
      // QR Maybe searchParams "asset" or "assetQR"
      const assetId = params.asset || params.assetQR;
      if (assetId) {
        const { data } = await dispatch(listAssets({ qr_code_id: assetId }));
        return data.results[0].id;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const checkValidAssetId = async (assetId: string) => {
    const assetData = await dispatch(getAsset(assetId));
    try {
      if (assetData.data) {
        navigate(
          `/facility/${assetData.data.location_object.facility.id}/assets/${assetId}`
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
            <div className="tooltip">
              <ExportMenu
                label={importAssetModalOpen ? "Importing..." : "Import/Export"}
                exportItems={[
                  {
                    label: "Import Assets",
                    options: {
                      icon: <CareIcon className="care-l-import" />,
                      onClick: () => setImportAssetModalOpen(true),
                    },
                  },
                  {
                    label: "Export Assets",
                    action: () =>
                      authorizedForImportExport &&
                      listAssets({
                        ...qParams,
                        json: true,
                        limit: totalCount,
                      }),
                    type: "json",
                    filePrefix: `assets_${facility?.name}`,
                    options: {
                      icon: <CareIcon className="care-l-export" />,
                      disabled: totalCount === 0 || !authorizedForImportExport,
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
              value("Location", "location", locationName ?? ""),
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

export default AssetsList;
