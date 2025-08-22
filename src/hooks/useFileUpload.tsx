import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import jsPDF from "jspdf";
import {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import AudioCaptureDialog from "@/components/Files/AudioCaptureDialog";
import CameraCaptureDialog from "@/components/Files/CameraCaptureDialog";

import mutate from "@/Utils/request/mutate";
import uploadFile from "@/Utils/request/uploadFile";
import {
  DEFAULT_ALLOWED_EXTENSIONS,
  FILE_EXTENSIONS,
  FileCategory,
  FileRead,
  FileReadMinimal,
  FileType,
} from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

export type FileUploadOptions = {
  multiple?: boolean;
  type: FileType;
  category?: FileCategory;
  onUpload?: (file: FileReadMinimal) => void;
  // if allowed, will fallback to the name of the file if a seperate filename is not defined.
  allowNameFallback?: boolean;
  compress?: boolean;
} & (
  | {
      allowedExtensions?: string[];
    }
  | {
      allowAllExtensions?: boolean;
    }
);

export type FileInputProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "id" | "title" | "type" | "accept" | "onChange"
> & {};

export type FileUploadReturn = {
  progress: null | number;
  error: null | string;
  setError: (error: string | null) => void;
  validateFiles: () => boolean;
  handleCameraCapture: () => void;
  handleAudioCapture: () => void;
  handleFileUpload: (
    associating_id: string,
    combineToPDF?: boolean,
  ) => Promise<void>;
  Dialogues: React.ReactNode;
  Input: (_: FileInputProps) => React.ReactNode;
  fileNames: string[];
  files: File[];
  setFileName: (names: string, index?: number) => void;
  setFileNames: (names: string[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  uploading: boolean;
  previewing?: boolean;
};

export default function useFileUpload(
  options: FileUploadOptions,
): FileUploadReturn {
  const {
    type: fileType,
    onUpload,
    category = FileCategory.UNSPECIFIED,
    multiple,
    allowNameFallback = true,
  } = options;

  const { t } = useTranslation();

  const [uploadFileNames, setUploadFileNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<null | number>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const generatePDF = async (files: File[]): Promise<File | null> => {
    try {
      toast.info(t("file_conversion_in_progress"));
      const pdf = new jsPDF();
      const totalFiles = files.length;

      for (const [index, file] of files.entries()) {
        const imgData = URL.createObjectURL(file);
        pdf.addImage(imgData, "JPEG", 10, 10, 190, 0);
        URL.revokeObjectURL(imgData);
        if (index < files.length - 1) pdf.addPage();
        const progress = Math.round(((index + 1) / totalFiles) * 100);
        setProgress(progress);
      }
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], "combined.pdf", {
        type: "application/pdf",
      });
      setProgress(0);
      toast.success(t("file_conversion_success"));
      return pdfFile;
    } catch (error) {
      toast.error(t("file_error__generate_pdf"));
      setError(t("file_error__generate_pdf", { error: String(error) }));
      setProgress(0);
      return null;
    }
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>): any => {
    if (!e.target.files?.length) {
      return;
    }
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (options.compress) {
      selectedFiles.forEach((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && (FILE_EXTENSIONS.IMAGE as readonly string[]).includes(ext)) {
          const options = {
            initialQuality: 0.6,
            alwaysKeepResolution: true,
          };
          imageCompression(file, options).then((compressedFile: File) => {
            setFiles((prev) =>
              prev.map((f) => (f.name === file.name ? compressedFile : f)),
            );
          });
        }
      });
    }
  };

  useEffect(() => {
    const blanks = Array(files.length).fill("");
    setUploadFileNames((names) => [...names, ...blanks].slice(0, files.length));
  }, [files]);

  const validateFileUpload = () => {
    if (files.length === 0) {
      setError(t("file_error__choose_file"));
      return false;
    }

    for (const file of files) {
      const filenameLength = file.name.trim().length;
      if (filenameLength === 0) {
        setError(t("file_error__file_name"));
        return false;
      }
      if (file.size > 10e7) {
        setError(t("file_error__file_size"));
        return false;
      }
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (
        "allowedExtensions" in options &&
        !options.allowedExtensions
          ?.map((extension) => extension.replace(".", "").toLowerCase())
          ?.includes(extension || "")
      ) {
        setError(
          t("file_error__file_type", {
            extension,
            allowedExtensions: options.allowedExtensions?.join(", "),
          }),
        );
        return false;
      }
    }
    return true;
  };
  const { mutateAsync: markUploadComplete, error: markUploadCompleteError } =
    useMutation({
      mutationFn: (fileId: string) =>
        mutate(fileApi.markUploadCompleted, {
          pathParams: { fileId },
        })(undefined),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["files", fileType, data.associating_id],
        });
        toast.success(t("file_uploaded"));
        setError(null);
        onUpload?.(data);
      },
    });

  const uploadfile = async (data: FileRead, file: File) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;
    const newFile = new File([file], `${internal_name}`);

    return new Promise<void>((resolve, reject) => {
      uploadFile(
        url,
        newFile,
        "PUT",
        { "Content-Type": file.type },
        async (xhr: XMLHttpRequest) => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(null);
            await markUploadComplete(data.id);
            if (markUploadCompleteError) {
              toast.error(t("file_error__mark_complete_failed"));
              reject();
              return;
            }
            resolve();
          } else {
            toast.error(
              t("file_error__dynamic", { statusText: xhr.statusText }),
            );
            setProgress(null);
            reject();
          }
        },
        setProgress as any,
        () => {
          toast.error(t("file_error__network"));
          setProgress(null);
          reject();
        },
      );
    });
  };

  const { mutateAsync: createUpload } = useMutation({
    mutationFn: mutate(fileApi.create),
  });

  const handleUpload = async (
    associating_id: string,
    combineToPDF?: boolean,
  ) => {
    if (combineToPDF && "allowedExtensions" in options) {
      options.allowedExtensions = ["jpg", "png", "jpeg"];
    }
    if (!validateFileUpload()) return;

    setProgress(0);
    const errors: File[] = [];
    if (combineToPDF) {
      if (!uploadFileNames.length || !uploadFileNames[0]) {
        setError(t("file_error__single_file_name"));
        return;
      }
    } else {
      for (const [index, file] of files.entries()) {
        const filename =
          allowNameFallback && uploadFileNames[index] === "" && file
            ? file.name
            : uploadFileNames[index];
        if (!filename.trim()) {
          setError(t("file_error__single_file_name"));
          return;
        }
      }
    }

    if (combineToPDF && files.length > 1) {
      const pdfFile = await generatePDF(files);
      if (pdfFile) {
        files.splice(0, files.length, pdfFile);
      } else {
        clearFiles();
        setError(t("file_error__generate_pdf"));
        return;
      }
    }

    setUploading(true);

    for (const [index, file] of files.entries()) {
      try {
        const data = await createUpload({
          original_name: file.name ?? "",
          file_type: fileType as FileType,
          name:
            allowNameFallback && uploadFileNames[index] === "" && file
              ? file.name
              : uploadFileNames[index],
          associating_id,
          file_category: category,
          mime_type: file.type ?? "",
        });

        if (data) {
          await uploadfile(data, file);
        }
      } catch {
        errors.push(file);
      }
    }

    setUploading(false);
    setFiles(errors);
    setUploadFileNames(errors?.map((f) => f.name) ?? []);
    setError(t("file_error__network"));
    setCameraModalOpen(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
    setUploadFileNames([]);
  };

  const Dialogues = (
    <>
      <CameraCaptureDialog
        open={cameraModalOpen}
        onOpenChange={(open) => setCameraModalOpen(open)}
        onCapture={(file) => {
          setFiles((prev) => [...prev, file]);
        }}
        onResetCapture={clearFiles}
        setPreview={setPreviewing}
      />
      <AudioCaptureDialog
        show={audioModalOpen}
        onHide={() => setAudioModalOpen(false)}
        onCapture={(file) => {
          setFiles((prev) => [...prev, file]);
        }}
        autoRecord
      />
    </>
  );

  const Input = (props: FileInputProps) => (
    <input
      {...props}
      data-cy="upload-files-input"
      id={`file_upload_${fileType}`}
      title={t("change_file")}
      onChange={onFileChange}
      type="file"
      multiple={multiple}
      accept={
        "allowedExtensions" in options
          ? options.allowedExtensions?.map((e) => "." + e).join(",")
          : "allowAllExtensions" in options
            ? "*"
            : DEFAULT_ALLOWED_EXTENSIONS.join(",")
      }
      hidden={props.hidden || true}
    />
  );

  return {
    progress,
    error,
    setError,
    validateFiles: validateFileUpload,
    handleCameraCapture: () => setCameraModalOpen(true),
    handleAudioCapture: () => setAudioModalOpen(true),
    handleFileUpload: handleUpload,
    Dialogues,
    Input,
    fileNames: uploadFileNames,
    files: files,
    setFileNames: setUploadFileNames,
    setFileName: (name: string, index = 0) => {
      setUploadFileNames((prev) =>
        prev.map((n, i) => (i === index ? name : n)),
      );
    },
    removeFile: (index = 0) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setUploadFileNames((prev) => prev.filter((_, i) => i !== index));
    },
    clearFiles,
    uploading,
    previewing,
  };
}
