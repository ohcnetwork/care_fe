export type Status = "planned" | "active" | "reserved" | "completed";

export interface LocationEncounterCreate {
  status: Status;
  encounter: string;
  start_datetime: string;
  end_datetime?: string;
}
