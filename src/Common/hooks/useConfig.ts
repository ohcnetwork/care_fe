import { createContext, useContext } from "react";

export const AppConfigContext = createContext<IConfig | null>(null);

interface ILogo {
  light: string;
  dark: string;
}

export interface IConfig {
  dashboard_url: string;
  github_url: string;
  coronasafe_url: string;
  site_url: string;
  analytics_server_url: string;

  header_logo: ILogo;
  main_logo: ILogo;

  /**
   * Logo and description for custom deployment. (This overrides the state logo)
   */
  custom_logo?: ILogo;
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
  kasp_enabled: boolean;
  kasp_string: string;
  kasp_full_string: string;
  /**
   * If present, the image will be displayed in the login page.
   */
  state_logo?: ILogo;
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
   * Env to toggle peacetime and wartime shifting
   */
  wartime_shifting: boolean;
}

const useConfig = () => {
  const config = useContext(AppConfigContext);

  if (!config) {
    throw new Error("useConfig must be used within an AppConfigProvider");
  }

  return config;
};

export default useConfig;
