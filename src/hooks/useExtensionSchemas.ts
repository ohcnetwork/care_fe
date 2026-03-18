import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  ExtensionConfig,
  ExtensionEntityType,
} from "@/types/extensions/extensions";
import extensionsAPI from "@/types/extensions/extensionsAPI";
import query from "@/Utils/request/query";
import { JSONSchema2020 } from "@/Utils/schema/types";

export type ExtensionSchemaType = "write" | "read" | "retrieve";

/** Extension with its resolved schema */
export interface ExtensionWithSchema {
  /** Extension configuration */
  config: ExtensionConfig;
  /** Resolved schema based on schema type (with fallback applied) */
  schema: JSONSchema2020 | undefined;
}

interface UseExtensionSchemasReturn {
  /** Get all extensions with their schemas for an entity type */
  getExtensions: (
    entityType: ExtensionEntityType,
    schemaType?: ExtensionSchemaType,
  ) => ExtensionWithSchema[];
  /** Get all extension configs for an entity type */
  getConfigs: (entityType: ExtensionEntityType) => ExtensionConfig[];
  /** Whether the data is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
}

/**
 * Resolve the schema for an extension config based on schema type.
 * Applies fallback logic: read/retrieve fall back to write if empty.
 */
function resolveSchema(
  config: ExtensionConfig,
  schemaType: ExtensionSchemaType,
): JSONSchema2020 | undefined {
  let schema: Record<string, unknown> | undefined;

  switch (schemaType) {
    case "write":
      schema = config.write_schema as Record<string, unknown>;
      break;
    case "read":
      // Fall back to write_schema if read_schema is empty
      schema =
        Object.keys(config.read_schema || {}).length > 0
          ? (config.read_schema as Record<string, unknown>)
          : (config.write_schema as Record<string, unknown>);
      break;
    case "retrieve":
      // Fall back to write_schema if retrieve_schema is empty
      schema =
        Object.keys(config.retrieve_schema || {}).length > 0
          ? (config.retrieve_schema as Record<string, unknown>)
          : (config.write_schema as Record<string, unknown>);
      break;
  }

  // Return undefined if schema is empty
  if (!schema || Object.keys(schema).length === 0) {
    return undefined;
  }

  return schema as JSONSchema2020;
}

/**
 * Hook to fetch and access extension schemas from the extensions API.
 *
 * @example
 * ```tsx
 * const { getExtensions, isLoading } = useExtensionSchemas();
 *
 * // Get all extensions with their write schemas for forms
 * const extensions = getExtensions(ExtensionEntityType.account, "write");
 *
 * // Render each extension separately
 * extensions.forEach(({ config, schema }) => {
 *   if (schema) {
 *     // Render extension fields for this specific extension
 *     console.log(`Extension: ${config.name} by ${config.owner}`);
 *   }
 * });
 * ```
 */
export function useExtensionSchemas(): UseExtensionSchemasReturn {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["extensions"],
    queryFn: query(extensionsAPI.list),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    meta: {
      // Extensions are not expected to change frequently, so we can cache them in production.
      persist: process.env.NODE_ENV === "production",
    },
  });

  const getConfigs = useCallback(
    (entityType: ExtensionEntityType): ExtensionConfig[] => {
      return data?.[entityType] || [];
    },
    [data],
  );

  const getExtensions = useCallback(
    (
      entityType: ExtensionEntityType,
      schemaType: ExtensionSchemaType = "write",
    ): ExtensionWithSchema[] => {
      const configs = data?.[entityType] || [];

      return configs.map((config) => ({
        config,
        schema: resolveSchema(config, schemaType),
      }));
    },
    [data],
  );

  return {
    getExtensions,
    getConfigs,
    isLoading,
    isError,
  };
}

export default useExtensionSchemas;
