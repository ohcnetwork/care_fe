import { ReactNode } from "react";

function UserDetails(props: {
  children: ReactNode;
  title: string;
  id?: string;
}) {
  return (
    <div className="mt-2" id={props.id}>
      <div className="font-light leading-relaxed text-gray-900">
        {props.title}:
      </div>
      {props.children}
    </div>
  );
}

export default UserDetails;
