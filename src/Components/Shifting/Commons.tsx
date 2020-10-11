import React from "react";

export const limit = 30;

export const initialFilterData = {
  status: '--',
  facility: '',
  orgin_facility: '',
  shifting_approving_facility: '',
  assigned_facility: '',
  emergency: '--',
  is_up_shift: '--',
  limit: limit,
  patient_name: '',
  created_date_before: null,
  created_date_after: null,
  modified_date_before: null,
  modified_date_after: null,
  patient_phone_number: '',
  offset: 0,
  ordering: null,
  is_kasp: '--'
}

export const formatFilter = (params: any) => {
  const filter = { ...initialFilterData, ...params };
  return {
    status: filter.status === '--' ? null : filter.status,
    facility: '',
    orgin_facility: filter.orgin_facility || undefined,
    shifting_approving_facility: filter.shifting_approving_facility || undefined,
    assigned_facility: filter.assigned_facility || undefined,
    emergency: (filter.emergency && filter.emergency) === '--' ? '' : (filter.emergency === 'yes' ? 'true' : 'false'),
    is_up_shift: (filter.is_up_shift && filter.is_up_shift) === '--' ? '' : (filter.is_up_shift === 'yes' ? 'true' : 'false'),
    limit: limit,
    offset: filter.offset,
    patient_name: filter.patient_name || undefined,
    created_date_before: filter.created_date_before || undefined,
    created_date_after: filter.created_date_after || undefined,
    modified_date_before: filter.modified_date_before || undefined,
    modified_date_after: filter.modified_date_after || undefined,
    patient_phone_number: filter.patient_phone_number || undefined,
    ordering: filter.ordering || undefined,
    is_kasp: (filter.is_kasp && filter.is_kasp) === '--' ? '' : (filter.is_kasp === 'yes' ? 'true' : 'false'),
  };
}

export const badge = (key: string, value: any) => {
  return (
    value && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
      {key}{": "}{value}
    </span>
  )
};