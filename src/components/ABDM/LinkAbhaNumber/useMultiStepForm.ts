import {
  Dispatch,
  ReactElement,
  SetStateAction,
  cloneElement,
  useCallback,
  useMemo,
  useState,
} from "react";

export interface InjectedStepProps<T> {
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  next: () => void;
  prev: () => void;
  goTo: (step: number) => void;
  memory: T | null;
  setMemory: Dispatch<SetStateAction<T>>;
}

export default function useMultiStepForm<T>(
  steps: ReactElement[],
  initialValues?: T,
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [memory, setMemory] = useState<T>(initialValues as T);

  const next = useCallback(
    () =>
      setCurrentStepIndex((prev) =>
        steps.length - 1 > prev ? prev + 1 : prev,
      ),
    [steps.length],
  );

  const prev = useCallback(
    () => setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev)),
    [],
  );

  const goTo = useCallback(
    (step: number) =>
      setCurrentStepIndex((prev) =>
        step >= 0 && step <= steps.length - 1 ? step : prev,
      ),
    [steps.length],
  );

  const options = useMemo(
    () => ({
      currentStepIndex,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === steps.length - 1,
      next,
      prev,
      goTo,
      memory,
      setMemory,
    }),
    [currentStepIndex, memory, next, prev, goTo, steps.length],
  );

  const currentStep = cloneElement(steps[currentStepIndex], {
    ...options,
    ...steps[currentStepIndex].props,
  });

  return { currentStep, ...options };
}
