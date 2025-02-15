import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CopyIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";

import useAppHistory from "@/hooks/useAppHistory";

import licenseUrls from "@/pages/Licenses/components/license-urls.json";
import { LicensesSbom, PackageType } from "@/types/license";

const sbomUrlMap = {
  frontend: "/sbom/care_fe-sbom.json",
  backend: "/sbom/care-sbom.json",
};

function getPackageUrl(pkgName: string, purl: string): string {
  if (!purl || !pkgName) return "";

  const urlMap: Record<PackageType, string> = {
    pypi: `https://pypi.org/project/${pkgName}`,
    npm: `https://www.npmjs.com/package/${pkgName}`,
    github: `https://github.com/${pkgName}`,
    githubactions: `https://github.com/actions/${pkgName}`,
  };

  const pkgType = Object.keys(urlMap).find((key) =>
    purl.startsWith(`pkg:${key}/`),
  );

  return pkgType ? urlMap[pkgType as PackageType] : purl;
}

export const LicensesPage = () => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const [tab, setTab] = useState<"frontend" | "backend">("frontend");

  const { data, isLoading } = useQuery<LicensesSbom>({
    queryKey: ["sbom", tab],
    queryFn: () => fetch(sbomUrlMap[tab]).then((res) => res.json()),
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
      <Button variant="outline" className="mb-4" onClick={() => goBack()}>
        <CareIcon icon="l-arrow-left" className="text-lg" />
        {t("back")}
      </Button>
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
        {t("licenses_title")}
      </h1>
      <p className="mb-4 sm:text-lg md:text-xl lg:text-2xl">
        {t("licenses_description")}
      </p>

      <div className="p-4">
        <div className="mb-4 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "frontend" | "backend")}
          >
            <TabsList>
              <TabsTrigger value="frontend">{t("care_frontend")}</TabsTrigger>
              <TabsTrigger value="backend">{t("care_backend")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading || !data ? <Loading /> : <SbomViewer data={data} />}
      </div>
    </div>
  );
};

const SbomViewer = ({ data: { sbom } }: { data: LicensesSbom }) => {
  const { t } = useTranslation();

  return (
    <Card className="rounded-lg bg-white p-4 shadow-md transition-all duration-300">
      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold text-primary md:text-2xl">
          {t("spdx_sbom_version") + ": " + sbom.spdxVersion}
        </h2>
        <p className="text-sm text-gray-500">
          {t("created_on")} {format(sbom.creationInfo.created, "PPP")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <h3 className="col-span-full text-lg font-semibold text-primary">
          {t("packages")}
          {":"}
        </h3>
        {sbom.packages.map((pkg) => (
          <SbomPackage key={pkg.SPDXID} pkg={pkg} />
        ))}
      </div>
      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await navigator.clipboard.writeText(JSON.stringify(sbom, null, 2));
            toast.info(t("copied_to_clipboard"));
          }}
        >
          <CopyIcon className="mr-2" />
          {t("copy_bom_json")}
        </Button>
      </div>
    </Card>
  );
};

const SbomPackage = ({
  pkg,
}: {
  pkg: LicensesSbom["sbom"]["packages"][number];
}) => {
  const { t } = useTranslation();
  return (
    <div className="block rounded-md border p-2 transition-all duration-300 hover:shadow-lg">
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary-dark block text-primary"
        href={`${getPackageUrl(pkg.name, pkg.externalRefs[0].referenceLocator)}`}
      >
        <strong className="text-lg">{`${pkg.name} v${pkg.versionInfo}`}</strong>
      </a>
      {pkg.licenseConcluded && (
        <p className="text-base">
          {t("license")}
          {": "}
          <a
            href={licenseUrls[pkg.licenseConcluded as keyof typeof licenseUrls]}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-dark text-primary"
          >
            {pkg.licenseConcluded}
          </a>
        </p>
      )}
    </div>
  );
};
