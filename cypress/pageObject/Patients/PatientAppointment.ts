export interface ScheduleData {
  templateName: string;
  validFrom: string;
  validTill: string;
  weeklySchedule: string[];
  sessionTitle: string;
  startTime: string;
  endTime: string;
  autoFillSlot?: boolean;
  slotDuration: number;
  patientPerSlot: number;
  remarks?: string;
}

export class PatientAppointment {
  private selectors = {};
}
