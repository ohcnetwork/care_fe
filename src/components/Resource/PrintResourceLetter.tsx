import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildResourceLetterPrintContent } from "@/components/Resource/resourceLetterPrintData";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import resourceRequestApi from "@/types/resourceRequest/resourceRequestApi";
import query from "@/Utils/request/query";

export default function PrintResourceLetter({ id }: { id: string }) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();

  const { data, isLoading } = useQuery({
    queryKey: ["resource_request_letter", id],
    queryFn: query(resourceRequestApi.get, {
      pathParams: { resourceRequestId: id },
    }),
  });

  if (isLoading || !data) {
    return <PrintLoading />;
  }

  return (
    <TypstPrintPreview
      template="resource-letter"
      title={t("request_letter")}
      content={buildResourceLetterPrintContent({ request: data, t })}
      facility={facility}
      templateSlug={PrintTemplateType.resource_letter}
    />
  );
}
