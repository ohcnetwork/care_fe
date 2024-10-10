import React from "react";
import BOMDisplay from "./SBOMViewer";

const LicensesPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">
        Third-Party Software and Licenses
      </h1>
      <p className="mb-4">
        This page shows what third-party software is used in Care, including the
        respective licenses and versions.
      </p>
      <BOMDisplay />
    </div>
  );
};

export default LicensesPage;
