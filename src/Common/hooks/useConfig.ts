import { useSelector } from "react-redux";

export interface IConfig {
  dashboard_url: string;
  github_url: string;
  coronasafe_url: string;
  dpg_url: string;
  site_url: string;
  analytics_server_url: string;
  static_header_logo: string;
  static_ohc_light_logo: string;
  static_ohc_green_logo: string;
  static_light_logo: string;
  static_black_logo: string;
  /**
   * White logo of Digital Public Goods.
   */
  static_dpg_white_logo: string;
  static_coronasafe_logo: string;
  /**
   * The API key for the Google Maps API used for location picker.
   */
  gmaps_api_key: string;
  /**
   * The API key for the data.gov.in API used for pincode auto-complete.
   */
  gov_data_api_key: string;
  recaptcha_site_key: string;
  /**
   * SENTRY_DSN
   */
  sentry_dsn: string;
  /**
   * SENTRY_ENVIRONMENT
   */
  sentry_environment: string;
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
  /**
   * URL of the sample format for asset import.
   */
  sample_format_asset_import: string;
  /**
   * URL of the sample format for external result import.
   */
  sample_format_external_result_import: string;
  /**
   * Env to enable HCX features
   */
  enable_hcx: boolean;
  /**
   * Env to toggle peacetime and wartime shifting
   */
  wartime_shifting: boolean;
}

const useConfig = () => {
  const state: any = useSelector((state) => state);
  const { config } = state;
  return config.data as IConfig;
};

export default useConfig;
