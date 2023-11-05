export interface NotificationData {
  // Define the properties you expect in the notification data
  id: number;
  title: string;
  caused_objects: cause_object;
  caused_by: any;
  content: string;
  offset: number;
  event: string;
  event_type: string;
  medium_sent: string;
  created_date: string;
  read_at: string;
  message: string;
  pf_auth: string;
  pf_endpoint: string;
  pf_p256dh: string;
  // Add other properties as needed
}

export interface NotificationResponse {
  // Define the structure of the response from the API
  results: NotificationData[];
  count: number;
}

export interface cause_object {
  facility: string;
  patient: string;
  consultation: string;
  daily_round: string;
  session: string;
}

export interface MarkNotificationAsReadRequest {
  // Define the request body for marking a notification as read
  id: number;
}
