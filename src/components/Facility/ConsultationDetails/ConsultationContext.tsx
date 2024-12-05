import { ReactNode, createContext, useContext, useState } from "react";

import { ConsultationModel } from "@/components/Facility/models";
import { PatientModel } from "@/components/Patient/models";

import { PLUGIN_Component } from "@/PluginEngine";

interface ConsultationContextBase {
  consultation?: ConsultationModel;
  patient?: PatientModel;
}

type ConsultationContextType<T> = ConsultationContextBase &
  T & {
    setValue: <K extends keyof (ConsultationContextBase & T)>(
      key: K,
      value: (ConsultationContextBase & T)[K],
    ) => void;
  };

const ConsultationContext = createContext<
  ConsultationContextType<object> | undefined
>(undefined);

export const useConsultation = <T extends object = object>() => {
  const context = useContext(ConsultationContext);

  if (!context) {
    throw new Error(
      "'useConsultation' must be used within 'ConsultationProvider' only",
    );
  }

  return context as ConsultationContextType<T>;
};

interface ConsultationProviderProps<T extends object> {
  children: ReactNode;
  initialContext?: Partial<ConsultationContextBase & T>;
}

export const ConsultationProvider = <T extends object = object>({
  children,
  initialContext = {},
}: ConsultationProviderProps<T>) => {
  const [state, setState] = useState<ConsultationContextBase & T>(
    initialContext as ConsultationContextBase & T,
  );

  const setValue = <K extends keyof (ConsultationContextBase & T)>(
    key: K,
    value: (ConsultationContextBase & T)[K],
  ) => {
    setState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  return (
    <ConsultationContext.Provider
      value={
        {
          ...state,
          setValue,
        } as ConsultationContextType<T>
      }
    >
      <PLUGIN_Component __name="ConsultationContextEnabler" />
      {children}
    </ConsultationContext.Provider>
  );
};
