import { ReactNode, createContext, useContext, useState } from "react";

import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

interface EncounterContextBase {
  encounter?: Encounter;
  patient?: Patient;
}

type EncounterContextType<T> = EncounterContextBase &
  T & {
    setValue: <K extends keyof (EncounterContextBase & T)>(
      key: K,
      value: (EncounterContextBase & T)[K],
    ) => void;
  };

const EncounterContext = createContext<
  EncounterContextType<object> | undefined
>(undefined);

export const useEncounter = <T extends object = object>() => {
  const context = useContext(EncounterContext);

  if (!context) {
    throw new Error(
      "'useEncounter' must be used within 'EncounterProvider' only",
    );
  }

  return context as EncounterContextType<T>;
};

interface EncounterProviderProps<T extends object> {
  children: ReactNode;
  initialContext?: Partial<EncounterContextBase & T>;
}

export const EncounterProvider = <T extends object = object>({
  children,
  initialContext = {},
}: EncounterProviderProps<T>) => {
  const [state, setState] = useState<EncounterContextBase & T>(
    initialContext as EncounterContextBase & T,
  );

  const setValue = <K extends keyof (EncounterContextBase & T)>(
    key: K,
    value: (EncounterContextBase & T)[K],
  ) => {
    setState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  return (
    <EncounterContext.Provider
      value={
        {
          ...state,
          setValue,
        } as EncounterContextType<T>
      }
    >
      {children}
    </EncounterContext.Provider>
  );
};
