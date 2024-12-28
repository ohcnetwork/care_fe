import { useCallback, useState } from "react";

import { useValueInjection } from "./useValueInjectionObserver";

export default function ScribeStructuredInput<T = unknown>(props: {
  name: string;
  prompt: string;
  example: unknown;
  value: T;
  onChange: (value: T | undefined) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { name, prompt, example, value, onChange, children, className } = props;
  const [element, setElement] = useState<HTMLElement | null>(null);

  const callbackRef = useCallback(
    (node: HTMLElement | null) => setElement(node),
    [],
  );

  useValueInjection<T>({
    targetElement: element,
    onChange,
  });

  return (
    <div
      ref={callbackRef}
      data-scribe-structured-input
      data-scribe-name={name}
      data-scribe-prompt={prompt}
      data-scribe-example={JSON.stringify(example)}
      data-scribe-value={JSON.stringify(value)}
      className={className}
    >
      {children}
    </div>
  );
}
