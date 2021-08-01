import React from "react";

export const limit = 14;

export const initialFilterData = {
  status: "--",
  facility: "",
  orgin_facility: "",
  approving_facility: "",
  assigned_facility: "",
  emergency: "--",
  limit: limit,
  created_date_before: null,
  created_date_after: null,
  modified_date_before: null,
  modified_date_after: null,
  offset: 0,
  ordering: null,
};

export const formatFilter = (params: any) => {
  const filter = { ...initialFilterData, ...params };
  return {
    status: filter.status === "--" ? null : filter.status,
    facility: "",
    orgin_facility: filter.orgin_facility || undefined,
    approving_facility: filter.approving_facility || undefined,
    assigned_facility: filter.assigned_facility || undefined,
    emergency:
      (filter.emergency && filter.emergency) === "--"
        ? ""
        : filter.emergency === "yes"
        ? "true"
        : "false",
    limit: limit,
    offset: filter.offset,
    created_date_before: filter.created_date_before || undefined,
    created_date_after: filter.created_date_after || undefined,
    modified_date_before: filter.modified_date_before || undefined,
    modified_date_after: filter.modified_date_after || undefined,
    ordering: filter.ordering || undefined,
  };
};

// export const badge = (key: string, value: any) => {
//   return (
//     value && (
//       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
//         {key}
//         {": "}
//         {value}
//       </span>
//     )
//   );
// };
