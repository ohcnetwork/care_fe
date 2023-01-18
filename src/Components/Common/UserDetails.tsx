import React from "react";

function UserDetails(props: {
  children: React.ReactNode;
  title: string;
  id?: string;
}) {
  return (
    <div className="mt-2" id={props.id}>
      <div className="text-gray-900 leading-relaxed font-light">
        {props.title} :
      </div>
      {props.children}
    </div>
  );
}

export default UserDetails;
