export interface NotificationData {
  id: string;
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
  public_key: string;
}

export interface cause_object {
  facility: string;
  patient: string;
  consultation: string;
  daily_round: string;
  session: string;
}

export interface PNconfigData {
  pf_auth: string;
  pf_endpoint: string;
  pf_p256dh: string;
}
