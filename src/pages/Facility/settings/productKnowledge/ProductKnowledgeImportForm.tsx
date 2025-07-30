import { Download, FileText, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Trans, useTranslation } from "react-i18next";

import { parseCsvToProductKnowledge } from "@/lib/productKnowledge/csv-parser";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ProductKnowledgeCreate } from "@/types/inventory/productKnowledge/productKnowledge";

interface Props {
  facilityId: string;
  onCsvParsed: (data: ProductKnowledgeCreate[]) => void;
}

export function ProductKnowledgeImportForm({ facilityId, onCsvParsed }: Props) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);
      setError(null);

      try {
        const text = await file.text();
        const parsedData = parseCsvToProductKnowledge(text, {
          facility: facilityId,
        });
        onCsvParsed(parsedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse CSV file",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onCsvParsed, facilityId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  const downloadTemplate = () => {
    const csvContent = `name,slug,product_type,status,code_code,code_display,code_system
Zinc 25 mg oral capsule,zinc-25mg-capsule,nutritional_product,active,417720003,Zinc 25 mg oral capsule,http://snomed.info/sct
Vitamin D3 1000 IU,vitamin-d3-1000iu,nutritional_product,active,123456789,Vitamin D3 1000 IU,http://snomed.info/sct`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-knowledge-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-5" />
            {t("download_template")}
          </CardTitle>
          <CardDescription>
            {t("download_csv_template_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="size-4 mr-2" />
            {t("download_csv_template")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            {t("upload_csv_file")}
          </CardTitle>
          <CardDescription>{t("upload_csv_file_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <FileText className="size-8 text-gray-500" />
              </div>
              {isDragActive ? (
                <p className="text-lg">{t("drop_csv_file_here")}</p>
              ) : (
                <div className="space-y-2">
                  <Trans
                    i18nKey="drag_and_drop_csv_file_here"
                    components={{
                      p: <p className="text-lg" />,
                      p2: <p className="text-sm text-gray-500" />,
                    }}
                  />
                </div>
              )}
              {isProcessing && (
                <p className="text-sm text-primary">{t("processing_file")}</p>
              )}
            </div>
          </div>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("csv_format_requirements")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t("required_columns")}:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {[
                { key: "name", label: t("product_name") },
                { key: "slug", label: t("url_friendly_identifier") },
                { key: "product_type", label: t("product_type_description") },
                { key: "status", label: t("product_status_active_inactive") },
                { key: "facility", label: t("facility_id") },
              ].map(({ key, label }) => (
                <li key={key}>
                  • <code>{key}</code> - {label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("optional_columns")}:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • <code>code_code</code>, <code>code_display</code>,{" "}
                <code>code_system</code> - {t("product_code_information")}
              </li>
            </ul>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <Trans
                i18nKey="product_knowledge_csv_import_note"
                components={{
                  strong: <strong />,
                }}
              />
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
