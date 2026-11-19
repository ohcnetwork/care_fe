/**
 * Data contract with src/print/typst/care.typ. Fields are snake_case because
 * Typst reads the JSON directly; optional values are `null`, never omitted.
 */

export type TypstPaper = "a4" | "a5" | "us-letter" | "us-legal";

export interface PrintImage {
  path: string;
  /** Maximum height in CSS px. */
  max_height: number | null;
}

export interface PrintLogo {
  path: string;
  /** In CSS px. With neither width nor height, the logo is 40px tall. */
  width: number | null;
  height: number | null;
  alignment: "left" | "center" | "right";
}

export interface PrintFacility {
  name: string;
  address: string | null;
  phone: string | null;
}

export interface StatusWatermark {
  text: string;
  color?: "red" | "gray" | "yellow";
}

export interface PrintLayout {
  title: string;
  page: {
    paper: TypstPaper;
    flipped: boolean;
    /** In millimetres. */
    margin: { top: number; right: number; bottom: number; left: number };
  };
  header: {
    hidden: boolean;
    image: PrintImage | null;
    logo: PrintLogo | null;
    facility: PrintFacility;
  } | null;
  footer_image: PrintImage | null;
  watermark: { text: string; opacity: number; rotation: number } | null;
  status_watermark: Required<StatusWatermark> | null;
  labels: {
    /** Contains `{current}` and `{total}`. */
    page_x_of_y: string;
  };
}

/** What a template receives as `json("/data.json")`. */
export interface PrintDocument<TContent> {
  layout: PrintLayout;
  content: TContent;
}
