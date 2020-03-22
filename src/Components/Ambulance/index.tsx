import React from "react";
import { DriverDetailsForm } from "./DriverDetailsForm";
import { VehicleDetailsForm } from "./VehicleDetailsForm";

export const Ambulance = () => {
  return (
    <>
      <VehicleDetailsForm />
      <DriverDetailsForm />
    </>
  );
};
