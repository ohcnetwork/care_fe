import { createContext, useContext, useMemo } from "react";

import type { FieldProvenance, ProvenanceMap } from "./types";

interface ScribeContextValue {
  provenance: ProvenanceMap;
}

const ScribeContext = createContext<ScribeContextValue | null>(null);

interface ScribeProvenanceProviderProps {
  provenance: ProvenanceMap;
  children: React.ReactNode;
}

export function ScribeProvenanceProvider({
  provenance,
  children,
}: ScribeProvenanceProviderProps) {
  const value = useMemo(() => ({ provenance }), [provenance]);
  return (
    <ScribeContext.Provider value={value}>{children}</ScribeContext.Provider>
  );
}

/**
 * Returns the provenance entry for a given question id, or undefined when
 * no scribe session is active / the field has no AI history.
 */
export function useFieldProvenance(
  questionId: string,
): FieldProvenance | undefined {
  const ctx = useContext(ScribeContext);
  if (!ctx) return undefined;
  return ctx.provenance[questionId];
}
