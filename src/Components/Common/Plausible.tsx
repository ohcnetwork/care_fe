import useConfig from "../../Common/hooks/useConfig";
import Script from "./Script";

export default function Plausible() {
  const { site_url, analytics_server_url } = useConfig();

  return (
    <Script
      defer
      data-domain={site_url}
      src={`${analytics_server_url}/js/script.js`}
    />
  );
}
