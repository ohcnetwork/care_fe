import { useSelector } from "react-redux";

export interface IConfig {
  dashboard_url: string;
  //   gmaps_api_key?: string;
  //   sentry_api_key?: string;
  //   recaptcha_site_key?: string;

  // KASP related
  //   kasp_label?: string;
  //   kasp_long_label?: string;
  //   kasp_enabled?: boolean;
}

const useConfig = () => {
  const state: any = useSelector((state) => state);
  const { config } = state;
  return config.data as IConfig;
};

export default useConfig;
