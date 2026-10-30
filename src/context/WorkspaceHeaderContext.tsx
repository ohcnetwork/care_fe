import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface WorkspaceHeaderContextValue {
  target: HTMLDivElement | null;
  setTarget: (target: HTMLDivElement | null) => void;
  hasContent: boolean;
  register: (id: string) => () => void;
}

const WorkspaceHeaderContext =
  createContext<WorkspaceHeaderContextValue | null>(null);

export function WorkspaceHeaderProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [contributors, setContributors] = useState<Set<string>>(new Set());
  const register = useCallback((id: string) => {
    setContributors((current) => new Set(current).add(id));
    return () => {
      setContributors((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    };
  }, []);
  const hasContent = contributors.size > 0;
  const value = useMemo(
    () => ({ target, setTarget, hasContent, register }),
    [target, hasContent, register],
  );

  return (
    <WorkspaceHeaderContext.Provider value={value}>
      {children}
    </WorkspaceHeaderContext.Provider>
  );
}

export function useWorkspaceHeader() {
  const context = useContext(WorkspaceHeaderContext);
  if (!context) {
    throw new Error(
      "Workspace header content must be inside WorkspaceHeaderProvider",
    );
  }
  return context;
}
