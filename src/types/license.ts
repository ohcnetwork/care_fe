export interface LicensesSbom {
  sbom: {
    spdxVersion: string;
    dataLicense: string;
    SPDXID: string;
    name: string;
    documentNamespace: string;
    creationInfo: {
      creators: string[];
      created: string;
    };
    packages: {
      name: string;
      SPDXID: string;
      versionInfo: string;
      downloadLocation: string;
      filesAnalyzed: boolean;
      licenseConcluded?: string;
      copyrightText?: string;
      externalRefs: {
        referenceCategory: string;
        referenceType: string;
        referenceLocator: string;
      }[];
      licenseDeclared?: string;
    }[];
    relationships: {
      spdxElementId: string;
      relatedSpdxElement: string;
      relationshipType: string;
    }[];
  };
}
