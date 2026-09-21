/** @jsxImportSource react */
import { ReactNode, useEffect, useRef } from "react";

import { getPrintPage } from "@/Utils/print";
import type { PageConfig, PrintTemplate } from "@/types/facility/printTemplate";

interface PrintPageProps {
  template?: PrintTemplate;
  defaultPage?: PageConfig;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/** Repeating table sections reserve space so clinical content cannot overlap branding. */
export function PrintPage({
  template,
  defaultPage,
  header,
  footer,
  children,
}: PrintPageProps) {
  const page = getPrintPage(template, defaultPage);
  const layoutRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = footerRef.current;
    if (!node) return;
    const measure = () => {
      layoutRef.current?.style.setProperty(
        "--print-footer-height",
        `${node.offsetHeight}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("beforeprint", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", measure);
    };
  }, [footer]);

  return (
    <div
      ref={layoutRef}
      className="print-page"
      style={{ minHeight: `${page.contentHeight}mm` }}
    >
      <style>{page.style}</style>
      <table className="print-page-table" role="presentation">
        <thead>
          <tr>
            <td>{header}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="print-page-content">{children}</td>
          </tr>
        </tbody>
        {footer && (
          <tfoot aria-hidden="true">
            <tr>
              <td>
                <div className="print-footer-spacer" />
              </td>
            </tr>
          </tfoot>
        )}
      </table>
      {footer && (
        <div ref={footerRef} className="print-page-footer">
          {footer}
        </div>
      )}
    </div>
  );
}
