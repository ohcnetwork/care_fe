import { useSelector } from "react-redux";

export interface IConfig {
  dashboard_url: string;
  github_url: string;
  static_header_logo: string;
  static_light_logo: string;
  static_black_logo: string;
  /**
   * The API key for the Google Maps API used for location picker.
   */
  gmaps_api_key: string;
  /**
   * The API key for the data.gov.in API used for pincode auto-complete.
   */
  gov_data_api_key: string;
  recaptcha_site_key: string;
  kasp_enabled: boolean;
  kasp_string: string;
  kasp_full_string: string;
  /**
   * If present, the image will be displayed in the login page.
   */
  state_logo?: string;
  /**
   * If true, the state logo will be white by applying "invert brightness-0" classes.
   */
  state_logo_white?: boolean;
}

const useConfig = () => {
  const state: any = useSelector((state) => state);
  const { config } = state;
  return config.data as IConfig;
};

export default useConfig;
