import { useQueryParams } from "raviger";
import { useState } from "react";

import Fullscreen from "@/CAREUI/misc/Fullscreen";

import LocationFeedTile from "@/components/CameraFeed/CameraFeedWithBedPresets";
import LiveMonitoringFilters from "@/components/CameraFeed/CentralLiveMonitoring/LiveMonitoringFilters";
import StillWatching from "@/components/CameraFeed/StillWatching";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import useBreakpoints from "@/hooks/useBreakpoints";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export default function CentralLiveMonitoring(props: { facilityId: string }) {
  const [isFullscreen, setFullscreen] = useState(false);
  const limit = useBreakpoints({ default: 4, "3xl": 9 });

  const [qParams] = useQueryParams();

  const facilityQuery = useQuery(routes.getPermittedFacility, {
    pathParams: { id: props.facilityId },
  });

  const { data, loading } = useQuery(routes.listAssets, {
    query: {
      ...qParams,
      limit,
      offset: (qParams.page ? qParams.page - 1 : 0) * limit,
      asset_class: "ONVIF",
      facility: props.facilityId,
      location: qParams.location,
      in_use_by_consultation: qParams.in_use_by_consultation,
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
        <LiveMonitoringFilters
          perPageLimit={limit}
          isFullscreen={isFullscreen}
          setFullscreen={setFullscreen}
          totalCount={totalCount}
        />
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
        <StillWatching>
          <Fullscreen
            fullscreenClassName="h-screen overflow-auto"
            fullscreen={isFullscreen}
            onExit={() => setFullscreen(false)}
          >
            <div className="3xl:grid-cols-3 mt-1 grid grid-cols-1 place-content-center gap-1 lg:grid-cols-2">
              {data.results.map((asset) => (
                <div className="text-clip" key={asset.id}>
                  <LocationFeedTile asset={asset} />
                </div>
              ))}
            </div>
          </Fullscreen>
        </StillWatching>
      )}
    </Page>
  );
}
