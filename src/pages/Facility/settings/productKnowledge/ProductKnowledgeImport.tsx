import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import { ProductKnowledgeImportForm } from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeImportForm";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface Props {
  facilityId: string;
}

export default function ProductKnowledgeImport({ facilityId }: Props) {
  const { t } = useTranslation();

  const { mutate: upsert, isPending } = useMutation({
    mutationFn: mutate(productKnowledgeApi.upsertProductKnowledge),
    onSuccess: () => {
      toast.success(t("imported_successfully"));
    },
  });

  return (
    <Page title={t("bulk_import_product_knowledge")}>
      <p className="text-gray-700 py-1">
        {t("bulk_import_product_knowledge_description")}
      </p>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto relative">
          {isPending ? (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <Loading />
                <p className="text-gray-700">
                  {t("uploading_product_knowledge")}
                </p>
              </div>
            </div>
          ) : (
            <ProductKnowledgeImportForm
              facilityId={facilityId}
              onCsvParsed={(data) => upsert({ datapoints: data })}
            />
          )}
        </div>
      </div>
    </Page>
  );
}
