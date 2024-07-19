import { createContext, useContext } from "react";

export const AppConfigContext = createContext<IConfig | null>(null);

interface ILogo {
  light: string;
  dark: string;
}

export interface IConfig {
  dashboard_url?: string;
  github_url: string;
  coronasafe_url: string;
  site_url: string;
  analytics_server_url: string;

  /**
   * The main logo of the app displayed on login and sidebar header.
   */
  main_logo: ILogo;
  /**
   * If present, the image will be displayed on the login page before the main logo.
   */
  state_logo?: ILogo;
  /**
   * if present, this replaces the state logo on the login page only.
   */
  custom_logo?: ILogo;
  /**
   * if present, this replaces the main logo on the login page only.
   */
  custom_logo_alt?: ILogo;

  custom_description?: string;

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

  /**
   * The header banner is displayed on the top of
   * the shift print form if the facility is kasp.
   */
  header_logo: ILogo;
  kasp_enabled: boolean;
  kasp_string: string;
  kasp_full_string: string;
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
   * Env to enable ABDM features
   */
  enable_abdm: boolean;
  /**
   * Env to enable scribe features
   */
  enable_scribe: boolean;
  /**
   * Env to toggle peacetime and wartime shifting
   */
  wartime_shifting: boolean;
  jwt_token_refresh_interval?: number;

  /*
   * Minimum date for a possible consultation encounter.
   */
  min_encounter_date: string;
}

const useConfig = () => {
  const config = useContext(AppConfigContext);

  if (!config) {
    throw new Error("useConfig must be used within an AppConfigProvider");
  }

  return config;
};

export default useConfig;
