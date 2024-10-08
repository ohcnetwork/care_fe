import React, { useState, useEffect } from "react";
import Card from "../CAREUI/display/Card";
import dayjs from "dayjs";
import { CopyToClipboard } from "react-copy-to-clipboard";
import axios from "axios";

const licenseUrls: { [key: string]: string } = {
  MIT: "https://opensource.org/licenses/MIT",
  "GPL-3.0": "https://www.gnu.org/licenses/gpl-3.0.en.html",
  "Apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
  ISC: "https://opensource.org/licenses/ISC",
  "0BSD": "https://opensource.org/licenses/0BSD",
  "OFL-1.1": "https://opensource.org/licenses/OFL-1.1",
  "BSD-3-Clause": "https://opensource.org/licenses/BSD-3-Clause",
  "BSD-2-Clause": "https://opensource.org/licenses/BSD-2-Clause",
  "LGPL-2.1": "https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html",
  "LGPL-3.0": "https://www.gnu.org/licenses/lgpl-3.0.en.html",
  "AGPL-3.0": "https://www.gnu.org/licenses/agpl-3.0.en.html",
  "MPL-2.0": "https://www.mozilla.org/en-US/MPL/2.0/",
  "EPL-2.0": "https://www.eclipse.org/legal/epl-2.0/",
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  Unlicense: "https://unlicense.org/",
  "BlueOak-1.0.0": "https://blueoakcouncil.org/license/1.0.0",
};

const getLicenseUrl = (licenseId: string | undefined): string | null => {
  if (!licenseId) return null;
  return licenseUrls[licenseId] || null;
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
  const [bom, setBOM] = useState<CycloneDXBOM | null>(null);
  const [beBom, setBeBOM] = useState<CycloneDXBOM | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [showExternalRefs, setShowExternalRefs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("bom");

  useEffect(() => {
    axios
      .get("/bom.json")
      .then((response) => setBOM(response.data))
      .catch((error) => console.error("Error fetching BOM:", error));

    axios
      .get("/be-sbom.json")
      .then((response) => setBeBOM(response.data))
      .catch((error) => console.error("Error fetching BE SBOM:", error));
  }, []);

  const handleCopy = () => {
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const renderBOM = (bomData: CycloneDXBOM | null) => {
    if (!bomData) return <div>Loading BOM...</div>;

    return (
      <Card className="rounded-lg bg-white p-4 shadow-md transition-all duration-300">
        <div className="mb-4">
          <h2 className="mb-2 text-2xl font-semibold">
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
        <div className="mt-4 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 text-lg font-semibold">Components:</h3>
          {bomData.components?.map((component, index) => (
            <div
              key={index}
              className="block rounded-md border p-2 transition-all duration-300 hover:shadow-md"
            >
              <a
                href={
                  component.externalReferences?.[1]?.url ||
                  component.externalReferences?.[0]?.url ||
                  "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                <strong className="block text-lg">
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
                    className="text-primary-400 hover:text-primary-500"
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
                <h5
                  className="cursor-pointer font-semibold"
                  onClick={() =>
                    setShowExternalRefs(
                      showExternalRefs === index ? null : index,
                    )
                  }
                >
                  External References:
                </h5>
                {showExternalRefs === index && (
                  <ul className="list-inside list-disc pl-4 text-xs">
                    {component.externalReferences?.map((ref, idx) => (
                      <li key={idx}>
                        <a
                          href={ref.url || "#"}
                          className="text-primary-400 hover:text-primary-500"
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
            <button className="text-md rounded-md bg-blue-400 px-4 py-2 text-white transition-all duration-300 hover:bg-blue-500 focus:outline-none">
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
    );
  };

  return (
    <div>
      <div className="mb-4 flex space-x-4">
        <button
          className={`text-md rounded-md px-4 py-2 transition-all duration-300 ${
            activeTab === "bom" ? "bg-blue-400 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("bom")}
        >
          Care Frontend
        </button>
        <button
          className={`text-md rounded-md px-4 py-2 transition-all duration-300 ${
            activeTab === "beBom" ? "bg-blue-400 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("beBom")}
        >
          Care Backend
        </button>
      </div>
      {activeTab === "bom" ? renderBOM(bom) : renderBOM(beBom)}
    </div>
  );
};

export default BOMDisplay;
