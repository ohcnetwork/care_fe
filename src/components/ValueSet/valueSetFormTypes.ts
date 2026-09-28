import type { ValueSetBase, ValueSetInclude } from "@/types/valueSet/valueSet";

/** What the form hands back: the editable fields plus the create-only
 *  lineage (`parent` / `inherited`), which the backend ignores on update. */
export interface ValueSetFormSubmit extends ValueSetBase {
  parent?: string;
  inherited: boolean;
}

export interface ValueSetFormState {
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface ValueSetFormInclude extends Omit<ValueSetInclude, "version"> {
  version: string;
}

export interface ValueSetFormData extends Omit<ValueSetBase, "compose"> {
  compose: {
    exclude: ValueSetFormInclude[];
    include: ValueSetFormInclude[];
  };
  parent?: string;
  inherited: boolean;
}

export const SLUG_MIN = 5;
export const SLUG_MAX = 25;
