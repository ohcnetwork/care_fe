import { useMemo } from "react";

import {
  ExtensionEntityType,
  NamespacedExtensionData,
  getExtensionFieldsWithName,
  getExtensionValue,
} from "@/hooks/useExtensions";
import useExtensionSchemas, {
  ExtensionSchemaType,
} from "@/hooks/useExtensionSchemas";
import { ExtensionContext } from "@/Utils/schema/types";

interface PatientExtensionField {
  name: string;
  value: string;
}

export default function usePatientExtensionData(
  extensions: NamespacedExtensionData | undefined,
  context: ExtensionContext,
  schemaType: ExtensionSchemaType = "retrieve",
): PatientExtensionField[] {
  const { getExtensions } = useExtensionSchemas();

  const allExtensions = getExtensions(ExtensionEntityType.patient, schemaType);

  const extensionFields = useMemo(
    () => getExtensionFieldsWithName(allExtensions, context),
    [allExtensions, context],
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
