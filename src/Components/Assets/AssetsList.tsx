import { useDispatch } from "react-redux";
import QrReader from "react-qr-reader";
import { statusType, useAbortableEffect } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";
import {
  getAnyFacility,
  listAssets,
  getFacilityAssetLocation,
} from "../../Redux/actions";
import { assetClassProps, AssetData } from "./AssetTypes";
import { getAsset } from "../../Redux/actions";
import { useState, useCallback, useEffect } from "react";
import { navigate } from "raviger";
import loadable from "@loadable/component";
import { make as SlideOver } from "../Common/SlideOver.gen";
import CircularProgress from "@material-ui/core/CircularProgress";
import AssetFilter from "./AssetFilter";
import AdvancedFilterButton from "../Common/AdvancedFilterButton";
import { parseQueryParams } from "../../Utils/primitives";
import Chip from "../../CAREUI/display/Chip";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import AssetImportModal from "./AssetImportModal";
import { FacilityModel } from "../Facility/models";
import { DropdownItem } from "../Common/components/Menu";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useIsAuthorized } from "../../Common/hooks/useIsAuthorized";
import AuthorizeFor from "../../Utils/AuthorizeFor";
import ButtonV2 from "../Common/components/ButtonV2";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import useExport from "../../Common/hooks/useExport";

const Loading = loadable(() => import("../Common/Loading"));

const AssetsList = () => {
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({
    limit: 21,
  });
  const [assets, setAssets] = useState([{} as AssetData]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [facility, setFacility] = useState<FacilityModel>();
  const [asset_type, setAssetType] = useState<string>();
  const [locationName, setLocationName] = useState<string>();
  const [importAssetModalOpen, setImportAssetModalOpen] = useState(false);
  const dispatch: any = useDispatch();
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const [showFacilityDialog, setShowFacilityDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const { exportJSON, ExportMenu } = useExport();

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = {
        limit: resultsPerPage,
        page: qParams.page,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        search_text: qParams.search || "",
        facility: qParams.facility,
        asset_type: qParams.asset_type,
        location: qParams.location,
        status: qParams.status,
      };
      const { data }: any = await dispatch(listAssets(params));
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAssets(data.results);
          setTotalCount(data.count);
        }
      }
    },
    [
      dispatch,
      qParams.page,
      qParams.search,
      qParams.facility,
      qParams.asset_type,
      qParams.location,
      qParams.status,
    ]
  );

  useEffect(() => {
    setAssetType(qParams.asset_type);
  }, [qParams.asset_type]);

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

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
      if (!qParams.location) return setLocationName("");
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
        const { data }: any = await dispatch(
          listAssets({ qr_code_id: assetId })
        );
        return data.results[0].id;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const checkValidAssetId = async (assetId: any) => {
    const assetData: any = await dispatch(getAsset(assetId));
    try {
      if (assetData.data) {
        navigate(`/assets/${assetId}`);
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

  const exportAssets = () =>
    authorizedForImportExport &&
    exportJSON(
      `assets_${facility?.name}`,
      listAssets({ ...qParams, json: true, limit: totalCount })
    );

  if (isScannerActive)
    return (
      <div className="md:w-1/2 w-full my-2 mx-auto flex flex-col justify-start items-end">
        <button
          onClick={() => setIsScannerActive(false)}
          className="btn btn-default mb-2"
        >
          <i className="fas fa-times mr-2"></i> Close Scanner
        </button>
        <QrReader
          delay={300}
          onScan={async (value: any) => {
            if (value) {
              const assetId = await getAssetIdFromQR(value);
              checkValidAssetId(assetId ?? value);
            }
          }}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
        <h2 className="text-center text-lg self-center">Scan Asset QR!</h2>
      </div>
    );

  let manageAssets = null;
  if (assetsExist) {
    manageAssets = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:-mx-8 gap-2">
        {assets.map((asset: AssetData) => (
          <div
            key={asset.id}
            className="w-full bg-white rounded-lg cursor-pointer border-1 shadow p-5 justify-center items-center border border-transparent hover:border-primary-500"
            onClick={() =>
              navigate(
                `facility/${asset?.location_object.facility.id}/assets/${asset.id}`
              )
            }
          >
            <div className="md:flex">
              <p className="text-xl flex font-medium capitalize break-words">
                <span className="mr-2 text-primary-500">
                  <i
                    className={`fas fa-${
                      (
                        (asset.asset_class &&
                          assetClassProps[asset.asset_class]) ||
                        assetClassProps.NONE
                      ).icon
                    }`}
                  />
                </span>
                <p className="truncate w-48">{asset.name}</p>
              </p>
            </div>
            <p className="font-normal text-sm">
              {asset?.location_object?.name}
            </p>

            <div className="flex flex-wrap gap-2 mt-2">
              {asset.is_working ? (
                <Chip color="green" startIcon="cog" text="Working" />
              ) : (
                <Chip color="red" startIcon="cog" text="Not Working" />
              )}
              <Chip
                color="blue"
                startIcon="location-arrow"
                text={asset.status}
              />
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    manageAssets = (
      <div className="w-full bg-white rounded-lg p-2 text-center col-span-3 py-8 pt-4">
        <p className="text-2xl font-bold text-gray-600">No Assets Found</p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="flex justify-between items-center">
        <PageTitle title="Assets" breadcrumbs={false} hideBack />
        {authorizedForImportExport && (
          <div className="tooltip">
            {!facility && (
              <span className="tooltip-text tooltip-left flex flex-col items-end">
                <p>Select a facility from the Facilities page and</p>
                <p>click 'View Assets' from the Manage Facility dropdown</p>
              </span>
            )}
            {/* TODO: ask for facility select dialog instead of disabling */}
            <ExportMenu disabled={!facility} label="Import/Export">
              <DropdownItem
                icon={<CareIcon className="care-l-import" />}
                onClick={() => setImportAssetModalOpen(true)}
              >
                Import Assets
              </DropdownItem>
              <DropdownItem
                disabled={totalCount === 0}
                icon={<CareIcon className="care-l-export" />}
                onClick={exportAssets}
              >
                Export Assets
              </DropdownItem>
            </ExportMenu>
          </div>
        )}
      </div>
      <div className="lg:flex mt-5 space-y-2">
        <div className="bg-white overflow-hidden shadow rounded-lg flex-1 md:mr-2">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Assets
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <CircularProgress className="text-primary-500" />
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div className="flex-1">
          <SearchInput
            name="search"
            value={qParams.search}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder="Search assets"
          />
        </div>
        <div className="flex flex-col lg:ml-2 justify-start items-start gap-2">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="w-full">
              <AdvancedFilterButton
                setShowFilters={() => advancedFilter.setShow(true)}
              />
            </div>
            <ButtonV2
              className="w-full"
              onClick={() => setIsScannerActive(true)}
            >
              <i className="fas fa-search mr-1"></i> Scan Asset QR
            </ButtonV2>
          </div>
          <div className="flex flex-col md:flex-row w-full">
            <ButtonV2
              className="w-full inline-flex items-center justify-center"
              onClick={() => setShowFacilityDialog(true)}
            >
              <CareIcon className="care-l-plus-circle h-5 mr-1" /> Create Asset
            </ButtonV2>
          </div>
        </div>
      </div>
      <div>
        <SlideOver {...advancedFilter}>
          <div className="bg-white min-h-screen p-4">
            <AssetFilter {...advancedFilter} />
          </div>
        </SlideOver>
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <FilterBadges
            badges={({ badge, value }) => [
              value("Facility", ["facility", "location"], facility?.name || ""),
              badge("Name", "search"),
              value("Asset Type", "asset_type", asset_type || ""),
              badge("Status", "status"),
              value("Location", "location", locationName || ""),
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
      {facility && (
        <AssetImportModal
          open={importAssetModalOpen}
          onClose={() => setImportAssetModalOpen(false)}
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
    </div>
  );
};

export default AssetsList;
