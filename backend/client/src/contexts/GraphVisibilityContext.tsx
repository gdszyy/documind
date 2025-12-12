import { createContext, useContext, useState, ReactNode } from "react";

interface GraphVisibilityContextType {
  visibleEntityIds: Set<number> | null;
  setVisibleEntityIds: (ids: Set<number> | null) => void;
}

const GraphVisibilityContext = createContext<GraphVisibilityContextType | undefined>(undefined);

export function GraphVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibleEntityIds, setVisibleEntityIds] = useState<Set<number> | null>(null);

  return (
    <GraphVisibilityContext.Provider value={{ visibleEntityIds, setVisibleEntityIds }}>
      {children}
    </GraphVisibilityContext.Provider>
  );
}

export function useGraphVisibility() {
  const context = useContext(GraphVisibilityContext);
  if (context === undefined) {
    throw new Error("useGraphVisibility must be used within a GraphVisibilityProvider");
  }
  return context;
}
