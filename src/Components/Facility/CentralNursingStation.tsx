import { useDispatch } from "react-redux";
import useFullscreen from "../../Common/hooks/useFullscreen";
import { useContext, useEffect, useState } from "react";
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
import Pagination from "../Common/Pagination";
import { SidebarShrinkContext } from "../Common/Sidebar/Sidebar";

const PER_PAGE_LIMIT = 6;

interface Props {
  facility: string;
  location?: string;
}

export default function CentralNursingStation({ facility }: Props) {
  const dispatch = useDispatch<any>();
  const [isFullscreen, setFullscreen] = useFullscreen();
  const { shrinked, setShrinked } = useContext(SidebarShrinkContext);

  const [facilityObject, setFacilityObject] = useState<FacilityModel>();
  const [data, setData] =
    useState<Parameters<typeof PatientVitalsMonitor>[0][]>();
  const [totalCount, setTotalCount] = useState(0);
  const { qParams, updateQuery, updatePage } = useFilters({
    limit: PER_PAGE_LIMIT,
  });

  useEffect(() => {
    setShrinked(true);

    async function fetchFacilityOrObject() {
      if (facilityObject) return facilityObject;
      const res = await dispatch(getPermittedFacility(facility));
      if (res.status !== 200) return;
      setFacilityObject(res.data);
      return res.data as FacilityModel;
    }

    async function fetchData() {
      setData(undefined);

      const params = {
        ...qParams,
        page: qParams.page || 1,
        limit: PER_PAGE_LIMIT,
        offset: (qParams.page ? qParams.page - 1 : 0) * PER_PAGE_LIMIT,
      };

      const [facilityObj, patientsRes, assetBedsRes] = await Promise.all([
        fetchFacilityOrObject(),
        dispatch(
          getAllPatient(
            { facility, is_active: "True", has_bed: "True" },
            "cns-list-patients"
          )
        ),
        dispatch(listAssetBeds({ facility, ...params })),
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

    return () => {
      setShrinked(shrinked);
    };
  }, [dispatch, facility, qParams.page, qParams.location]);

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
            errorClassName="hidden"
            className="w-64"
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
      {data === undefined ? (
        <Loading />
      ) : data.length === 0 ? (
        <div className="flex w-full h-[80vh] items-center justify-center text-black text-center">
          No Vitals Monitor present in this location or facility.
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-1">
          {data.map((props) => (
            <PatientVitalsMonitor key={props.assetBed?.id} {...props} />
          ))}
        </div>
      )}
    </Page>
  );
}
