import { pdfjs } from "react-pdf";

// Configures the pdf.js worker for react-pdf. Import this module once in any
// component that renders react-pdf's <Document>/<Page>.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
