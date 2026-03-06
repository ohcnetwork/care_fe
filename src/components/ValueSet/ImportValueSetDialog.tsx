import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { ValidationResults } from "@/components/ValueSet/ValidationResults";

import { FHIRValueSet } from "@/types/valueSet/fhir";
import { ValueSetRead } from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import {
  fromFHIRValueSet,
  parseFHIRValueSetFile,
} from "@/Utils/fhir/valueSetMapper";
import { validateFHIRValueSet } from "@/Utils/fhir/fhirValidator";
import mutate from "@/Utils/request/mutate";

export function ImportValueSetDialog() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fhirValueSet, setFhirValueSet] = useState<FHIRValueSet | null>(null);
  const [validationResult, setValidationResult] = useState<ReturnType<
    typeof validateFHIRValueSet
  > | null>(null);

  const importMutation = useMutation({
    mutationFn: mutate(valueSetApi.create),
    onSuccess: (data: ValueSetRead) => {
      toast.success(t("valueset_imported_successfully"));
      queryClient.invalidateQueries({ queryKey: ["valuesets"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(t("import_failed") + ": " + error.message);
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t("file_too_large"));
      return;
    }

    // Check file type
    if (!selectedFile.name.endsWith(".json")) {
      toast.error(t("invalid_file_type"));
      return;
    }

    setFile(selectedFile);

    try {
      // Parse the file
      const parsed = await parseFHIRValueSetFile(selectedFile);
      setFhirValueSet(parsed);

      // Validate
      const validation = validateFHIRValueSet(parsed);
      setValidationResult(validation);
    } catch (error) {
      toast.error(t("failed_to_parse_file"));
      setFile(null);
      setFhirValueSet(null);
      setValidationResult(null);
    }
  };

  const handleImport = () => {
    if (!fhirValueSet || !validationResult?.isValid) return;

    try {
      const careValueSet = fromFHIRValueSet(fhirValueSet);
      importMutation.mutate(careValueSet);
    } catch (error) {
      toast.error(t("conversion_failed"));
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setFhirValueSet(null);
    setValidationResult(null);
  };

  const canImport =
    fhirValueSet && validationResult?.isValid && !importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4 mr-2" />
          {t("import_fhir")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("import_valueset_from_fhir")}</DialogTitle>
          <DialogDescription>
            {t("import_valueset_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={importMutation.isPending}
            />
            <p className="text-sm text-gray-500 mt-2">
              {t("max_file_size")}: 10MB
            </p>
          </div>

          {file && (
            <div className="text-sm">
              <p className="font-medium">{t("selected_file")}:</p>
              <p className="text-gray-600">{file.name}</p>
            </div>
          )}

          {fhirValueSet && (
            <div className="space-y-2">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">{t("valueset_preview")}</h4>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="font-medium inline">{t("id")}:</dt>
                    <dd className="inline ml-2">{fhirValueSet.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">{t("name")}:</dt>
                    <dd className="inline ml-2">
                      {fhirValueSet.title || fhirValueSet.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">{t("status")}:</dt>
                    <dd className="inline ml-2">{fhirValueSet.status}</dd>
                  </div>
                  {fhirValueSet.version && (
                    <div>
                      <dt className="font-medium inline">{t("version")}:</dt>
                      <dd className="inline ml-2">{fhirValueSet.version}</dd>
                    </div>
                  )}
                  {fhirValueSet.description && (
                    <div>
                      <dt className="font-medium inline">
                        {t("description")}:
                      </dt>
                      <dd className="inline ml-2">{fhirValueSet.description}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {validationResult && (
            <ValidationResults validation={validationResult} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport}
            className="gap-2"
          >
            {importMutation.isPending ? t("importing") : t("import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
