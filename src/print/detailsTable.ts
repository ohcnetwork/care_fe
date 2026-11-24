import type {
  PrintDetailRow,
  PrintPatientHeader,
} from "@/print/patientDetails";

export interface DetailsTablePrintContent {
  heading: string;
  /** Repeated at the top of pages after the first. */
  patient: PrintPatientHeader | null;
  patient_label: string;
  details: { left: PrintDetailRow[]; right: PrintDetailRow[] };
  title: string | null;
  note: string | null;
  table_title: string | null;
  table: {
    header: string[];
    rows: string[][];
    /** Per column: a share of the free width, or `null` to fit short content. */
    widths: (number | null)[];
  };
  footer: { left: string; right: string };
}
