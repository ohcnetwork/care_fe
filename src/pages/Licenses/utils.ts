import { LicensesSbom, PackageType } from "@/types/license";

export const getPackageUrl = (
  pkgName: LicensesSbom["sbom"]["packages"][number]["name"],
  purl: LicensesSbom["sbom"]["packages"][number]["externalRefs"][number]["referenceLocator"],
): string => {
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
};
