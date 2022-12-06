import React, { useEffect, useState } from "react";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import { partialUpdateAsset } from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import MonitorConfigure from "../configure/MonitorConfigure";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import Card from "../../../CAREUI/display/Card";
import TextInputFieldV2 from "../../Common/components/TextInputFieldV2";
import ButtonV2 from "../../Common/components/ButtonV2";
import PatientVitalsCard from "../../Patient/PatientVitalsCard";

interface HL7MonitorProps {
  assetId: string;
  asset: any;
}

const HL7Monitor = (props: HL7MonitorProps) => {
  const { assetId, asset } = props;
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [localipAddress, setLocalIPAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");

  const dispatch = useDispatch<any>();
  useEffect(() => {
    setAssetType(asset?.asset_class);
    setMiddlewareHostname(asset?.meta?.middleware_hostname);
    setLocalIPAddress(asset?.meta?.local_ip_address);
    setIsLoading(false);
  }, [asset]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkIfValidIP(localipAddress)) {
      setIpAddress_error("");
      const data = {
        meta: {
          asset_type: assetType,
          middleware_hostname: middlewareHostname,
          local_ip_address: localipAddress,
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

  if (isLoading) return <Loading />;
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-[350px] shrink-0 flex flex-col gap-4">
          <Card className="w-full flex flex-col">
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-bold mb-2">Connection</h2>
              <div>
                <TextInputFieldV2
                  label="Middleware Hostname"
                  value={middlewareHostname}
                  onChange={(e) => setMiddlewareHostname(e.target.value)}
                  required
                />
                <TextInputFieldV2
                  label="Local IP Address"
                  value={localipAddress}
                  onChange={(e) => setLocalIPAddress(e.target.value)}
                  required
                  error={ipadrdress_error}
                />
              </div>

              <ButtonV2 type="submit" className="w-full">
                <i className="fas fa-save" />
                Save Configuration
              </ButtonV2>
            </form>
          </Card>
          <Card className="">
            {assetType === "HL7MONITOR" ? (
              <MonitorConfigure asset={asset as AssetData} />
            ) : null}
          </Card>
        </div>
        <div className="w-full grow-0 overflow-hidden relative rounded-xl bg-white shadow">
          <PatientVitalsCard
            socketUrl={`wss://${middlewareHostname}/observations/${localipAddress}`}
          />
        </div>
      </div>
    </>
  );
};
export default HL7Monitor;
