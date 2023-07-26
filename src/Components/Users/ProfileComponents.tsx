export const LabelValueCard = (props: { children: React.ReactNode }) => (
  <div className="sm:col-span-1">{props.children}</div>
);

export const ProfileLabel = (props: { text: string }) => (
  <dt className="text-sm font-medium leading-5 text-gray-800">{props.text}</dt>
);

export const ProfileValue = (props: { text: string }) => (
  <dd className="mt-1 text-sm leading-5 text-gray-900">{props.text || "-"}</dd>
);

export const ValueBadge = (props: { text: string }) => (
  <dd className="badge badge-pill badge-primary mb-1 mt-2 text-sm leading-5 text-white">
    {props.text}
  </dd>
);
