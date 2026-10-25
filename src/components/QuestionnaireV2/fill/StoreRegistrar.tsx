import { createStore, useStore } from "jotai";
import { useEffect } from "react";

export type FormStore = ReturnType<typeof createStore>;

/** Rendered inside a form's QuestionnaireFormProvider: hands the
 *  per-instance jotai store up to the fill host. The host↔engine surface
 *  is exactly this callback — no engine changes. */
export function StoreRegistrar({
  formKey,
  onStore,
}: {
  formKey: string;
  onStore: (key: string, store: FormStore | null) => void;
}) {
  const store = useStore();
  useEffect(() => {
    onStore(formKey, store);
    return () => onStore(formKey, null);
  }, [formKey, store, onStore]);
  return null;
}
