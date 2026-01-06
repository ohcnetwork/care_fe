import { API } from "@/Utils/request/utils";
import { PlugConfig } from "@/types/plugConfig";

/**
 * API endpoints for managing plugin configurations
 */
const plugConfigApi = {
  /**
   * List all plugin configurations
   */
  list: API<{ configs: PlugConfig[] }>("GET /api/v1/plug_config/"),

  /**
   * Get a specific plugin configuration by slug
   */
  get: API<PlugConfig>("GET /api/v1/plug_config/{slug}/"),

  /**
   * Create a new plugin configuration
   */
  create: API<PlugConfig, PlugConfig>("POST /api/v1/plug_config/"),

  /**
   * Update an existing plugin configuration
   */
  update: API<PlugConfig, PlugConfig>("PATCH /api/v1/plug_config/{slug}/"),

  /**
   * Delete a plugin configuration
   */
  delete: API<Record<string, never>>("DELETE /api/v1/plug_config/{slug}/"),
} as const;

export default plugConfigApi;
