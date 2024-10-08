import React from "react";
import BOMDisplay from "./SBOMViewer";

const LicensesPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Licenses and SBOM</h1>
      <BOMDisplay />
    </div>
  );
};

export default LicensesPage;
