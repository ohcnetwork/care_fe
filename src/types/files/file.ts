import { UserReadMinimal } from "@/types/user/user";

export enum FileCategory {
  UNSPECIFIED = "unspecified",
  XRAY = "xray",
  AUDIO = "audio",
  IDENTITY_PROOF = "identity_proof",
  CONSENT_ATTACHMENT = "consent_attachment",
  DISCHARGE_SUMMARY = "discharge_summary",
}

export enum FileType {
  PATIENT = "patient",
  ENCOUNTER = "encounter",
  CONSENT = "consent",
  DIAGNOSTIC_REPORT = "diagnostic_report",
  SERVICE_REQUEST = "service_request",
}

export interface FileBase {
  name: string;
  file_type: FileType;
  file_category: FileCategory;
  associating_id: string;
  mime_type: string;
}

export interface FileCreate extends FileBase {
  original_name: string;
}

export interface FileUploadQuestion extends Omit<FileCreate, "mime_type"> {
  file_data: File;
}

export interface FileUpdate {
  id: string;
  name: string;
}

export interface FileReadMinimal extends FileBase {
  id: string;
  archived_by: UserReadMinimal;
  archived_datetime: string;
  upload_completed: boolean;
  is_archived?: boolean;
  archive_reason?: string;
  created_date: string;
  uploaded_by: UserReadMinimal;
  extension: string;
}

export interface FileRead extends FileReadMinimal {
  signed_url: string;
  read_signed_url: string;
  internal_name: string;
}

export const DEFAULT_ALLOWED_EXTENSIONS = [
  "image/*",
  "video/*",
  "audio/*",
  "text/plain",
  "text/csv",
  "application/rtf",
  "application/msword",
  "application/vnd.oasis.opendocument.text",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet,application/pdf",
];

export const BACKEND_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "mp4",
  "mov",
  "avi",
  "wmv",
  "mp3",
  "wav",
  "ogg",
  "txt",
  "csv",
  "rtf",
  "doc",
  "odt",
  "pdf",
  "xls",
  "xlsx",
  "ods",
];

export const FILE_EXTENSIONS = {
  IMAGE: ["jpeg", "jpg", "png", "gif", "svg", "bmp", "webp", "jfif"],
  AUDIO: ["mp3", "wav"],
  VIDEO: [
    "webm",
    "mpg",
    "mp2",
    "mpeg",
    "mpe",
    "mpv",
    "ogg",
    "mp4",
    "m4v",
    "avi",
    "wmv",
    "mov",
    "qt",
    "flv",
    "swf",
    "mkv",
  ],
  PRESENTATION: ["pptx"],
  DOCUMENT: ["pdf", "docx"],
} as const;

export const PREVIEWABLE_FILE_EXTENSIONS = [
  "html",
  "htm",
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  ...FILE_EXTENSIONS.VIDEO,
] as const;

export const getVideoMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    flv: "video/x-flv",
    mpg: "video/mpeg",
    mp2: "video/mpeg",
    mpeg: "video/mpeg",
    mpe: "video/mpeg",
    mpv: "video/mpeg",
    ogg: "video/ogg",
    swf: "video/x-shockwave-flash",
    wmv: "video/x-ms-wmv",
    m4v: "video/mp4",
    m4a: "audio/mp4",
    m4b: "audio/mp4",
    m4p: "audio/mp4",
  };

  return mimeTypes[extension] || `video/${extension}`;
};
