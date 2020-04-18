import React from "react";

export const PublicDashboard = () => {
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl md:text-4xl xl:text-5xl tracking-tight font-bold leading-tight">
        Corona Safe Network
      </h1>
      <div className="text-base md:text-2xl lg:text-xl pt-6 max-w-xl">
        Our Goal is to defend the Healthcare system of Kerala from overloading
        beyond capacity.
      </div>
      <div className="flex flex-col">
        <a
          className="py-6 mt-4 bg-white rounded-md shadow border border-grey-500 inline-flex items-center justify-center whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 h4"
          href="/ambulance"
        >
          Add Ambulance Details
        </a>
      </div>
    </div>
  );
};
