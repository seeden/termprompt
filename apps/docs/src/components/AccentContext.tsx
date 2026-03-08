'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type AccentContextValue = {
  accent: string;
  setAccent: (color: string) => void;
};

const AccentContext = createContext<AccentContextValue>({
  accent: '#22d3ee',
  setAccent: () => {},
});

export function useAccent() {
  return useContext(AccentContext);
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccent] = useState('#22d3ee');

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      <div style={{ '--tp-accent': accent } as React.CSSProperties}>
        {children}
      </div>
    </AccentContext.Provider>
  );
}
