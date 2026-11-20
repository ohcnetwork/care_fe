export interface AppManifestFrontend {
  url: string;
  name: string;
  /** Not every published app sets this (e.g. `care-ai-vision` omits it). */
  plug?: string;
  config?: Record<string, string>;
}

export interface AppManifestBackend {
  healthCheck?: string;
}

export interface AppStoreOrganisation {
  name: string;
  description?: string;
  verified?: boolean;
  logo?: string;
}

export interface AppStoreTag {
  slug: string;
  name: string;
}

/** A published app, as returned by the App Store API (list and detail). */
export interface AppStorePlugin {
  id: string;
  name: string;
  description: string;
  publisher: string;
  license?: string;
  icon?: string;
  categories?: string[];
  frontend: AppManifestFrontend;
  backend?: AppManifestBackend;
  organisation: AppStoreOrganisation;
  tags: AppStoreTag[];
  repository: string;
  /** Only present on the single-app detail endpoint. */
  readme?: string;
}

/** Paginated response from `GET {apiUrl}?tag=&limit=&offset=`. */
export interface AppStoreListResponse {
  count: number;
  items: AppStorePlugin[];
}
