import React from "react";

import BOMDisplay from "@/components/Licenses/SBOMViewer";

const LicensesPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
        Third-Party Software and Licenses
      </h1>
      <p className="mb-4 sm:text-lg md:text-xl lg:text-2xl">
        This page shows what third-party software is used in Care, including the
        respective licenses and versions.
      </p>
      <BOMDisplay />
    </div>
  );
};

export default LicensesPage;
