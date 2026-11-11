export interface ImmunizationPolicyCoding {
  system?: string | null;
  code: string;
  display?: string | null;
  version?: string | null;
}

export interface ImmunizationPolicyTemplate {
  id?: string | null;
  codes: ImmunizationPolicyCoding[];
  diseases?: ImmunizationPolicyCoding[];
  is_group: boolean;
  children: ImmunizationPolicyTemplate[];
  description?: string;
  series?: string;
  dose_number?: string;
  series_number?: string;
  // Whole-day offsets; the policy API does not define their reference point.
  earliest_date?: number;
  due_date?: number;
  overdue_date?: number;
}

export interface ImmunizationPolicyWrite {
  name: string;
  description?: string;
  policy_template: ImmunizationPolicyTemplate;
}

export interface ImmunizationPolicyCreate extends ImmunizationPolicyWrite {
  facility: string | null;
}

export interface ImmunizationPolicyRead extends ImmunizationPolicyWrite {
  id: string;
  // Older versions of the policy API omit ownership from read responses.
  facility?: string | null;
}

export interface ImmunizationPolicyScope {
  basePath: string;
  facilityId?: string;
}

export function immunizationPolicyScope(
  facilityId?: string,
): ImmunizationPolicyScope {
  return {
    facilityId,
    basePath: facilityId
      ? `/facility/${facilityId}/settings/immunization-policies`
      : "/admin/immunization-policies",
  };
}
