import { forIn } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import ExcelViewer from "@/components/Common/ExcelViewer";

import useDragAndDrop from "@/hooks/useDragAndDrop";

import schemaParser, {
  ErrorData,
  ParsedData,
  SchemaType,
} from "@/common/schemaParser";

import * as Notification from "@/Utils/Notifications";

interface Props {
  handleSubmit: (data: any) => void;
  loading: boolean;
  sampleLink?: string;
  schema: SchemaType;
  onClose?: () => void;
  setIsValid?: (value: boolean) => void;
}

export default function ExcelFileDragAndDrop({
  handleSubmit,
  loading = false,
  sampleLink,
  schema,
  onClose,
  setIsValid,
}: Props) {
  const [fileData, setFileData] = useState<any>([]);
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [preview, setPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>();
  const [validData, setValidData] = useState<ParsedData[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData[]>([]);

  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setSelectedFile(undefined);
    setFileData([]);
    onClose && onClose();
  };

  const onSelectFile = (file: Blob) => {
    setSelectedFile(file);
    dragProps.setFileDropError("");
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = (e.target as FileReader).result;
        const workbook = XLSX.read(result, {
          type: "binary",
          cellDates: true,
        });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        //converts the date to string
        data.forEach((row: any) => {
          forIn(row, (value: any, key: string) => {
            if (value instanceof Date) {
              row[key] = value.toISOString().split("T")[0];
            }
          });
        });

        setFileData(data);
      };
      reader.onerror = () => {
        throw new Error("Error in reading file");
      };

      reader.readAsBinaryString(file);
    } catch (e: any) {
      Notification.Error({
        msg: e.message,
      });
    }
  };

  useEffect(() => {
    if (fileData.length !== 0) {
      const { errors, parsedData, ParsedDataWithOutErrors } = schemaParser(
        fileData,
        schema,
      );
      setErrors(errors);
      setParsedData(parsedData);
      setValidData(ParsedDataWithOutErrors);
      if (ParsedDataWithOutErrors.length !== 0) {
        setIsValid && setIsValid(true);
      }
    }
  }, [fileData]);

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);

    const droppedFiles = e?.dataTransfer?.files;

    if (!droppedFiles || droppedFiles.length === 0) {
      return dragProps.setFileDropError("Please drop a file to upload!");
    }

    const droppedFile = droppedFiles[0];
    const fileTypes = [
      "vnd.ms-excel",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!fileTypes.includes(droppedFile?.type)) {
      dragProps.setFileDropError("Please drop a Excel / CSV file to upload!");
      setSelectedFile(null);
      return;
    }
    onSelectFile(droppedFile);
  };

  return (
    <div>
      {preview && (
        <ExcelViewer
          show={preview}
          onClose={() => setPreview(false)}
          selectedFile={selectedFile}
          fileData={fileData}
          errors={errors}
          handleSubmit={handleSubmit}
          parsedData={parsedData}
        />
      )}
      <div
        onDragOver={dragProps.onDragOver}
        onDragLeave={dragProps.onDragLeave}
        onDrop={onDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`mb-8 mt-5 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6 ${
          dragProps.dragOver ? "border-primary-500" : "border-secondary-500"
        } ${dragProps.fileDropError !== "" ? "border-red-500" : ""}`}
      >
        <svg
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-12 w-12 ${dragProps.dragOver && "text-primary-500"} ${
            dragProps.fileDropError !== ""
              ? "text-red-500"
              : "text-secondary-600"
          }`}
        >
          <path d="M12.71,11.29a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-2,2a1,1,0,0,0,1.42,1.42l.29-.3V17a1,1,0,0,0,2,0V14.41l.29.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42ZM20,8.94a1.31,1.31,0,0,0-.06-.27l0-.09a1.07,1.07,0,0,0-.19-.28h0l-6-6h0a1.07,1.07,0,0,0-.28-.19l-.1,0A1.1,1.1,0,0,0,13.06,2H7A3,3,0,0,0,4,5V19a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V9S20,9,20,8.94ZM14,5.41,16.59,8H15a1,1,0,0,1-1-1ZM18,19a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V5A1,1,0,0,1,7,4h5V7a3,3,0,0,0,3,3h3Z" />
        </svg>
        <p
          className={`text-sm ${dragProps.dragOver && "text-primary-500"} ${
            dragProps.fileDropError !== ""
              ? "text-red-500"
              : "text-secondary-700"
          } text-center`}
        >
          {dragProps.fileDropError !== "" && dragProps.fileDropError}
          {!selectedFile && "Drag & drop xlsx/csv file to upload"}
        </p>
        <input
          data-testid="import-file"
          type="file"
          accept=".csv, .xlsx"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onSelectFile(files[0]);
            }
          }}
          className="hidden"
          ref={fileInputRef}
        />
        {selectedFile && (
          <div className="flex pt-2">
            <p className="text-sm text-secondary-700">
              {selectedFile.name} - {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <span
              className="cursor-pointer px-5 text-sm text-primary-500"
              onClick={() => {
                setSelectedFile(undefined);
                setFileData([]);
                setErrors([]);
                setValidData([]);
                setIsValid && setIsValid(false);
                dragProps.setDragOver(false);
                dragProps.setFileDropError("");
              }}
            >
              cancel
            </span>
          </div>
        )}
        {selectedFile ? (
          <>
            <span
              className="focus:ring-blue mx-auto mt-4 max-w-xs cursor-pointer items-center rounded-md border border-primary-500 bg-white px-3 py-2 text-sm font-medium leading-4 text-primary-700 transition duration-150 ease-in-out hover:text-primary-500 hover:shadow focus:border-primary-300 focus:outline-none active:bg-secondary-50 active:text-primary-800"
              onClick={() => setPreview(true)}
            >
              <CareIcon
                icon="l-arrow-up-right"
                className="mr-1 text-lg"
                aria-hidden="true"
              />{" "}
              preview
            </span>
          </>
        ) : (
          <a
            className="focus:ring-blue mx-auto mt-4 max-w-xs items-center rounded-md border border-primary-500 bg-white px-3 py-2 text-sm font-medium leading-4 text-primary-700 transition duration-150 ease-in-out hover:text-primary-500 hover:shadow focus:border-primary-300 focus:outline-none active:bg-secondary-50 active:text-primary-800"
            href={sampleLink}
            target="_blank"
            download
            onClick={(e) => e.stopPropagation()}
          >
            <CareIcon
              icon="l-download-alt"
              className="mr-1 text-lg"
              aria-hidden="true"
            />{" "}
            <span>{t("sample_format")}</span>
          </a>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label
          className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-500 transition-all hover:border-primary-400 hover:text-primary-400"
          onClick={() => fileInputRef.current?.click()}
        >
          <CareIcon icon="l-cloud-upload" className="mr-2 text-lg" />
          Upload a file
        </label>
        <div className="sm:flex-1" />
        <Cancel
          onClick={() => {
            closeModal();
            setErrors([]);
            setValidData([]);
            dragProps.setDragOver(false);
            dragProps.setFileDropError("");
          }}
          disabled={loading}
        />
        <Submit
          data-testid="import-btn"
          onClick={() => handleSubmit(validData)}
          disabled={loading || !selectedFile || validData.length === 0}
        >
          {loading ? (
            <CareIcon icon="l-spinner" className="animate-spin text-lg" />
          ) : (
            <CareIcon icon="l-file-import" className="text-lg" />
          )}
          <span>
            {loading
              ? "Importing..."
              : `Import ${validData.length} valid fields`}
          </span>
        </Submit>
      </div>
    </div>
  );
}
