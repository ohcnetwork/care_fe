// status
export enum DeliveryOrderStatus {
  draft = "draft",
  in_progress = "in_progress",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export interface DeliveryOrder {
  status: DeliveryOrderStatus;
  name: string;
  note: string;
  created_date: string;
  modified_date: string;
}

export interface DeliveryOrderCreate extends DeliveryOrder {
  name: string;
  note: string;
  status: DeliveryOrderStatus;
}

export interface DeliveryOrderUpdate extends DeliveryOrder {
  id: string;
  name: string;
  note: string;
  status: DeliveryOrderStatus;
}

export interface DeliveryOrderRetrieve extends DeliveryOrder {
  id: string;
}
