export interface PlugConfigMeta {
  url?: string;
  name?: string;
  config?: {
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PlugConfig {
  slug: string;
  meta: PlugConfigMeta;
}
