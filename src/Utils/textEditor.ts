/**
 * Gets the caret position and surrounding text from a textarea
 */
export const getCaretInfo = (element: HTMLTextAreaElement) => {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const text = element.value;

  return {
    start,
    end,
    beforeCaret: text.substring(0, start),
    selection: text.substring(start, end),
    afterCaret: text.substring(end),
  };
};

/**
 * Gets the screen coordinates of the caret in a textarea
 */
export const getCaretCoordinates = (element: HTMLTextAreaElement) => {
  const { start } = getCaretInfo(element);
  const styles = window.getComputedStyle(element);
  const textareaRect = element.getBoundingClientRect();
  const mirror = document.createElement("div");
  mirror.style.cssText = [
    "position: fixed",
    "visibility: hidden",
    `width: ${element.offsetWidth}px`,
    `white-space: ${styles.whiteSpace}`,
    `font-family: ${styles.fontFamily}`,
    `font-size: ${styles.fontSize}`,
    `line-height: ${styles.lineHeight}`,
    `padding: ${styles.padding}`,
    `top: ${window.scrollY + textareaRect.top}px`,
    `left: ${window.scrollX + textareaRect.left}px`,
  ].join(";");

  mirror.textContent = element.value.substring(0, start);

  const marker = document.createElement("span");
  marker.textContent = "I";
  mirror.appendChild(marker);
  try {
    document.body.appendChild(mirror);
    const markerRect = marker.getBoundingClientRect();
    return {
      top: markerRect.top - textareaRect.top,
      left: markerRect.left - textareaRect.left,
    };
  } finally {
    if (mirror.parentNode) {
      document.body.removeChild(mirror);
    }
  }
};
