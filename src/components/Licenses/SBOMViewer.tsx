import dayjs from "dayjs";
import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import beBomData from "@/components/Licenses/be-sbom.json";
import feBomData from "@/components/Licenses/fe-sbom.json";
import licenseUrls from "@/components/Licenses/licenseUrls.json";

const getLicenseUrl = (licenseId: string | undefined): string | null => {
  if (!licenseId) return null;
  return licenseUrls[licenseId as keyof typeof licenseUrls] || null;
};
interface CycloneDXExternalRef {
  url?: string;
  type?: string;
  comment?: string;
}

interface CycloneDXLicense {
  license?: {
    id?: string;
  };
}

interface CycloneDXProperties {
  name?: string;
  value?: string;
}

interface CycloneDXComponent {
  type?: string;
  name?: string;
  group?: string;
  version?: string;
  bomRef?: string;
  author?: string;
  description?: string;
  licenses?: CycloneDXLicense[];
  externalReferences?: CycloneDXExternalRef[];
  properties?: CycloneDXProperties[];
}

interface CycloneDXTool {
  name?: string;
  version?: string;
  vendor?: string;
  externalReferences?: CycloneDXExternalRef[];
}

interface CycloneDXBOM {
  bomFormat?: string;
  specVersion?: string;
  version?: number;
  serialNumber?: string;
  metadata?: {
    timestamp?: string;
    tools?: CycloneDXTool[];
    component?: CycloneDXComponent;
  };
  components?: CycloneDXComponent[];
}

const BOMDisplay: React.FC = () => {
  const [copyStatus, setCopyStatus] = useState(false);
  const [showExternalRefs, setShowExternalRefs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("bom");

  const handleCopy = () => {
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const bomData = (activeTab === "bom" ? feBomData : beBomData) as CycloneDXBOM;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <button
          className={`text-md w-full rounded-md px-4 py-2 transition-all duration-300 md:w-auto ${
            activeTab === "bom" ? "bg-primary text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("bom")}
        >
          Care Frontend
        </button>
        <button
          className={`text-md w-full rounded-md px-4 py-2 transition-all duration-300 md:w-auto ${
            activeTab === "beBom" ? "bg-primary text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("beBom")}
        >
          Care Backend
        </button>
      </div>
      <Card className="rounded-lg bg-white p-4 shadow-md transition-all duration-300">
        <div className="mb-4">
          <h2 className="mb-2 text-xl font-semibold text-primary md:text-2xl">
            {bomData.bomFormat || "N/A"} BOM (Version:{" "}
            {bomData.version || "N/A"})
          </h2>
          <p className="text-sm text-gray-500">
            Created on:{" "}
            {bomData.metadata?.timestamp
              ? dayjs(bomData.metadata.timestamp).format("MMMM D, YYYY")
              : "N/A"}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <h3 className="col-span-full text-lg font-semibold text-primary">
            Components:
          </h3>
          {bomData.components?.map((component, index) => (
            <div
              key={index}
              className="block rounded-md border p-2 transition-all duration-300 hover:shadow-lg"
            >
              <a
                href={
                  component.externalReferences?.[1]?.url ||
                  component.externalReferences?.[0]?.url ||
                  "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-dark block text-primary"
              >
                <strong className="text-lg">
                  {component.name || "N/A"} v{component.version || "N/A"}
                </strong>
              </a>
              {component.licenses && component.licenses[0]?.license?.id && (
                <p className="text-base">
                  License:{" "}
                  <a
                    href={
                      getLicenseUrl(component.licenses[0].license.id) || "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-dark text-primary"
                  >
                    {component.licenses[0].license.id || "N/A"}
                  </a>
                </p>
              )}
              {component.description && (
                <p className="text-base">
                  Description: {component.description}
                </p>
              )}
              <div>
                <h4
                  className="block cursor-pointer font-semibold text-primary"
                  onClick={() =>
                    setShowExternalRefs(
                      showExternalRefs === index ? null : index,
                    )
                  }
                >
                  <CareIcon icon="l-info-circle" />
                </h4>
                {showExternalRefs === index && (
                  <ul className="list-inside list-disc pl-4 text-xs">
                    {component.externalReferences?.map((ref, idx) => (
                      <li key={idx}>
                        <a
                          href={ref.url || "#"}
                          className="hover:text-primary-dark block break-words text-primary"
                        >
                          {ref.url || "N/A"}
                        </a>
                        {ref.comment && <p>Comment: {ref.comment}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <CopyToClipboard
            text={JSON.stringify(bomData, null, 2)}
            onCopy={handleCopy}
          >
            <button className="text-md hover:bg-primary-dark w-full rounded-md bg-primary px-4 py-2 text-white transition-all duration-300 focus:outline-none md:w-auto">
              Copy BOM JSON
            </button>
          </CopyToClipboard>
          {copyStatus && (
            <span className="mt-2 block text-sm text-gray-600">
              Copied to clipboard!
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BOMDisplay;
