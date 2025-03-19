export interface FileUploadQuestion {
  original_name: string;
  file_data: string; // base64 encoded file data
  name: string;
  associating_id: string;
  file_type: string;
  file_category: string;
}
