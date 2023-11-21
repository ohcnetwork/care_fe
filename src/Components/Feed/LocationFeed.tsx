import { Fragment, useState } from "react";
import useFilters from "../../Common/hooks/useFilters";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { LocationSelect } from "../Common/LocationSelect";
import Pagination from "../Common/Pagination";
import { Popover, Transition } from "@headlessui/react";
import { FieldLabel } from "../Form/FormFields/FormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { RouteParams } from "../../Routers/types";
import LocationFeedTile from "./LocationFeedTile";
import Fullscreen from "../../CAREUI/misc/Fullscreen";

const PER_PAGE_LIMIT = 4;

type Props = RouteParams<"facilityId" | "locationId">;

export default function LocationFeed(props: Props) {
  const [isFullscreen, setFullscreen] = useState(false);
  const { qParams, updateQuery, removeFilter, updatePage } = useFilters({
    limit: PER_PAGE_LIMIT,
  });

  const facilityQuery = useQuery(routes.getPermittedFacility, {
    pathParams: { id: props.facilityId },
  });

  const { data, loading } = useQuery(routes.listAssets, {
    query: {
      ...qParams,
      limit: PER_PAGE_LIMIT,
      offset: (qParams.page ? qParams.page - 1 : 0) * PER_PAGE_LIMIT,
      facility: props.facilityId,
      location: props.locationId,
      asset_class: "ONVIF",
      in_use_by_consultation: qParams.in_use_by_consultation ?? true,
    },
  });

  const totalCount = data?.count ?? 0;

  return (
    <Page
      title="Live Monitoring"
      collapseSidebar
      backUrl={`/facility/${props.facilityId}/`}
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
                          facilityId={props.facilityId}
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
                      name="in_use_by_consultation"
                      label="Hide cameras without patient"
                      value={
                        qParams.in_use_by_consultation === "true" ||
                        qParams.in_use_by_consultation === undefined
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
                    <CheckBoxFormField
                      name="is_working"
                      label="Camera is Working"
                      value={
                        qParams.is_working === "true" ||
                        qParams.is_working === undefined
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
      {loading ||
      data === undefined ||
      facilityQuery.data === undefined ||
      facilityQuery.loading ? (
        <Loading />
      ) : data.results.length === 0 ? (
        <div className="flex h-[80vh] w-full items-center justify-center text-center text-black">
          No Camera present in this location or facility.
        </div>
      ) : (
        <Fullscreen
          fullscreen={isFullscreen}
          onExit={() => setFullscreen(false)}
        >
          <div className="mt-1 grid grid-cols-1 place-content-center gap-1 lg:grid-cols-2 3xl:grid-cols-3">
            {data.results.map((asset) => (
              <div className="text-clip" key={asset.id}>
                <LocationFeedTile
                  asset={asset}
                  fallbackMiddleware={
                    asset.location_object.middleware_address ??
                    facilityQuery.data!.middleware_address
                  }
                />
              </div>
            ))}
          </div>
        </Fullscreen>
      )}
    </Page>
  );
}
