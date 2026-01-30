import { HttpMethod, Type } from "@/Utils/request/types";

// Types for the Scribe API
export interface ScribeMetadata {
  patient_context: string;
  specialty: string;
  encounter_type: string;
}

export interface ScribeModelConfig {
  provider: string;
  model: string;
  parameters?: Record<string, unknown>;
}

export interface ScribeProcessResponse {
  transcript?: string;
  bundle?: Record<string, unknown>;
  status: string;
  message?: string;
}

// Types for Bundle Process API
export interface BundleProcessRequest {
  encounter: string;
  fail_on_error: boolean;
  bundle: Record<string, unknown>;
}

export interface BundleProcessResponse {
  success: boolean;
  message?: string;
  results?: Record<string, unknown>[];
}

// API route definitions
const scribeApi = {
  process: {
    path: "/api/v1/scribe/process/",
    method: HttpMethod.POST,
    TBody: Type<FormData>(),
    TRes: Type<ScribeProcessResponse>(),
  },
  processBundle: {
    path: "/api/v1/fhir/bundle/process/",
    method: HttpMethod.POST,
    TBody: Type<BundleProcessRequest>(),
    TRes: Type<BundleProcessResponse>(),
  },
} as const;

export default scribeApi;

// Helper function to create the FormData for scribe upload
export function createScribeFormData(
  audioBlob: Blob,
  options?: {
    metadata?: Partial<ScribeMetadata>;
    generationModel?: ScribeModelConfig;
    transcriptionModel?: ScribeModelConfig;
    validateBundle?: boolean;
    includeTranscript?: boolean;
  },
): FormData {
  const formData = new FormData();

  // Add audio file
  formData.append("audio", audioBlob, "recording.webm");

  // Add metadata with defaults
  const metadata: ScribeMetadata = {
    patient_context:
      options?.metadata?.patient_context ||
      "Patient presenting for consultation",
    specialty: options?.metadata?.specialty || "general-medicine",
    encounter_type: options?.metadata?.encounter_type || "outpatient",
  };
  formData.append("metadata", JSON.stringify(metadata));

  // Add generation model config
  const generationModel: ScribeModelConfig = options?.generationModel || {
    provider: "openai",
    model: "gpt-5.2",
    parameters: { temperature: 0.3 },
  };
  formData.append("generation_model", JSON.stringify(generationModel));

  // Add transcription model config
  const transcriptionModel: ScribeModelConfig = options?.transcriptionModel || {
    provider: "openai",
    model: "whisper-1",
  };
  formData.append("transcription_model", JSON.stringify(transcriptionModel));

  // Add boolean flags
  formData.append("validate_bundle", String(options?.validateBundle ?? true));
  formData.append(
    "include_transcript",
    String(options?.includeTranscript ?? true),
  );

  return formData;
}
