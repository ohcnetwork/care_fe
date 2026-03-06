import {
  FHIRValidationError,
  FHIRValidationResult,
  FHIRValueSet,
} from "@/types/valueSet/fhir";

/**
 * Validates a FHIR R4 ValueSet resource
 * @param data - The data to validate
 * @returns Validation result with errors and warnings
 */
export function validateFHIRValueSet(data: unknown): FHIRValidationResult {
  const errors: FHIRValidationError[] = [];
  const warnings: FHIRValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== "object") {
    errors.push({
      path: "root",
      message: "Invalid JSON: Expected an object",
      severity: "error",
    });
    return { isValid: false, errors, warnings };
  }

  const valueSet = data as Partial<FHIRValueSet>;

  // Required: resourceType
  if (valueSet.resourceType !== "ValueSet") {
    errors.push({
      path: "resourceType",
      message: 'resourceType must be "ValueSet"',
      severity: "error",
    });
  }

  // Required: id
  if (!valueSet.id || typeof valueSet.id !== "string") {
    errors.push({
      path: "id",
      message: "id is required and must be a string",
      severity: "error",
    });
  } else if (!/^[A-Za-z0-9\-._]+$/.test(valueSet.id)) {
    errors.push({
      path: "id",
      message:
        "id must contain only alphanumeric characters, hyphens, dots, and underscores",
      severity: "error",
    });
  }

  // Required: status
  const validStatuses = ["draft", "active", "retired", "unknown"];
  if (!valueSet.status) {
    errors.push({
      path: "status",
      message: "status is required",
      severity: "error",
    });
  } else if (!validStatuses.includes(valueSet.status)) {
    errors.push({
      path: "status",
      message: `status must be one of: ${validStatuses.join(", ")}`,
      severity: "error",
    });
  }

  // Required: name
  if (!valueSet.name || typeof valueSet.name !== "string") {
    errors.push({
      path: "name",
      message: "name is required and must be a string",
      severity: "error",
    });
  }

  // Recommended: title
  if (!valueSet.title) {
    warnings.push({
      path: "title",
      message: "title is recommended for better readability",
      severity: "warning",
    });
  }

  // Recommended: description
  if (!valueSet.description) {
    warnings.push({
      path: "description",
      message: "description is recommended for documentation",
      severity: "warning",
    });
  }

  // Validate compose if present
  if (valueSet.compose) {
    if (!Array.isArray(valueSet.compose.include)) {
      errors.push({
        path: "compose.include",
        message: "compose.include must be an array",
        severity: "error",
      });
    } else if (valueSet.compose.include.length === 0) {
      errors.push({
        path: "compose.include",
        message: "compose.include must contain at least one element",
        severity: "error",
      });
    } else {
      // Validate each include
      valueSet.compose.include.forEach((include, index) => {
        if (!include.system || typeof include.system !== "string") {
          errors.push({
            path: `compose.include[${index}].system`,
            message: "system is required and must be a string",
            severity: "error",
          });
        } else if (!isValidUrl(include.system)) {
          warnings.push({
            path: `compose.include[${index}].system`,
            message: "system should be a valid URL",
            severity: "warning",
          });
        }

        // Validate concepts if present
        if (include.concept) {
          if (!Array.isArray(include.concept)) {
            errors.push({
              path: `compose.include[${index}].concept`,
              message: "concept must be an array",
              severity: "error",
            });
          } else {
            include.concept.forEach((concept, conceptIndex) => {
              if (!concept.code || typeof concept.code !== "string") {
                errors.push({
                  path: `compose.include[${index}].concept[${conceptIndex}].code`,
                  message: "code is required and must be a string",
                  severity: "error",
                });
              }
              if (!concept.display || typeof concept.display !== "string") {
                warnings.push({
                  path: `compose.include[${index}].concept[${conceptIndex}].display`,
                  message: "display is recommended for better readability",
                  severity: "warning",
                });
              }
            });
          }
        }

        // Validate filters if present
        if (include.filter) {
          if (!Array.isArray(include.filter)) {
            errors.push({
              path: `compose.include[${index}].filter`,
              message: "filter must be an array",
              severity: "error",
            });
          } else {
            include.filter.forEach((filter, filterIndex) => {
              if (!filter.property || typeof filter.property !== "string") {
                errors.push({
                  path: `compose.include[${index}].filter[${filterIndex}].property`,
                  message: "property is required and must be a string",
                  severity: "error",
                });
              }
              if (!filter.op || typeof filter.op !== "string") {
                errors.push({
                  path: `compose.include[${index}].filter[${filterIndex}].op`,
                  message: "op is required and must be a string",
                  severity: "error",
                });
              }
              if (!filter.value || typeof filter.value !== "string") {
                errors.push({
                  path: `compose.include[${index}].filter[${filterIndex}].value`,
                  message: "value is required and must be a string",
                  severity: "error",
                });
              }
            });
          }
        }
      });
    }

    // Validate exclude if present
    if (valueSet.compose.exclude) {
      if (!Array.isArray(valueSet.compose.exclude)) {
        errors.push({
          path: "compose.exclude",
          message: "compose.exclude must be an array",
          severity: "error",
        });
      }
    }
  } else {
    errors.push({
      path: "compose",
      message: "compose is required",
      severity: "error",
    });
  }

  // Validate version format if present
  if (valueSet.version && !isValidVersion(valueSet.version)) {
    warnings.push({
      path: "version",
      message:
        "version should follow semantic versioning (e.g., 1.0.0) for better compatibility",
      severity: "warning",
    });
  }

  // Validate URL format if present
  if (valueSet.url && !isValidUrl(valueSet.url)) {
    warnings.push({
      path: "url",
      message: "url should be a valid URL",
      severity: "warning",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string follows semantic versioning
 */
function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

/**
 * Checks if the imported ValueSet would conflict with an existing one
 */
export function checkVersionConflict(
  importedVersion: string | undefined,
  existingVersion: string | undefined,
): {
  hasConflict: boolean;
  message?: string;
} {
  if (!importedVersion || !existingVersion) {
    return { hasConflict: false };
  }

  if (importedVersion === existingVersion) {
    return {
      hasConflict: true,
      message: "Same version already exists. This will overwrite the existing ValueSet.",
    };
  }

  // Simple version comparison (assumes semantic versioning)
  const imported = parseVersion(importedVersion);
  const existing = parseVersion(existingVersion);

  if (imported && existing) {
    if (
      imported.major < existing.major ||
      (imported.major === existing.major && imported.minor < existing.minor) ||
      (imported.major === existing.major &&
        imported.minor === existing.minor &&
        imported.patch < existing.patch)
    ) {
      return {
        hasConflict: true,
        message: `Importing older version (${importedVersion}) over newer version (${existingVersion}).`,
      };
    }
  }

  return { hasConflict: false };
}

function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}
