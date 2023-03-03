import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getAllPatient,
  getPermittedFacility,
  listAssetBeds,
} from "../../Redux/actions";
import { AssetData } from "../Assets/AssetTypes";
import Page from "../Common/components/Page";
import { PatientModel } from "../Patient/models";
import PatientVitalsCard from "../Patient/PatientVitalsCard";
import { FacilityModel } from "./models";

interface Monitor {
  patient: PatientModel;
  asset: AssetData;
  socketUrl: string;
}

export default function FacilityCNS({ facilityId }: { facilityId: string }) {
  const dispatch = useDispatch<any>();
  const [monitors, setMonitors] = useState<Monitor[]>();
  const [facility, setFacility] = useState<FacilityModel>();

  useEffect(() => {
    async function fetchFacility() {
      const res = await dispatch(getPermittedFacility(facilityId || ""));
      if (res.status === 200) setFacility(res.data);
    }
    fetchFacility();
  }, [facilityId, dispatch]);

  useEffect(() => {
    if (!facility) return;
    const middlewareHostname = facility.middleware_address;

    async function fetchPatients() {
      const res = await dispatch(
        getAllPatient({ facility: facilityId }, "cns-patient-list")
      );
      if (res.status === 200) {
        const patients = res.data.results as PatientModel[];
        return patients.filter(
          (patient) => !!patient.last_consultation?.current_bed?.bed_object.id
        );
      }
    }

    async function fetchPatientMonitorAsset(patient: PatientModel) {
      const res = await dispatch(
        listAssetBeds(
          {
            bed: patient.last_consultation?.current_bed?.bed_object?.id,
          },
          `asset-bed-${patient.id}`
        )
      );

      if (res.status !== 200) return;

      const asset = res.data.results.find(
        (assetBed: any) =>
          assetBed.asset_object.meta?.asset_type === "HL7MONITOR"
      )?.asset_object as AssetData | undefined;
      if (!asset) return;

      const socketUrl = `wss://${middlewareHostname}/observations/${asset.meta?.local_ip_address}`;

      return { patient, asset, socketUrl } as Monitor;
    }

    async function fetchPatientMonitorAssets(patients: PatientModel[]) {
      const monitors = await Promise.all(
        patients.map((patient) => fetchPatientMonitorAsset(patient))
      );
      return monitors.filter((monitor) => !!monitor) as Monitor[];
    }

    async function fetchMonitors() {
      const patients = await fetchPatients();
      if (!patients) return;

      const monitors = await fetchPatientMonitorAssets(patients);
      setMonitors(monitors);
    }

    fetchMonitors();
  }, [dispatch, facility, facilityId]);

  return (
    <Page
      title="Central Nursing Station"
      crumbsReplacements={{ [facilityId]: { name: facility?.name } }}
      backUrl={`/facility/${facilityId}`}
      noImplicitPadding
    >
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {monitors?.map(({ patient, socketUrl }) => (
          <div className="p-2 rounded-lg bg-black">
            <div className="flex flex-wrap gap-4 text-white w-full tracking-wider p-2">
              <span className="font-bold uppercase">{patient.name}</span>
              <span>Age {patient.age}</span>
            </div>
            <PatientVitalsCard socketUrl={socketUrl} />
          </div>
        ))}
      </div>
    </Page>
  );
}
