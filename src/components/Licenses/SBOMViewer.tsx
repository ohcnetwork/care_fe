import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import licenseUrls from "@/components/Licenses/licenseUrls.json";

const getLicenseUrl = (licenseId: string | undefined): string | null => {
  if (!licenseId) return null;
  return licenseUrls[licenseId as keyof typeof licenseUrls] || null;
};

interface GitHubPackage {
  name: string;
  SPDXID: string;
  versionInfo?: string;
  downloadLocation?: string;
  filesAnalyzed?: boolean;
  licenseConcluded?: string;
  copyrightText?: string;
  externalRefs?: {
    referenceCategory?: string;
    referenceType?: string;
    referenceLocator?: string;
  }[];
}

interface GitHubSBOM {
  sbom?: {
    spdxVersion?: string;
    dataLicense?: string;
    SPDXID?: string;
    name?: string;
    documentNamespace?: string;
    creationInfo?: {
      creators?: string[];
      created?: string;
    };
    packages?: GitHubPackage[];
  };
}

const BOMDisplay: React.FC = () => {
  const [copyStatus, setCopyStatus] = useState(false);
  const [showExternalRefs, setShowExternalRefs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("bom");
  const [feBomData, setFeBomData] = useState<GitHubSBOM | null>(null);
  const [beBomData, setBeBomData] = useState<GitHubSBOM | null>(null);

  useEffect(() => {
    const fetchSBOMData = async (url: string): Promise<GitHubSBOM | null> => {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        return response.ok ? await response.json() : null;
      } catch (error) {
        console.error("Error fetching SBOM data:", error);
        return null;
      }
    };

    const fetchData = async () => {
      const feUrl =
        "https://api.github.com/repos/ohcnetwork/care_fe/dependency-graph/sbom";
      const beUrl =
        "https://api.github.com/repos/ohcnetwork/care/dependency-graph/sbom";

      const [frontendData, backendData] = await Promise.all([
        fetchSBOMData(feUrl),
        fetchSBOMData(beUrl),
      ]);

      setFeBomData(frontendData);
      setBeBomData(backendData);
    };

    fetchData();
  }, []);

  const bomData = activeTab === "bom" ? feBomData : beBomData;

  const handleCopy = () => {
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const packages = bomData?.sbom?.packages || [];

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
            SPDX SBOM (Version: {bomData?.sbom?.spdxVersion || "N/A"})
          </h2>
          <p className="text-sm text-gray-500">
            Created on:{" "}
            {bomData?.sbom?.creationInfo?.created
              ? dayjs(bomData.sbom.creationInfo.created).format("MMMM D, YYYY")
              : "N/A"}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <h3 className="col-span-full text-lg font-semibold text-primary">
            Packages:
          </h3>
          {packages.map((pkg, index) => (
            <div
              key={index}
              className="block rounded-md border p-2 transition-all duration-300 hover:shadow-lg"
            >
              <a
                // href={pkg.externalRefs?.[0]?.referenceLocator || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-dark block text-primary"
              >
                <strong className="text-lg">
                  {pkg.name || "N/A"} v{pkg.versionInfo || "N/A"}
                </strong>
              </a>
              {pkg.licenseConcluded && (
                <p className="text-base">
                  License:{" "}
                  <a
                    href={getLicenseUrl(pkg.licenseConcluded) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-dark text-primary"
                  >
                    {pkg.licenseConcluded || "N/A"}
                  </a>
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
                    {pkg.externalRefs?.map((ref, idx) => (
                      <li key={idx}>
                        <a
                          href={ref.referenceLocator || "#"}
                          className="hover:text-primary-dark block break-words text-primary"
                        >
                          {ref.referenceLocator || "N/A"}
                        </a>
                        {ref.referenceCategory && (
                          <p>Category: {ref.referenceCategory}</p>
                        )}
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
