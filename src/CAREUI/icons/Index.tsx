import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";
import iconPaths from "@/CAREUI/icons/UniconPaths.json";

import PageTitle from "@/components/Common/PageTitle";

const IconIndex: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = Object.keys(iconPaths).filter((iconName) =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied_to_clipboard"));
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <PageTitle title={t("care_icons")} />
      <input
        type="text"
        placeholder={t("search")}
        className="mb-4 w-full rounded-md border border-gray-300 p-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredIcons.map((iconName) => (
          <div
            key={iconName}
            className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-xs"
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
