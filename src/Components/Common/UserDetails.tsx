import React from "react";

function UserDetails(props: { children: React.ReactNode; title: string }) {
  return (
    <div className="mt-2">
      <div className="text-gray-500 leading-relaxed font-light">
        {props.title} :
      </div>
      {props.children}
    </div>
  );
}

export default UserDetails;
