import { MutableRefObject, useEffect, useRef, useState } from "react";

/**
 * Check if an element is in viewport
 * @param {number} offset - Number of pixels up to the observable element from the top
 *
 * **Usage Example:**
 * ```tsx
 * const [isVisible, elementRef] = useVisibility(-200);
 *
 * useEffect(() => {
 *     // do something.
 * }, [isVisible]);
 *
 * return (
 *     ...
 *     <Element ref={elementRef} />
 *     ...
 * );
 * ```
 */
export default function useVisibility<Element extends HTMLElement>(
  offset = 0,
): [boolean, MutableRefObject<Element | undefined>] {
  const [isVisible, setIsVisible] = useState(false);
  const currentElement = useRef<Element>();

  const onScroll = () => {
    if (!currentElement.current) {
      setIsVisible(false);
      return;
    }
    const top = currentElement.current.getBoundingClientRect().top;
    setIsVisible(top + offset >= 0 && top - offset <= window.innerHeight);
  };

  useEffect(() => {
    onScroll();
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [currentElement.current]);

  return [isVisible, currentElement];
}
