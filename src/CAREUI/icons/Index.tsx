/* eslint-disable i18next/no-literal-string */
import { t } from "i18next";
import React, { useState } from "react";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";
import iconPaths from "@/CAREUI/icons/UniconPaths.json";

import PageTitle from "@/components/Common/PageTitle";

import { useToast } from "@/hooks/useToast";

const IconIndex: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = Object.keys(iconPaths).filter((iconName) =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);

    toast({
      description: "Icon copied to clipboard successfully",
      variant: "success",
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <PageTitle title="Care Icons" hideBack={true} />
      <input
        type="text"
        placeholder={t("search")}
        className="mb-4 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredIcons.map((iconName) => (
          <div
            key={iconName}
            className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <CareIcon icon={iconName as IconName} className="mb-2 text-3xl" />
            <span className="mb-2 text-sm font-medium">{iconName}</span>
            <button
              onClick={() => copyToClipboard(`<CareIcon icon="${iconName}" />`)}
              className="rounded bg-gray-100 px-2 py-1 text-xs transition duration-150 ease-in-out hover:bg-gray-200"
            >
              Copy JSX
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IconIndex;
