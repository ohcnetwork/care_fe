import {
  FHIRValueSet,
  FHIRValueSetStatus,
} from "@/types/valueSet/fhir";
import {
  ValueSetBase,
  ValueSetCreate,
  ValueSetRead,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";

/**
 * Maps Care ValueSet status to FHIR status
 */
function mapStatusToFHIR(status: ValueSetStatus): FHIRValueSetStatus {
  const statusMap: Record<ValueSetStatus, FHIRValueSetStatus> = {
    [ValueSetStatus.ACTIVE]: "active",
    [ValueSetStatus.DRAFT]: "draft",
    [ValueSetStatus.RETIRED]: "retired",
    [ValueSetStatus.UNKNOWN]: "unknown",
  };
  return statusMap[status];
}

/**
 * Maps FHIR status to Care ValueSet status
 */
function mapStatusFromFHIR(status: FHIRValueSetStatus): ValueSetStatus {
  const statusMap: Record<FHIRValueSetStatus, ValueSetStatus> = {
    active: ValueSetStatus.ACTIVE,
    draft: ValueSetStatus.DRAFT,
    retired: ValueSetStatus.RETIRED,
    unknown: ValueSetStatus.UNKNOWN,
  };
  return statusMap[status];
}

/**
 * Converts a Care ValueSet to FHIR R4 format
 * @param careValueSet - The Care ValueSet to convert
 * @param version - Optional version string (defaults to "1.0.0")
 * @returns FHIR R4 ValueSet
 */
export function toFHIRValueSet(
  careValueSet: ValueSetRead,
  version?: string,
): FHIRValueSet {
  const fhirValueSet: FHIRValueSet = {
    resourceType: "ValueSet",
    id: careValueSet.slug,
    name: careValueSet.slug,
    title: careValueSet.name,
    status: mapStatusToFHIR(careValueSet.status),
    description: careValueSet.description,
    version: version || "1.0.0",
    date: new Date().toISOString(),
    compose: {
      include: careValueSet.compose.include.map((include) => ({
        system: include.system,
        concept: include.concept?.map((concept) => ({
          code: concept.code,
          display: concept.display,
        })),
        filter: include.filter?.map((filter) => ({
          property: filter.property,
          op: filter.op,
          value: filter.value,
        })),
      })),
      exclude: careValueSet.compose.exclude.map((exclude) => ({
        system: exclude.system,
        concept: exclude.concept?.map((concept) => ({
          code: concept.code,
          display: concept.display,
        })),
        filter: exclude.filter?.map((filter) => ({
          property: filter.property,
          op: filter.op,
          value: filter.value,
        })),
      })),
    },
  };

  // Add metadata if available
  if (careValueSet.created_by || careValueSet.updated_by) {
    fhirValueSet.meta = {
      lastUpdated: new Date().toISOString(),
    };
  }

  return fhirValueSet;
}

/**
 * Converts a FHIR R4 ValueSet to Care format
 * @param fhirValueSet - The FHIR ValueSet to convert
 * @returns Care ValueSet create object
 */
export function fromFHIRValueSet(fhirValueSet: FHIRValueSet): ValueSetCreate {
  const careValueSet: ValueSetCreate = {
    slug: fhirValueSet.id,
    name: fhirValueSet.title || fhirValueSet.name,
    description: fhirValueSet.description || "",
    status: mapStatusFromFHIR(fhirValueSet.status),
    is_system_defined: false,
    compose: {
      include: fhirValueSet.compose?.include.map((include) => ({
        system: include.system,
        concept: include.concept?.map((concept) => ({
          code: concept.code,
          display: concept.display,
        })),
        filter: include.filter?.map((filter) => ({
          property: filter.property,
          op: filter.op,
          value: filter.value,
        })),
      })) || [],
      exclude: fhirValueSet.compose?.exclude?.map((exclude) => ({
        system: exclude.system,
        concept: exclude.concept?.map((concept) => ({
          code: concept.code,
          display: concept.display,
        })),
        filter: exclude.filter?.map((filter) => ({
          property: filter.property,
          op: filter.op,
          value: filter.value,
        })),
      })) || [],
    },
  };

  return careValueSet;
}

/**
 * Generates a filename for exporting a ValueSet
 * @param slug - The ValueSet slug
 * @param version - Optional version string
 * @returns Filename in format: valueset-{slug}-{version}-{timestamp}.json
 */
export function generateExportFilename(
  slug: string,
  version?: string,
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const versionPart = version ? `-${version}` : "";
  return `valueset-${slug}${versionPart}-${timestamp}.json`;
}

/**
 * Downloads a FHIR ValueSet as a JSON file
 * @param fhirValueSet - The FHIR ValueSet to download
 * @param filename - Optional custom filename
 */
export function downloadFHIRValueSet(
  fhirValueSet: FHIRValueSet,
  filename?: string,
): void {
  const json = JSON.stringify(fhirValueSet, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename || generateExportFilename(fhirValueSet.id, fhirValueSet.version);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a JSON file and validates it as a FHIR ValueSet
 * @param file - The file to parse
 * @returns Promise resolving to the parsed FHIR ValueSet
 */
export async function parseFHIRValueSetFile(
  file: File,
): Promise<FHIRValueSet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json as FHIRValueSet);
      } catch (error) {
        reject(new Error("Invalid JSON file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}
