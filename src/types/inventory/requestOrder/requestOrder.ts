// status
export enum RequestOrderStatus {
  draft = "draft",
  in_progress = "in_progress",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export interface RequestOrder {
  status: RequestOrderStatus;
  name: string;
  note: string;
  created_date: string;
  modified_date: string;
}

export interface RequestOrderCreate extends RequestOrder {
  name: string;
  note: string;
  status: RequestOrderStatus;
}

export interface RequestOrderUpdate extends RequestOrder {
  id: string;
  name: string;
  note: string;
  status: RequestOrderStatus;
}

export interface RequestOrderRetrieve extends RequestOrder {
  id: string;
}
