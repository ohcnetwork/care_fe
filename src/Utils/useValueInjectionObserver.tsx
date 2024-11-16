import { useEffect, useState } from "react";

/**
 * A custom React hook that observes changes to a specific attribute of a DOM element
 * and returns a new value when the attribute changes. It is primarily useful
 * for detecting updates to the value of a custom CUI component through layers where
 * the component's state cannot be determined or mutated (example. CARE Scribe).
 *
 * @template T
 * @param {Object} options - Configuration options for the observer.
 * @param {HTMLElement | null} options.targetElement - The DOM element to observe for attribute changes.
 * @param {string} [options.attribute="value"] - The name of the attribute to observe (default is "value").
 *
 * @example
 * const targetElement = document.getElementById('my-input');
 * const DOMValue = useValueInjectionObserver({
 *   targetElement: targetElement,
 *   attribute: 'value',
 * });
 *
 * @returns {unknown} This hook returns the current value of the attribute.
 */
export function useValueInjectionObserver<T = unknown>(options: {
  targetElement: HTMLElement | null;
  attribute?: string;
}) {
  const { targetElement, attribute = "value" } = options;
  const [value, setValue] = useState<T>();

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === attribute
        ) {
          const newValue = JSON.parse(
            targetElement?.getAttribute(attribute) || '""',
          );
          setValue(newValue);
        }
      });
    });

    const config = {
      attributes: true,
      attributeFilter: [attribute],
    };

    targetElement && observer.observe(targetElement, config);
    return () => observer.disconnect();
  }, [targetElement]);

  return value;
}
