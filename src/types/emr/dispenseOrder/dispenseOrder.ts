// status
export enum DispenseOrderStatus {
  draft = "draft",
  in_progress = "in_progress",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export interface DispenseOrder {
  status: DispenseOrderStatus;
  name: string;
  note: string;
  created_date: string;
  modified_date: string;
}

export interface DispenseOrderCreate extends DispenseOrder {
  name: string;
  note: string;
  status: DispenseOrderStatus;
}

export interface DispenseOrderUpdate extends DispenseOrder {
  id: string;
  name: string;
  note: string;
  status: DispenseOrderStatus;
}

export interface DispenseOrderRetrieve extends DispenseOrder {
  id: string;
}
