import { time } from "echarts";

export interface NotificationData {
  // Define the properties you expect in the notification data
  id: number;
  title: string;
  content: string;
  offset: number;
  event: string;
  medium_sent: string;
  timestamp: string;
  // Add other properties as needed
}

export interface NotificationResponse {
  // Define the structure of the response from the API
  data: NotificationData;
}

export interface MarkNotificationAsReadRequest {
  // Define the request body for marking a notification as read
  id: number;
}
