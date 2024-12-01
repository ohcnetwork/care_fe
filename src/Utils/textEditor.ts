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

  // Create a hidden div to measure text
  const div = document.createElement("div");
  const span = document.createElement("span");

  // Copy textarea styles to div
  const style = window.getComputedStyle(element);
  div.style.cssText = style.cssText;
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";

  // Add text content
  div.textContent = element.value.substring(0, start);
  span.textContent = "."; // Marker for position
  div.appendChild(span);

  document.body.appendChild(div);
  const coordinates = span.getBoundingClientRect();
  document.body.removeChild(div);

  return {
    top: coordinates.top + window.scrollY,
    left: coordinates.left + window.scrollX,
  };
};
