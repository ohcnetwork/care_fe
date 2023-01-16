import { useSelector } from "react-redux";

export interface IConfig {
  dashboard_url: string;
  github_url: string;
  static_header_logo: string;
  static_light_logo: string;
  static_black_logo: string;
  gmaps_api_key: string;
  gov_data_api_key: string;
  recaptcha_site_key: string;
  kasp_enabled: boolean;
  kasp_string: string;
  kasp_full_string: string;
  state_logo?: string;
}

const useConfig = () => {
  const state: any = useSelector((state) => state);
  const { config } = state;
  return config.data as IConfig;
};

export default useConfig;
