import { useDispatch } from "react-redux";
import useFullscreen from "../../Common/hooks/useFullscreen";
import { useEffect, useState } from "react";
import {
  getAllPatient,
  getPermittedFacility,
  listAssetBeds,
} from "../../Redux/actions";
import PatientVitalsMonitor from "../VitalsMonitor/PatientVitalsMonitor";
import useFilters from "../../Common/hooks/useFilters";
import { PatientModel } from "../Patient/models";
import { AssetBedModel } from "../Assets/AssetTypes";
import { FacilityModel } from "./models";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { LocationSelect } from "../Common/LocationSelect";

interface Props {
  facility: string;
  location?: string;
}

export default function CentralNursingStation({ facility }: Props) {
  const dispatch = useDispatch<any>();
  const [isFullscreen, setFullscreen] = useFullscreen();

  const [facilityObject, setFacilityObject] = useState<FacilityModel>();
  const [data, setData] =
    useState<Parameters<typeof PatientVitalsMonitor>[0][]>();
  const [totalCount, setTotalCount] = useState(0);
  const { qParams, updateQuery, Pagination } = useFilters({ limit: 9 });

  // TODO: paginated query

  useEffect(() => {
    async function fetchFacilityOrObject() {
      if (facilityObject) return facilityObject;
      const res = await dispatch(getPermittedFacility(facility));
      if (res.status !== 200) return;
      setFacilityObject(res.data);
      return res.data as FacilityModel;
    }

    async function fetchData() {
      setData(undefined);

      const [facilityObj, patientsRes, assetBedsRes] = await Promise.all([
        fetchFacilityOrObject(),
        dispatch(
          getAllPatient(
            { facility, is_active: "True", has_bed: "True" },
            "cns-list-patients"
          )
        ),
        dispatch(listAssetBeds({ facility, ...qParams })),
      ]);

      if (
        !facilityObj ||
        patientsRes.status !== 200 ||
        assetBedsRes.status !== 200
      )
        return;

      const patients = patientsRes.data.results as PatientModel[];
      const assetBeds = assetBedsRes.data.results as AssetBedModel[];

      setTotalCount(assetBedsRes.data.count);
      setData(
        assetBeds.map((assetBed) => ({
          assetBed,
          patient: patients.find(
            (patient) =>
              patient.last_consultation?.current_bed?.bed_object.id ===
              assetBed.bed_object.id
          ),
          socketUrl: `wss://${facilityObj.middleware_address}/observations/${assetBed.asset_object.meta?.local_ip_address}`,
        }))
      );
    }
    fetchData();
  }, [dispatch, facility, qParams.page, qParams.location]);

  if (!data) return <Loading />;

  return (
    <Page
      title="Central Nursing Station"
      backUrl={`/facility/${facility}/`}
      noImplicitPadding
      breadcrumbs={false}
      options={
        <div className="flex gap-4 items-center">
          <LocationSelect
            name="Facilities"
            setSelected={(location) => updateQuery({ location })}
            selected={qParams.location}
            showAll={false}
            multiple={false}
            facilityId={facility}
            errors=""
          />
          <ButtonV2
            variant="secondary"
            border
            onClick={() => setFullscreen(!isFullscreen)}
            className="tooltip !h-11"
            tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            tooltipClassName="tooltip-bottom -translate-x-1/2"
          >
            <CareIcon
              className={classNames(
                isFullscreen
                  ? "care-l-compress-arrows"
                  : "care-l-expand-arrows-alt",
                "text-lg"
              )}
            />
          </ButtonV2>

          <Pagination totalCount={totalCount} />
        </div>
      }
    >
      {data.length === 0 && (
        <div className="flex w-full h-[80vh] items-center justify-center text-black text-center">
          No Vitals Monitor present in this location or facility.
        </div>
      )}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-1">
        {data.map((monitor) => (
          <PatientVitalsMonitor key={monitor.assetBed.id} {...monitor} />
        ))}
      </div>
    </Page>
  );
}
