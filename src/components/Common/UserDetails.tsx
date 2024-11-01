import { ReactNode } from "react";

function UserDetails(props: {
  children: ReactNode;
  title: string;
  id?: string;
}) {
  return (
    <div className="mt-2" id={props.id}>
      <div className="text-sm font-light leading-relaxed text-[#B9B9B9]">
        {props.title}
      </div>
      {props.children}
    </div>
  );
}

export default UserDetails;
