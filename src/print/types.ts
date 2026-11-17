/**
 * Data contract between the app and the Typst library (src/print/typst/care.typ).
 * Field names are snake_case because Typst reads them directly from JSON.
 * Optional values are `null` (Typst's `none`), never omitted.
 */

export type TypstPaper = "a4" | "a5" | "us-letter" | "us-legal";

export interface PrintImage {
  /** Path of the image inside the compiler's virtual file system. */
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
  /** PDF title. */
  title: string;
  /** ISO 639 language code, used for hyphenation. */
  lang: string;
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
