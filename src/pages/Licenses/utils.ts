import { LicensesSbom, PackageType } from "@/types/license";

export const getPackageUrl = (
  pkgName: LicensesSbom["sbom"]["packages"][number]["name"],
  version: LicensesSbom["sbom"]["packages"][number]["versionInfo"],
  purl: LicensesSbom["sbom"]["packages"][number]["externalRefs"][number]["referenceLocator"],
): URL => {
  const urlMap: Record<PackageType, string> = {
    pypi: `https://pypi.org/project/${pkgName}/${version}`,
    npm: `https://www.npmjs.com/package/${pkgName}/v/${version}`,
    github: `https://github.com/${pkgName}`,
    githubactions: `https://github.com/${pkgName}`,
  };

  const pkgType = Object.keys(urlMap).find((key) =>
    purl.startsWith(`pkg:${key}/`),
  );

  return pkgType ? new URL(urlMap[pkgType as PackageType]) : new URL(purl);
};
