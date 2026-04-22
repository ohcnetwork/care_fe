export interface AppStoreCategory {
  slug: string;
  name: string;
  description?: string;
}

export interface AppStoreDeveloper {
  slug: string;
  name: string;
  description?: string;
  url?: string;
}

export interface AppStoreBaseConfig {
  url: string;
  name: string;
  plug: string;
}

export interface AppStoreEnvironmentField {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  path?: string;
}

export interface AppStoreSetupAppBaseUrlField {
  label?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
}

export interface AppStoreCustomEnvironmentConfig {
  enabled: boolean;
  label?: string;
  description?: string;
  path?: string;
}

export interface AppStoreEnvironmentGroups {
  mandatory?: AppStoreEnvironmentField[];
  defaults?: AppStoreEnvironmentField[];
  optional?: AppStoreEnvironmentField[];
  custom?: AppStoreCustomEnvironmentConfig;
}

export interface AppStoreHealthCheck {
  url: string;
  method?: "GET" | "POST";
  successStatus?: number;
}

export interface AppStoreConfigurationTemplate {
  id: string;
  title: string;
  description?: string;
  config?: Record<string, unknown>;
  appBaseUrl?: AppStoreSetupAppBaseUrlField;
  environments?: AppStoreEnvironmentGroups;
}

export interface AppStoreSource {
  repository: string;
  manifestUrl?: string;
  appBaseUrl?: string;
}

export interface AppStoreAppDefinition {
  $schema?: string;
  slug: string;
  name: string;
  description: string;
  featured?: boolean;
  iconUrl?: string;
  developer: AppStoreDeveloper;
  categories: AppStoreCategory[];
  baseConfig: AppStoreBaseConfig;
  healthCheck?: AppStoreHealthCheck;
  source: AppStoreSource;
  standardConfigurations: AppStoreConfigurationTemplate[];
  rawSetup: AppStoreConfigurationTemplate;
}

export interface AppStoreSetupOption {
  id: string;
  title: string;
  description?: string;
  config?: Record<string, unknown>;
  appBaseUrl?: AppStoreSetupAppBaseUrlField;
  environments: AppStoreEnvironmentGroups;
}

export interface AppStoreSummary {
  slug: string;
  name: string;
  description: string;
  featured?: boolean;
  iconUrl?: string;
  appUrl: string;
  developer: AppStoreDeveloper;
  categories: AppStoreCategory[];
  standardConfigurations: Array<
    Pick<AppStoreConfigurationTemplate, "id" | "title" | "description">
  >;
}

export interface AppStoreBrowseLink {
  slug: string;
  name: string;
  description?: string;
  appCount: number;
  url: string;
}

export interface AppStoreRootIndex {
  schemaVersion: number;
  featuredApps: AppStoreSummary[];
  categories: AppStoreBrowseLink[];
  developers: AppStoreBrowseLink[];
}

export interface AppStoreBrowseIndex {
  schemaVersion: number;
  slug: string;
  title: string;
  description?: string;
  apps: AppStoreSummary[];
}
