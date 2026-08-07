import { callApi } from "@/Utils/request/query";
import { FileUploadQuestion } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

/**
 * Uploads questionnaire file answers through CARE's multipart endpoint.
 *
 * These cannot ride along in the batch request the rest of the questionnaire
 * uses: that body is JSON, and CARE no longer accepts a file as a base64
 * string. Each file is posted as its own `multipart/form-data` request before
 * the batch is submitted.
 */
export async function uploadQuestionnaireFiles(files: FileUploadQuestion[]) {
  return Promise.all(
    files.map((file) => {
      const body = new FormData();
      body.append("file", file.file_data);
      body.append("name", file.name);
      body.append("original_name", file.original_name);
      body.append("associating_id", file.associating_id);
      body.append("file_type", file.file_type);
      body.append("file_category", file.file_category);

      return callApi(fileApi.upload, { body });
    }),
  );
}
