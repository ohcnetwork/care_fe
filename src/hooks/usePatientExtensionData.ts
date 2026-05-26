import { useMemo } from "react";

import useExtensionSchemas from "@/hooks/useExtensionSchemas";
import {
  ExtensionEntityType,
  NamespacedExtensionData,
  getExtensionFieldsWithName,
  getExtensionValue,
} from "@/hooks/useExtensions";

interface PatientExtensionField {
  name: string;
  value: string;
}

export default function usePatientExtensionData(
  extensions: NamespacedExtensionData | undefined,
): PatientExtensionField[] {
  const { getExtensions } = useExtensionSchemas();

  const allExtensions = getExtensions(ExtensionEntityType.patient, "retrieve");

  const extensionFields = useMemo(
    () => getExtensionFieldsWithName(allExtensions),
    [allExtensions],
  );

  return useMemo(
    () =>
      extensionFields
        .map((field) => {
          const value = getExtensionValue(extensions, field);
          return {
            name: field.label,
            value: value ? String(value) : "",
          };
        })
        .filter((field) => field.value !== ""),
    [extensionFields, extensions],
  );
}
