import React, { useEffect, useState } from "react";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import {
  partialUpdateAsset,
  getPermittedFacility,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import MonitorConfigure from "../configure/MonitorConfigure";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import Card from "../../../CAREUI/display/Card";
import { Submit } from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import TextFormField from "../../Form/FormFields/TextFormField";
import HL7PatientVitalsMonitor from "../../VitalsMonitor/HL7PatientVitalsMonitor";
import VentilatorPatientVitalsMonitor from "../../VitalsMonitor/VentilatorPatientVitalsMonitor";
import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";

interface HL7MonitorProps {
  assetId: string;
  facilityId: string;
  asset: any;
}

const HL7Monitor = (props: HL7MonitorProps) => {
  const { assetId, asset, facilityId } = props;
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [facilityMiddlewareHostname, setFacilityMiddlewareHostname] =
    useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [localipAddress, setLocalIPAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");
  const [gains, setGains] = useState<any>();
  const [editGains, setEditGains] = useState(false);

  const dispatch = useDispatch<any>();

  useEffect(() => {
    const fetchFacility = async () => {
      const res = await dispatch(getPermittedFacility(facilityId));

      if (res.status === 200 && res.data) {
        setFacilityMiddlewareHostname(res.data.middleware_address);
      }
    };

    if (facilityId) fetchFacility();
  }, [dispatch, facilityId]);

  useEffect(() => {
    setAssetType(asset?.asset_class);
    setMiddlewareHostname(asset?.meta?.middleware_hostname);
    setLocalIPAddress(asset?.meta?.local_ip_address);
    if (asset?.meta?.gains) {
      setGains(asset?.meta?.gains);
      setEditGains(true);
    } else {
      setGains(
        asset?.asset_class === "HL7MONITOR"
          ? { ecg: 1, pleth: 1, resp: 1 }
          : { pressure: 1, flow: 1, volume: 1 }
      );
      setEditGains(false);
    }
    setIsLoading(false);
  }, [asset]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkIfValidIP(localipAddress)) {
      setIpAddress_error("");

      const data = {
        meta: {
          asset_type: assetType,
          middleware_hostname: middlewareHostname, // TODO: remove this infavour of facility.middleware_address
          local_ip_address: localipAddress,
          gains: editGains ? gains : undefined,
        },
      };

      const res: any = await Promise.resolve(
        dispatch(partialUpdateAsset(assetId, data))
      );
      if (res?.status === 200) {
        Notification.Success({
          msg: "Asset Configured Successfully",
        });
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    } else {
      setIpAddress_error("Please Enter a Valid IP address !!");
    }
  };

  const middleware = middlewareHostname || facilityMiddlewareHostname;

  if (isLoading) return <Loading />;
  return (
    <div className="flex w-full mx-auto xl:mt-8">
      <div className="flex flex-col xl:flex-row-reverse gap-4 mx-auto">
        <div className="w-full xl:max-w-lg shrink-0 flex flex-col gap-4">
          <Card className="w-full flex flex-col">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Connection</h2>
                <Submit ghost border size="small">
                  <CareIcon className="care-l-save text-lg" />
                  <span>Save</span>
                </Submit>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <TextFormField
                  labelClassName="!text-sm"
                  name="middlewareHostname"
                  label="Middleware Hostname"
                  placeholder={facilityMiddlewareHostname}
                  value={middlewareHostname}
                  onChange={(e) => setMiddlewareHostname(e.value)}
                />
                <TextFormField
                  labelClassName="!text-sm"
                  name="localipAddress"
                  label="Local IP Address"
                  value={localipAddress}
                  onChange={(e) => setLocalIPAddress(e.value)}
                  required
                  error={ipadrdress_error}
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Waveform Configurations</h2>
                <CheckBoxFormField
                  labelClassName="!text-sm"
                  name="editGains"
                  label="Override Gains"
                  value={editGains}
                  onChange={(e) => setEditGains(e.value)}
                  errorClassName="hidden"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                {gains &&
                  Object.keys(gains).map((key) => (
                    <TextFormField
                      disabled={!editGains}
                      labelClassName="!text-sm"
                      name={key}
                      label={`${key.toUpperCase()} Gain`}
                      placeholder="1.00"
                      value={(gains[key] ?? 1).toString()}
                      type="number"
                      onChange={(e) =>
                        setGains((prev: any) => ({ ...prev, [key]: e.value }))
                      }
                      step={0.01}
                    />
                  ))}
              </div>
            </form>
          </Card>
          <Card>
            {["HL7MONITOR", "VENTILATOR"].includes(assetType) && (
              <MonitorConfigure asset={asset as AssetData} />
            )}
          </Card>
        </div>

        {assetType === "HL7MONITOR" && (
          <HL7PatientVitalsMonitor
            key={JSON.stringify(gains)}
            socketUrl={`wss://${middleware}/observations/${localipAddress}`}
            options={{ gains }}
          />
        )}
        {assetType === "VENTILATOR" && (
          <VentilatorPatientVitalsMonitor
            socketUrl={`wss://${middleware}/observations/${localipAddress}`}
          />
        )}
      </div>
    </div>
  );
};
export default HL7Monitor;
