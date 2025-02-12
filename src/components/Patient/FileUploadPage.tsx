import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { FileUpload } from "@/components/Files/FileUpload";

export default function FileUploadPage(props: {
  facilityId: string;
  patientId: string;
  encounterId?: string;
  type: "encounter" | "patient";
}) {
  const { patientId, encounterId, type } = props;
  const { t } = useTranslation();

  return (
    <Page title={t("patient_files")}>
      <FileUpload
        patientId={patientId}
        encounterId={encounterId}
        type={type}
        allowAudio={true}
      />
    </Page>
  );
}
