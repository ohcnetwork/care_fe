import { Fragment, useContext, useEffect, useState } from "react";
import useFilters from "../../Common/hooks/useFilters";
import useFullscreen from "../../Common/hooks/useFullscreen";
import { FacilityModel } from "./models";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { LocationSelect } from "../Common/LocationSelect";
import Pagination from "../Common/Pagination";
import { SidebarShrinkContext } from "../Common/Sidebar/Sidebar";
import { AssetData } from "../Assets/AssetTypes";
import { Popover, Transition } from "@headlessui/react";
import { FieldLabel } from "../Form/FormFields/FormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import LiveFeedTile from "./LiveFeedTile";
import { getCameraConfig } from "../../Utils/transformUtils";
import { getPermittedFacility, listAssets } from "../../Redux/actions";
import { useDispatch } from "react-redux";

const PER_PAGE_LIMIT = 6;

interface Props {
  facilityId: string;
}

export default function LiveFeedScreen({ facilityId }: Props) {
  const dispatch = useDispatch<any>();
  const [isFullscreen, setFullscreen] = useFullscreen();
  const sidebar = useContext(SidebarShrinkContext);

  const [facility, setFacility] = useState<FacilityModel>();
  const [assets, setAssets] = useState<AssetData[]>();
  const [totalCount, setTotalCount] = useState(0);
  const { qParams, updateQuery, removeFilter, updatePage } = useFilters({
    limit: PER_PAGE_LIMIT,
  });

  const [refresh_presets_hash, setRefreshPresetsHash] = useState<number>(
    Number(new Date())
  );

  // To automatically collapse sidebar.
  useEffect(() => {
    sidebar.setShrinked(true);

    return () => {
      sidebar.setShrinked(sidebar.shrinked);
    };
  }, []);

  useEffect(() => {
    async function fetchFacilityOrObject() {
      if (facility) return facility;
      const res = await dispatch(getPermittedFacility(facilityId));
      if (res.status !== 200) return;
      setFacility(res.data);
      return res.data as FacilityModel;
    }

    async function fetchData() {
      setAssets(undefined);

      const filters = {
        ...qParams,
        page: qParams.page || 1,
        limit: PER_PAGE_LIMIT,
        offset: (qParams.page ? qParams.page - 1 : 0) * PER_PAGE_LIMIT,
        asset_class: "ONVIF",
        facility: facilityId || "",
        location: qParams.location,
        bed_is_occupied: qParams.bed_is_occupied,
      };

      const [facilityObj, res] = await Promise.all([
        fetchFacilityOrObject(),
        dispatch(listAssets(filters)),
      ]);

      if (!facilityObj || res.status !== 200) {
        return;
      }
      console.log(facilityObj, res.data);
      const entries = res.data.results;

      setTotalCount(entries.length);
      setAssets(entries);
    }
    fetchData();
    setRefreshPresetsHash(Number(new Date()));
  }, [
    dispatch,
    facilityId,
    qParams.page,
    qParams.location,
    qParams.ordering,
    qParams.bed_is_occupied,
  ]);

  return (
    <Page
      title="Live Monitoring"
      backUrl={`/facility/${facilityId}/`}
      noImplicitPadding
      breadcrumbs={false}
      options={
        <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
          <Popover className="relative">
            <Popover.Button>
              <ButtonV2 variant="secondary" border>
                <CareIcon className="care-l-setting text-lg" />
                Settings and Filters
              </ButtonV2>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-30 mt-1 w-80 -translate-x-1/3 px-4 sm:px-0 md:w-96 md:-translate-x-1/2 lg:max-w-3xl">
                <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
                  <div className="rounded-t-lg bg-gray-100 px-6 py-4">
                    <div className="flow-root rounded-md">
                      <span className="block text-sm text-gray-800">
                        <span className="font-bold ">{totalCount}</span> Camera
                        present
                      </span>
                    </div>
                  </div>
                  <div className="relative flex flex-col gap-8 rounded-b-lg bg-white p-6">
                    <div>
                      <FieldLabel className="text-sm">
                        Filter by Location
                      </FieldLabel>
                      <div className="flex w-full items-center gap-2">
                        <LocationSelect
                          key={qParams.location}
                          name="Facilities"
                          setSelected={(location) => updateQuery({ location })}
                          selected={qParams.location}
                          showAll={false}
                          multiple={false}
                          facilityId={facilityId}
                          errors=""
                          errorClassName="hidden"
                        />
                        {qParams.location && (
                          <ButtonV2
                            variant="secondary"
                            circle
                            border
                            onClick={() => removeFilter("location")}
                          >
                            Clear
                          </ButtonV2>
                        )}
                      </div>
                    </div>
                    <CheckBoxFormField
                      name="bed_is_occupied"
                      label="Hide Cameras without Patient"
                      value={
                        qParams.bed_is_occupied === "true" ||
                        qParams.bed_is_occupied === undefined
                      }
                      onChange={({ name, value }) => {
                        if (value) {
                          updateQuery({ [name]: value });
                        } else {
                          removeFilter(name);
                        }
                      }}
                      labelClassName="text-sm"
                      errorClassName="hidden"
                    />
                    <ButtonV2
                      variant="secondary"
                      border
                      onClick={() => setFullscreen(!isFullscreen)}
                      className="tooltip !h-11"
                    >
                      <CareIcon
                        className={classNames(
                          isFullscreen
                            ? "care-l-compress-arrows"
                            : "care-l-expand-arrows-alt",
                          "text-lg"
                        )}
                      />
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </ButtonV2>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          <Pagination
            className=""
            cPage={qParams.page}
            defaultPerPage={PER_PAGE_LIMIT}
            data={{ totalCount }}
            onChange={(page) => updatePage(page)}
          />
        </div>
      }
    >
      {assets === undefined ? (
        <Loading />
      ) : assets.length === 0 ? (
        <div className="flex h-[80vh] w-full items-center justify-center text-center text-black">
          No Camera present in this location or facility.
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-1 gap-2 pl-4 xl:grid-cols-1 3xl:grid-cols-2">
          {assets.map((asset, idx) => (
            <div className="text-clip" key={idx}>
              {/* <LiveFeedTile assetId={asset.asset.id} key={asset?.bed.id} /> */}
              <LiveFeedTile
                middlewareHostname={facility?.middleware_address}
                asset={getCameraConfig(asset)}
                showRefreshButton={true}
                refreshPresetsHash={refresh_presets_hash}
              />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
