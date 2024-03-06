import { SyntheticEvent, useEffect, useState } from "react";
import { AssetData, ResolvedMiddleware } from "../AssetTypes";
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
import useAuthUser from "../../../Common/hooks/useAuthUser";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";

interface HL7MonitorProps {
  assetId: string;
  facilityId: string;
  asset: any;
}

const HL7Monitor = (props: HL7MonitorProps) => {
  const { assetId, asset } = props;
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [resolvedMiddleware, setResolvedMiddleware] =
    useState<ResolvedMiddleware>();
  const [isLoading, setIsLoading] = useState(true);
  const [localipAddress, setLocalIPAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");
  const authUser = useAuthUser();

  useEffect(() => {
    setAssetType(asset?.asset_class);
    setMiddlewareHostname(asset?.meta?.middleware_hostname);
    setResolvedMiddleware(asset?.resolved_middleware);
    setLocalIPAddress(asset?.meta?.local_ip_address);
    setIsLoading(false);
  }, [asset]);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (checkIfValidIP(localipAddress)) {
      setIpAddress_error("");
      const data = {
        meta: {
          asset_type: assetType,
          middleware_hostname: middlewareHostname, // TODO: remove this infavour of facility.middleware_address
          local_ip_address: localipAddress,
        },
      };
      const { res } = await request(routes.partialUpdateAsset, {
        pathParams: { external_id: assetId },
        body: data,
      });
      if (res?.status === 200) {
        Notification.Success({
          msg: "Asset Configured Successfully",
        });
      } else {
        Notification.Error({
          msg: "Something went wrong!",
        });
      }
    } else {
      setIpAddress_error("IP address is invalid");
    }
  };

  if (isLoading) return <Loading />;

  const socketUrl = `wss://${
    middlewareHostname || resolvedMiddleware?.hostname
  }/observations/${localipAddress}`;

  return (
    <div className="mx-auto flex w-full xl:mt-8">
      <div className="mx-auto flex flex-col gap-4 xl:flex-row-reverse">
        {["DistrictAdmin", "StateAdmin"].includes(authUser.user_type) && (
          <div className="flex w-full shrink-0 flex-col gap-4 xl:max-w-xs">
            <Card className="flex w-full flex-col">
              <form onSubmit={handleSubmit}>
                <h2 className="mb-2 text-lg font-bold">Connection</h2>
                <div className="flex flex-col gap-2">
                  <TextFormField
                    name="middleware_hostname"
                    label={
                      <div className="flex flex-row gap-1">
                        <p>Middleware Hostname</p>
                        {resolvedMiddleware?.source != "asset" && (
                          <div className="tooltip">
                            <CareIcon
                              icon="l-info-circle"
                              className="tooltip text-indigo-500 hover:text-indigo-600"
                            />
                            <span className="tooltip-text w-56 whitespace-normal">
                              Middleware hostname sourced from asset{" "}
                              {resolvedMiddleware?.source}
                            </span>
                          </div>
                        )}
                      </div>
                    }
                    placeholder={resolvedMiddleware?.hostname}
                    value={middlewareHostname}
                    onChange={(e) => setMiddlewareHostname(e.value)}
                    errorClassName="hidden"
                  />
                  <TextFormField
                    name="localipAddress"
                    label="Local IP Address"
                    value={localipAddress}
                    onChange={(e) => setLocalIPAddress(e.value)}
                    required
                    error={ipadrdress_error}
                  />
                  <Submit className="w-full">
                    <CareIcon className="care-l-save" />
                    <span>Save Configuration</span>
                  </Submit>
                </div>
              </form>
            </Card>
            {["HL7MONITOR"].includes(assetType) && (
              <Card>
                <MonitorConfigure asset={asset as AssetData} />
              </Card>
            )}
          </div>
        )}

        {assetType === "HL7MONITOR" && (
          <HL7PatientVitalsMonitor
            key={socketUrl}
            socketUrl={socketUrl}
            hideHeader={true}
            hideFooter={true}
          />
        )}
        {assetType === "VENTILATOR" && (
          <VentilatorPatientVitalsMonitor
            key={socketUrl}
            socketUrl={socketUrl}
            hideHeader={true}
            hideFooter={true}
          />
        )}
      </div>
    </div>
  );
};
export default HL7Monitor;
