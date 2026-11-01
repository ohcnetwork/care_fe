interface ScrollFillQuestionOptions {
  container?: HTMLElement | null;
  block?: "start" | "center";
}

function isVerticalScrollport(element: HTMLElement) {
  return ["auto", "scroll", "overlay"].includes(
    getComputedStyle(element).overflowY,
  );
}

function nearestScrollport(block: HTMLElement) {
  let parent = block.parentElement;
  while (
    parent &&
    parent !== document.body &&
    parent !== document.documentElement
  ) {
    if (isVerticalScrollport(parent)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

/** Keep form jumps inside the canvas rather than scrolling clipped app frames. */
export function scrollFillQuestionIntoView(
  question: HTMLElement,
  {
    container: preferredContainer,
    block = "start",
  }: ScrollFillQuestionOptions = {},
) {
  const container = preferredContainer
    ? preferredContainer.contains(question) &&
      isVerticalScrollport(preferredContainer)
      ? preferredContainer
      : null
    : nearestScrollport(question);
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

  if (!container) {
    // Standalone mobile forms still scroll with the document.
    question.scrollIntoView({ block, behavior });
    return;
  }

  const questionBounds = question.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const style = getComputedStyle(question);
  const marginTop = Number.parseFloat(style.scrollMarginTop) || 0;
  const marginBottom = Number.parseFloat(style.scrollMarginBottom) || 0;
  const centerOffset =
    block === "center"
      ? Math.max(
          0,
          (container.clientHeight -
            questionBounds.height -
            marginTop -
            marginBottom) /
            2,
        )
      : 0;

  container.scrollTo({
    top:
      container.scrollTop +
      questionBounds.top -
      containerBounds.top -
      container.clientTop -
      marginTop -
      centerOffset,
    behavior,
  });
}
